# Task Hub

서버·데이터베이스 없이 로컬에서만 쓰는 개인 업무 관리 도구.
업무 보드(칸반) · 캘린더 · 미팅/1:1 노트 · 완료 업무(성과 기록) · 북마크를 한 곳에서 관리한다.

모든 데이터는 브라우저 localStorage에 저장되며, 외부로 전송되지 않는다.

## 시작하기

Node.js 18 이상이 필요하다. ([nodejs.org](https://nodejs.org) 또는 `brew install node`)

```bash
git clone https://github.com/mingzz1/task-hub.git
cd task-hub
npm install
npm run dev        # 개발 서버 — http://localhost:5173
```

## 빌드 (단일 HTML 파일)

```bash
npm run build
```

`dist/index.html` **파일 하나**가 생성된다. 폰트까지 전부 인라인되어 있어서
인터넷 없이 브라우저에서 더블클릭으로 열면 바로 동작한다.
평소에는 이 파일만 열어서 쓰면 되고, 코드를 고쳤을 때만 다시 빌드하면 된다.

## 데이터 백업 · 컴퓨터 간 이동

데이터는 git에 포함되지 않는다 (브라우저 localStorage에만 존재).
다른 컴퓨터로 데이터를 옮기려면:

1. 사이드바 하단 **데이터 내보내기** → `task-hub-backup-날짜.json` 다운로드
2. 옮길 컴퓨터에서 **데이터 가져오기** → 해당 파일 선택

같은 컴퓨터라도 개발 서버(`localhost:5173`)와 `dist/index.html`(`file://`)은
저장소가 분리되어 있으므로, 양쪽을 오갈 때도 같은 방법을 쓴다.

## 키보드 단축키

| 키 | 동작 |
|---|---|
| `/` | 검색창 포커스 |
| `n` | 새 업무 추가 |
| `1`–`5` | 보드 / 캘린더 / 완료·성과 / 미팅·1:1 / 북마크 전환 |
| `Esc` | 열린 업무 상세 닫기 |

## 프로젝트 구조

```
index.html          Vite 진입점
vite.config.js      단일 파일 빌드 설정 (vite-plugin-singlefile)
src/
  main.jsx          마운트 + 폰트/스타일 로드
  App.jsx           셸 · 상태 · 라우팅 · 백업(내보내기/가져오기)
  store.js          데이터 스키마 · 샘플 데이터 · localStorage 저장
  primitives.jsx    공용 컴포넌트 + 날짜 유틸
  icons.jsx         SVG 아이콘
  BoardView.jsx     칸반 보드 (드래그 앤 드롭)
  CalendarView.jsx  월간 캘린더 (마감일 + 미팅)
  MeetingsView.jsx  미팅 일정 · 안건 · 노트
  ReviewView.jsx    완료 업무 — 분기별 성과 기록 (마크다운 복사)
  BookmarksView.jsx 카테고리별 북마크
  TaskDetail.jsx    업무 상세 편집 시트
  TaskCard.jsx      보드 카드
legacy/             이전 무빌드(CDN) 버전 보관용
```

## 기술 스택

- React 18 + Vite 6 — 빌드 시 `vite-plugin-singlefile`로 단일 HTML 출력
- Pretendard 폰트 (npm 패키지, 번들에 인라인)
- 저장소: localStorage (키 `mgr_taskhub_v3`) + JSON 내보내기/가져오기
