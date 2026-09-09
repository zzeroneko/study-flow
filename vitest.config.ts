import { defineConfig } from "vitest/config";

const shared = {
  fileParallelism: false,
  maxWorkers: 1,
  testTimeout: 120_000,
  hookTimeout: 300_000,
} as const;

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          ...shared,
          name: "integration-tests:desktop-cdp",
          globalSetup: ["./test/integration-global-setup.desktop.ts"],
          include: ["test/integration/desktop.integration.test.ts"],
          environmentOptions: {
            obsidianTransport: {
              type: "obsidian-cdp",
            },
          },
        },
      },
      {
        test: {
          ...shared,
          name: "integration-tests:android-appium",
          globalSetup: ["./test/integration-global-setup.android.ts"],
          include: ["test/integration/android.integration.test.ts"],
          environmentOptions: {
            obsidianTransport: {
              type: "obsidian-android-appium",
              appiumUrl: "http://localhost:4723",
              avdName: "studyvault_test",
              webviewTimeoutInMilliseconds: 120_000,
            },
          },
        },
      },
    ],
  },
});
