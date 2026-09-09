#Requires -Version 5.1
<#
.SYNOPSIS
  Idempotent Android emulator + Appium + Obsidian APK bootstrap for StudyVault tests.
  Prefers the already-installed SDK image when cmdline-tools cannot be downloaded.
#>
$ErrorActionPreference = "Stop"

$SdkRoot = if ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } elseif ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA "Android\Sdk" }
$AvdName = "studyvault_test"
$ExistingImageRel = "system-images\android-37.0\google_apis_playstore_ps16k\x86_64"
$ObsidianVersion = "1.12.7"
$ObsidianApkUrl = "https://github.com/obsidianmd/obsidian-releases/releases/download/v$ObsidianVersion/Obsidian-$ObsidianVersion.apk"
$ObsidianApkSha256 = "74a0741f43b0ebb2e8777d4c22b2c33830a97b6be284385e53c3586117136f84"
$PluginRoot = Split-Path -Parent $PSScriptRoot
$ArtifactsDir = Join-Path $PluginRoot "test-artifacts\android"
$ApkPath = Join-Path $ArtifactsDir "Obsidian-$ObsidianVersion.apk"

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Ensure-Dir([string]$Path) {
  if (-not (Test-Path $Path)) {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
  }
}

function Add-PathOnce([string]$Path) {
  if (-not $Path) { return }
  if (-not (Test-Path $Path)) { return }
  $parts = $env:Path -split ";" | Where-Object { $_ -and $_.Trim() }
  if ($parts -notcontains $Path) {
    $env:Path = "$Path;$env:Path"
  }
}

function Download-File([string]$Url, [string]$OutFile) {
  Write-Host "Downloading $Url"
  $dir = Split-Path -Parent $OutFile
  Ensure-Dir $dir
  if (Test-Path $OutFile) { Remove-Item -Force -Recurse $OutFile }
  & curl.exe -L --retry 3 --retry-delay 2 --connect-timeout 30 --max-time 600 --output $OutFile $Url
  if ($LASTEXITCODE -ne 0) {
    throw "curl failed for $Url with exit code $LASTEXITCODE"
  }
  if (-not (Test-Path $OutFile) -or (Get-Item $OutFile).Length -lt 1024) {
    throw "Download produced empty/missing file: $OutFile"
  }
}

function Ensure-Avd {
  Write-Step "Ensuring AVD '$AvdName'"
  $emulator = Join-Path $SdkRoot "emulator\emulator.exe"
  if (-not (Test-Path $emulator)) { throw "emulator.exe missing at $emulator" }

  $existing = & $emulator -list-avds 2>$null
  if ($existing -contains $AvdName) {
    Write-Host "AVD already listed: $AvdName"
    return
  }

  $imageDir = Join-Path $SdkRoot $ExistingImageRel
  if (-not (Test-Path (Join-Path $imageDir "system.img"))) {
    throw "No usable system image at $imageDir. Install an Android system image via Android Studio SDK Manager."
  }

  $avdRoot = Join-Path $env:USERPROFILE ".android\avd"
  $avdDir = Join-Path $avdRoot "$AvdName.avd"
  $iniPath = Join-Path $avdRoot "$AvdName.ini"
  Ensure-Dir $avdDir

  $escapedAvdDir = $avdDir -replace '\\', '\\'
  @"
avd.ini.encoding=UTF-8
path=$escapedAvdDir
path.rel=avd\$AvdName.avd
target=android-37
"@ | Set-Content -Path $iniPath -Encoding ASCII

  $imageSysdir = ($ExistingImageRel -replace '\\', '/') + "/"
  @"
AvdId=$AvdName
PlayStore.enabled=true
abi.type=x86_64
avd.ini.displayname=$AvdName
avd.ini.encoding=UTF-8
disk.dataPartition.size=6G
hw.accelerometer=yes
hw.audioInput=yes
hw.battery=yes
hw.camera.back=virtualscene
hw.camera.front=emulated
hw.cpu.arch=x86_64
hw.cpu.ncore=4
hw.device.manufacturer=Google
hw.device.name=pixel_7
hw.gps=yes
hw.gpu.enabled=yes
hw.gpu.mode=auto
hw.initialOrientation=portrait
hw.keyboard=yes
hw.lcd.density=420
hw.lcd.height=2400
hw.lcd.width=1080
hw.mainKeys=no
hw.ramSize=4096
hw.sdCard=yes
hw.sensors.orientation=yes
hw.sensors.proximity=yes
hw.trackBall=no
image.sysdir.1=$imageSysdir
runtime.network.latency=none
runtime.network.speed=full
showDeviceFrame=yes
tag.display=Google APIs PlayStore
tag.id=google_apis_playstore
vm.heapSize=512
"@ | Set-Content -Path (Join-Path $avdDir "config.ini") -Encoding ASCII

  Write-Host "AVD created at $avdDir"
}

function Download-ObsidianApk {
  Write-Step "Downloading Obsidian $ObsidianVersion APK"
  Ensure-Dir $ArtifactsDir
  if (Test-Path $ApkPath) {
    $hash = (Get-FileHash $ApkPath -Algorithm SHA256).Hash.ToLower()
    if ($hash -eq $ObsidianApkSha256) {
      Write-Host "APK already present and verified"
      return
    }
    Remove-Item -Force $ApkPath
  }

  Download-File $ObsidianApkUrl $ApkPath
  $hash = (Get-FileHash $ApkPath -Algorithm SHA256).Hash.ToLower()
  if ($hash -ne $ObsidianApkSha256) {
    throw "Obsidian APK checksum mismatch. Expected $ObsidianApkSha256, got $hash"
  }
  Write-Host "APK verified: $ApkPath"
}

function Install-AppiumLocal {
  Write-Step "Installing Appium + UiAutomator2 in plugin project"
  Push-Location $PluginRoot
  $prev = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    npm install --save-dev appium appium-uiautomator2-driver
    if ($LASTEXITCODE -ne 0) { throw "npm install appium failed" }
    npx --yes appium driver install uiautomator2 2>&1 | Out-Host
    # Already-installed is fine
    npx --yes appium driver list --installed 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) {
      Write-Warning "appium driver list returned $LASTEXITCODE"
    }
  } finally {
    $ErrorActionPreference = $prev
    Pop-Location
  }
}

function Start-EmulatorIfNeeded {
  Write-Step "Checking emulator / ADB"
  $adb = Join-Path $SdkRoot "platform-tools\adb.exe"
  $emulator = Join-Path $SdkRoot "emulator\emulator.exe"
  if (-not (Test-Path $adb)) { throw "adb.exe missing at $adb" }

  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    & $emulator -accel-check
    $avds = & $emulator -list-avds
    if ($avds -notcontains $AvdName) {
      throw "AVD '$AvdName' not listed by emulator. Got: $($avds -join ', ')"
    }

    & $adb start-server | Out-Null
    $devices = & $adb devices 2>&1 | Out-String
    if ($devices -match "emulator-\d+\s+device") {
      Write-Host "Emulator already online"
      return
    }

    # Clear stale emulator processes / AVD locks from previous failed runs
    Get-Process -Name "qemu-system*","emulator","emulator64*" -ErrorAction SilentlyContinue |
      Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    $lockGlob = Join-Path $env:USERPROFILE ".android\avd\$AvdName.avd\*lock*"
    Get-ChildItem $lockGlob -Force -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue

    Write-Host "Starting emulator $AvdName (first boot may take several minutes)..."
    $logPath = Join-Path $ArtifactsDir "emulator-boot.log"
    if (Test-Path $logPath) { Remove-Item -Force $logPath }
    $outPath = Join-Path $ArtifactsDir "emulator-boot.out.log"
    if (Test-Path $outPath) { Remove-Item -Force $outPath }
    $proc = Start-Process -FilePath $emulator -ArgumentList @(
      "-avd", $AvdName,
      "-no-snapshot-save",
      "-no-boot-anim",
      "-gpu", "auto"
    ) -PassThru -WindowStyle Minimized -RedirectStandardOutput $outPath -RedirectStandardError $logPath

    $deadline = (Get-Date).AddMinutes(10)
    $deviceReady = $false
    do {
      Start-Sleep -Seconds 5
      if ($proc.HasExited) {
        $errLog = if (Test-Path $logPath) { Get-Content $logPath -Raw } else { "" }
        $outLog = if (Test-Path $outPath) { Get-Content $outPath -Raw } else { "" }
        throw "Emulator process exited early with code $($proc.ExitCode). STDERR:`n$errLog`nSTDOUT:`n$outLog"
      }

      $deviceList = & $adb devices 2>&1 | Out-String
      if ($deviceList -match "emulator-\d+\s+device") {
        $boot = (& $adb shell getprop sys.boot_completed 2>&1 | Out-String).Trim()
        if ($boot -eq "1") {
          $deviceReady = $true
          break
        }
      }
      Write-Host "Waiting for boot... ($([int]((Get-Date) - $proc.StartTime).TotalSeconds)s)"
    } while ((Get-Date) -lt $deadline)

    if (-not $deviceReady) {
      $log = if (Test-Path $logPath) { Get-Content $logPath -Raw } else { "" }
      throw "Emulator did not finish booting within timeout. Log:`n$log"
    }

    & $adb shell settings put global hide_error_dialogs 1 2>&1 | Out-Null
    & $adb wait-for-device 2>&1 | Out-Null
    Write-Host "Emulator booted"
  } finally {
    $ErrorActionPreference = $prev
  }
}

function Install-ObsidianOnDevice {
  Write-Step "Installing Obsidian on emulator"
  $adb = Join-Path $SdkRoot "platform-tools\adb.exe"
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    & $adb install -r $ApkPath
    if ($LASTEXITCODE -ne 0) {
      throw "adb install Obsidian failed"
    }
    & $adb shell appops set md.obsidian MANAGE_EXTERNAL_STORAGE allow 2>&1 | Out-Null
    & $adb shell pm grant md.obsidian android.permission.READ_EXTERNAL_STORAGE 2>&1 | Out-Null
    & $adb shell pm grant md.obsidian android.permission.WRITE_EXTERNAL_STORAGE 2>&1 | Out-Null
    Write-Host "Obsidian installed and storage permission granted"
  } finally {
    $ErrorActionPreference = $prev
  }
}

# --- main ---
$env:ANDROID_SDK_ROOT = $SdkRoot
$env:ANDROID_HOME = $SdkRoot
Ensure-Dir $SdkRoot
Ensure-Dir $ArtifactsDir
Add-PathOnce (Join-Path $SdkRoot "platform-tools")
Add-PathOnce (Join-Path $SdkRoot "emulator")

# Clean leftover broken download from previous attempt
$badZip = Join-Path $env:TEMP "android-cmdline-tools.zip"
if (Test-Path $badZip) { Remove-Item -Force -Recurse $badZip -ErrorAction SilentlyContinue }

Ensure-Avd
Download-ObsidianApk
Install-AppiumLocal
Start-EmulatorIfNeeded
Install-ObsidianOnDevice

Write-Step "Environment summary"
Write-Host "ANDROID_SDK_ROOT=$SdkRoot"
Write-Host "AVD=$AvdName"
Write-Host "APK=$ApkPath"
Write-Host ""
Write-Host "Android bootstrap complete." -ForegroundColor Green
