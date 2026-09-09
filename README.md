# StudyFlow

StudyFlow는 Daily 노트, 수업·프로젝트 노트, 과목 추가, 대시보드, 과제, 개인 공부 기능을 하나의 플러그인으로 제공합니다.
노트 템플릿은 플러그인에 내장되어 외부 템플릿 폴더가 필요하지 않습니다.
`30_Personal/` 아래의 개인 공부 노트는 `univvault-list`의 `kind: personal`로 확인할 수 있으며,
해당 폴더의 마감 과제는 대시보드의 과제 목록에 포함됩니다.

## 명령

| ID | 설명 |
| --- | --- |
| `study-flow:daily` | Daily |
| `study-flow:lecture` | 수업 노트 |
| `study-flow:quick-lecture` | 빠른 강의 기록 (제목·내용·할 일) |
| `study-flow:course-view` | 과목 통합 보기 (최근 강의·과제·다음 시간표) |
| `study-flow:add-course` | 과목 추가 |
| `study-flow:check-integrity` | 데이터 무결성 검사 및 안전한 timestamp 수정 |

대시보드에서는 기한이 지난 과제, 오늘 과제, 7일 내 예정 과제를 그룹별로 확인할 수 있습니다.
대시보드는 등록된 과목의 오늘 시간표, 과제, 수강 중 과목을 한 곳에서 보여 줍니다.
빠른 강의 기록은 대시보드의 버튼이나 명령 팔레트에서 열 수 있으며, 생성된 노트는 기존 과목의
`Lectures` 폴더에 저장됩니다. 무결성 검사는 문제를 삭제하거나 추측해서 고치지 않고,
누락된 `created`/`updated`만 안전하게 보완합니다. 잘못된 과목 메타데이터, 깨진 생성 링크,
중복/위치가 잘못된 파일은 보고만 하므로 사용자가 직접 판단할 수 있습니다.

설정의 후원 링크는 `https://github.com/sponsors/zzeroneko`로 연결됩니다.
설정의 **언어**에서 한국어 또는 English를 선택할 수 있습니다. 처음 설치할 때는 Obsidian이
한국어(`ko`)로 설정된 경우에만 한국어를 사용하며, 영어를 포함한 그 밖의 모든 로케일은 English를
사용합니다. 설정을 저장하면 선택한 언어가 우선하며, 한국어는 `ko`를 명시적으로 선택한 경우에만
사용됩니다. 대시보드, 명령어, 모달, 알림, 무결성 검사 및 새로 생성하는 템플릿에 적용됩니다.
기존 노트의 내용과 폴더명은 자동으로 번역하거나 변경하지 않습니다.

## 개발

```bash
cd .obsidian/plugins/study-flow
npm install
npm run build
npm run test:all
```
