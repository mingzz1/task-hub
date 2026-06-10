/* ============================================================
   Data store + sample data + localStorage persistence
   Exposes window.AppData   (schema v2)
   ============================================================ */
(function () {
  const STORE_KEY = "mgr_taskhub_v3";

  const uid = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // date helpers relative to "today"
  const TODAY = new Date();
  TODAY.setHours(0, 0, 0, 0);
  function iso(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  function d(offsetDays) {
    const x = new Date(TODAY);
    x.setDate(x.getDate() + offsetDays);
    return iso(x);
  }
  // most recent past (or today) occurrence of a weekday (0=Sun..6=Sat)
  function lastWeekday(wd) {
    const x = new Date(TODAY);
    const diff = (x.getDay() - wd + 7) % 7;
    x.setDate(x.getDate() - diff);
    return iso(x);
  }

  // ---- Status columns (보드) ----
  const COLUMNS = [
    { id: "backlog", label: "백로그", hint: "해야 할 것", color: "var(--st-backlog)", bg: "var(--st-backlog-bg)" },
    { id: "inprogress", label: "진행 중", hint: "", color: "var(--st-prog)", bg: "var(--st-prog-bg)" },
    { id: "waiting", label: "응답 대기", hint: "남의 답을 기다림", color: "var(--st-wait)", bg: "var(--st-wait-bg)" },
    { id: "toask", label: "질문할 것", hint: "누구에게", color: "var(--st-ask)", bg: "var(--st-ask-bg)" },
    { id: "hold", label: "보류·나중에", hint: "", color: "var(--st-hold)", bg: "var(--st-hold-bg)" },
    { id: "done", label: "완료", hint: "", color: "var(--st-done)", bg: "var(--st-done-bg)" },
  ];

  // ---- People (avatar colors) ----
  const PEOPLE = {
    "이선임": "oklch(0.55 0.13 250)",
    "최주임": "oklch(0.55 0.13 150)",
    "박매니저": "oklch(0.55 0.13 300)",
    "김부장": "oklch(0.5 0.12 30)",
    "정PO": "oklch(0.55 0.13 195)",
    "한CTO": "oklch(0.45 0.1 60)",
    "윤디자이너": "oklch(0.55 0.13 330)",
    "데이터팀": "oklch(0.5 0.08 110)",
    "보안팀": "oklch(0.5 0.1 20)",
  };

  // ---- Projects / categories ----
  const projects = [
    { id: "p_lead", name: "리더십·피플", color: "oklch(0.55 0.13 300)" },
    { id: "p_hire", name: "채용", color: "oklch(0.55 0.13 150)" },
    { id: "p_okr", name: "분기 OKR", color: "oklch(0.52 0.13 264)" },
    { id: "p_platform", name: "플랫폼 개편(IC)", color: "oklch(0.52 0.11 250)" },
    { id: "p_ops", name: "운영·장애", color: "oklch(0.55 0.15 30)" },
    { id: "p_admin", name: "행정·보고", color: "oklch(0.55 0.02 80)" },
  ];

  // ---- Meetings (1회성 / 반복 / 시리즈) ----
  // kind: "recurring" { weekday, time, everyWeeks, anchor }
  //       "oneoff"    { date, time }
  //       "series"    { sessions: [{ id, date, time, label }] }
  const meetings = [
    {
      id: "m_lee", name: "이선임 1:1", person: "이선임", color: "oklch(0.55 0.13 250)",
      kind: "recurring", weekday: 2, time: "16:00", everyWeeks: 1, anchor: lastWeekday(2),
      agenda: [
        { id: uid(), text: "설계 리뷰 리딩 — 본인 의향 확인 (부담스러워하지 않는 톤으로)", done: false },
        { id: uid(), text: "Rust 스터디 교육비 지원 가능 여부 회신", done: false },
      ],
      notes: [
        { id: uid(), date: d(-7), text: "· 결제 모듈 리팩터링 진행도 70%. 테스트 커버리지 보강 중.\n· 커리어: 백엔드 심화 → 시스템 설계 쪽 관심. 다음 분기 설계 리뷰 리딩 맡겨보기로.\n· 번아웃 신호 없음. 업무량 적정." },
        { id: uid(), date: d(-14), text: "· 온콜 로테이션 부담 토로. 야간 알림 임계치 조정 합의.\n· 사이드 스터디(Rust) 회사 지원 가능한지 확인 요청 받음 → 교육비 정책 확인할 것." },
      ],
    },
    {
      id: "m_choi", name: "최주임 1:1", person: "최주임", color: "oklch(0.55 0.13 150)",
      kind: "recurring", weekday: 4, time: "11:00", everyWeeks: 2, anchor: lastWeekday(4),
      agenda: [
        { id: uid(), text: "코드리뷰 참여도 — 다음 목표 합의", done: false },
      ],
      notes: [
        { id: uid(), date: d(-9), text: "· 입사 3개월차 적응 순조. 온보딩 문서 피드백 정리해줌 → 위키 반영.\n· 첫 단독 기능(알림 설정) 배포 성공. 칭찬 전달.\n· 다음 목표: 코드리뷰 적극 참여, 도메인 지식 확장." },
      ],
    },
    {
      id: "m_kim", name: "김부장 1:1 (상향)", person: "김부장", color: "oklch(0.5 0.12 30)",
      kind: "recurring", weekday: 5, time: "14:00", everyWeeks: 1, anchor: lastWeekday(5),
      agenda: [
        { id: uid(), text: "헤드카운트 추가 승인 — 최종 결정 확인", done: false },
        { id: uid(), text: "IC 비중 줄이고 위임 늘리기 — 진행 상황 공유", done: false },
      ],
      notes: [
        { id: uid(), date: d(-4), text: "· 팀 헤드카운트 1명 추가 승인 건 — 다음 주 결정 예정.\n· 내 매니저 전환 6개월 체크인: IC 비중 줄이고 위임 늘리라는 피드백.\n· Q3 OKR 초안 방향성 공유, 큰 틀 OK." },
      ],
    },
    {
      id: "m_weekly", name: "팀 위클리", person: "팀 전체", color: "oklch(0.5 0.09 195)",
      kind: "recurring", weekday: 1, time: "10:00", everyWeeks: 1, anchor: lastWeekday(1),
      agenda: [
        { id: uid(), text: "결제 안정화 vs 알림 개편 — 우선순위 한 번 더 합의", done: false },
        { id: uid(), text: "QA 병목 개선 액션 공유", done: false },
      ],
      notes: [
        { id: uid(), date: d(-1), text: "· 스프린트 23 회고: 배포 빈도 개선, QA 병목 여전.\n· 다음 스프린트 우선순위 = 결제 안정화 > 알림 개편." },
      ],
    },
    {
      id: "m_guild", name: "플랫폼 길드 싱크", person: "정PO · 타팀", color: "oklch(0.52 0.13 264)",
      kind: "recurring", weekday: 3, time: "15:00", everyWeeks: 2, anchor: lastWeekday(3),
      agenda: [
        { id: uid(), text: "공통 인증 모듈 일정 조율 — 우리 마이그레이션 의존성", done: false },
      ],
      notes: [],
    },
    {
      id: "m_skip", name: "한CTO 스킵레벨", person: "한CTO", color: "oklch(0.45 0.1 60)",
      kind: "oneoff", date: d(4), time: "13:30",
      agenda: [
        { id: uid(), text: "매니저 전환 6개월 — 커리어 방향 상담", done: false },
        { id: uid(), text: "팀 헤드카운트 확대 필요성 어필", done: false },
      ],
      notes: [],
    },
    {
      id: "m_panel", name: "백엔드 채용 인터뷰 라운드", person: "채용 패널", color: "oklch(0.55 0.13 150)",
      kind: "series", sessions: [
        { id: uid(), date: d(1), time: "14:00", label: "1차 — 코딩 인터뷰" },
        { id: uid(), date: d(6), time: "11:00", label: "2차 — 시스템 설계" },
        { id: uid(), date: d(9), time: "16:00", label: "최종 — 컬처핏" },
      ],
      agenda: [
        { id: uid(), text: "패널 간 평가 기준 정렬 — 시니어 레벨 기대치", done: false },
        { id: uid(), text: "디브리프 일정 확정", done: false },
      ],
      notes: [
        { id: uid(), date: d(-2), text: "· 패널 4명 확정(이선임 포함). 평가 루브릭 공유 완료.\n· 1차는 라이브 코딩, 2차 화이트보드 설계로 진행." },
      ],
    },
  ];

  // ---- Tasks ----
  const tasks = [
    // 진행 중
    { id: uid(), title: "결제 모듈 리팩터링 코드리뷰 마무리", status: "inprogress", priority: "high", due: d(1), people: ["이선임"], project: "p_platform", meetingId: null, notes: "PR #482. 트랜잭션 경계 부분 한 번 더 확인 필요. 머지 전 스테이징 부하 테스트.", checklist: [{ id: uid(), text: "리뷰 코멘트 반영 확인", done: true }, { id: uid(), text: "스테이징 부하 테스트", done: false }, { id: uid(), text: "롤백 플랜 문서화", done: false }], bookmarkIds: ["b_pr"], order: 0 },
    { id: uid(), title: "Q3 OKR 초안 작성", status: "inprogress", priority: "high", due: d(2), people: [], project: "p_okr", meetingId: "m_kim", notes: "팀 목표 3개로 압축. 측정 가능한 KR로. 김부장 1:1에서 방향 확인 받기.", checklist: [{ id: uid(), text: "O1 안정성 지표 정의", done: true }, { id: uid(), text: "O2 채용 목표", done: false }, { id: uid(), text: "O3 플랫폼 마이그레이션", done: false }], bookmarkIds: ["b_okr"], order: 1 },
    { id: uid(), title: "신규 알림센터 API 설계 문서 리뷰", status: "inprogress", priority: "med", due: d(4), people: ["최주임"], project: "p_platform", meetingId: "m_choi", notes: "최주임 첫 설계 문서. 멘토링 관점에서 꼼꼼히 피드백 남기기.", checklist: [], bookmarkIds: [], order: 2 },

    // 응답 대기
    { id: uid(), title: "헤드카운트 추가 승인 — 김부장 회신 대기", status: "waiting", priority: "high", due: d(0), people: ["김부장"], project: "p_hire", meetingId: "m_kim", notes: "지난 금요일 요청. 금요일 1:1 전까지 회신 없으면 직접 리마인드.", checklist: [], bookmarkIds: [], order: 0 },
    { id: uid(), title: "보안팀 — 데이터 접근 권한 검토 요청 회신", status: "waiting", priority: "med", due: d(-1), people: ["보안팀"], project: "p_platform", meetingId: null, notes: "마이그레이션 위해 prod read 권한 필요. 티켓 SEC-1203. 어제까지 받기로 했는데 지연.", checklist: [], bookmarkIds: [], order: 1 },
    { id: uid(), title: "디자인 시안 2차 — 윤디자이너 전달 대기", status: "waiting", priority: "low", due: d(3), people: ["윤디자이너"], project: "p_platform", meetingId: null, notes: "알림 설정 화면. 목요일 공유 예정.", checklist: [], bookmarkIds: ["b_figma"], order: 2 },

    // 질문할 것
    { id: uid(), title: "교육비 정책 — Rust 스터디 지원 가능 여부 (HR)", status: "toask", priority: "low", due: null, people: ["데이터팀"], project: "p_lead", meetingId: null, notes: "이선임이 요청. HR 위키 확인 후 안 되면 직접 문의.", checklist: [], bookmarkIds: ["b_hr"], order: 0 },
    { id: uid(), title: "온콜 보상 정책 — 박매니저에게 확인", status: "toask", priority: "med", due: null, people: ["박매니저"], project: "p_lead", meetingId: null, notes: "다른 팀은 야간 온콜 어떻게 보상하는지. 우리 팀 정책 개선 참고용.", checklist: [], bookmarkIds: [], order: 1 },

    // 백로그
    { id: uid(), title: "팀 스프린트 회고 액션아이템 정리 & 공유", status: "backlog", priority: "med", due: d(5), people: [], project: "p_admin", meetingId: "m_weekly", notes: "QA 병목 개선 액션 포함.", checklist: [], bookmarkIds: [], order: 0 },
    { id: uid(), title: "신규 입사자 온보딩 플랜 템플릿화", status: "backlog", priority: "low", due: null, people: [], project: "p_hire", meetingId: null, notes: "최주임 온보딩 경험 토대로 체크리스트 표준화.", checklist: [{ id: uid(), text: "1주차 셋업 체크리스트", done: false }, { id: uid(), text: "30/60/90 목표 템플릿", done: false }], bookmarkIds: [], order: 1 },
    { id: uid(), title: "결제 장애 포스트모템 후속 — 모니터링 알림 보강", status: "backlog", priority: "med", due: d(8), people: ["이선임"], project: "p_ops", meetingId: null, notes: "지난 장애 재발 방지. 임계치 알림 추가.", checklist: [], bookmarkIds: ["b_dash"], order: 2 },
    { id: uid(), title: "분기 팀 워크샵 일정/안건 잡기", status: "backlog", priority: "low", due: d(14), people: [], project: "p_lead", meetingId: null, notes: "", checklist: [], bookmarkIds: [], order: 3 },

    // 보류
    { id: uid(), title: "레거시 배치 잡 마이그레이션", status: "hold", priority: "low", due: null, people: [], project: "p_platform", meetingId: "m_guild", notes: "공통 인증 모듈 정리된 다음에. 지금은 보류.", checklist: [], bookmarkIds: [], order: 0 },
    { id: uid(), title: "팀 기술 블로그 글 작성", status: "hold", priority: "low", due: null, people: [], project: "p_lead", meetingId: null, notes: "여유 생기면. 리팩터링 사례 소재 좋음.", checklist: [], bookmarkIds: [], order: 1 },

    // 완료 (성과평가용)
    { id: uid(), title: "결제 실패율 2.1% → 0.4% 개선 프로젝트 리딩", status: "done", priority: "high", due: d(-12), completedAt: d(-10), quarter: "2026 Q2", impact: "결제 실패율 분기 초 2.1%에서 0.4%로 80% 감소. 월 환산 약 3,200건 결제 실패 방지. 팀 2명과 협업해 근본 원인(타임아웃 설정) 규명 및 재시도 로직 도입.", people: ["이선임", "최주임"], project: "p_ops", meetingId: null, notes: "", checklist: [], bookmarkIds: [], order: 0 },
    { id: uid(), title: "최주임 온보딩 — 3개월 내 단독 배포 달성", status: "done", priority: "med", due: d(-8), completedAt: d(-6), quarter: "2026 Q2", impact: "신규 입사자가 목표보다 빠른 3개월차에 첫 기능 단독 설계·배포. 온보딩 문서 개선안 5건 도출해 팀 위키 반영.", people: ["최주임"], project: "p_lead", meetingId: null, notes: "", checklist: [], bookmarkIds: [], order: 1 },
    { id: uid(), title: "API 응답시간 p95 320ms → 140ms 최적화", status: "done", priority: "high", due: d(-20), completedAt: d(-18), quarter: "2026 Q2", impact: "핵심 조회 API p95 레이턴시 56% 단축. N+1 쿼리 제거 및 캐시 레이어 도입. IC로 직접 구현.", people: [], project: "p_platform", meetingId: null, notes: "", checklist: [], bookmarkIds: [], order: 2 },
    { id: uid(), title: "Q1 채용 — 백엔드 1명 충원 완료", status: "done", priority: "med", due: d(-70), completedAt: d(-64), quarter: "2026 Q1", impact: "서류 12건 검토, 인터뷰 5명 진행해 시니어 백엔드 1명 채용. 입사 후 안착해 현재 핵심 모듈 담당.", people: [], project: "p_hire", meetingId: null, notes: "", checklist: [], bookmarkIds: [], order: 3 },
    { id: uid(), title: "팀 온콜 프로세스 정립 & 런북 작성", status: "done", priority: "low", due: d(-50), completedAt: d(-45), quarter: "2026 Q1", impact: "온콜 로테이션 및 장애 대응 런북 최초 수립. 평균 장애 대응 시간(MTTR) 체감상 절반으로 단축, 팀원 야간 대응 부담 명문화.", people: ["이선임"], project: "p_ops", meetingId: null, notes: "", checklist: [], bookmarkIds: [], order: 4 },
  ];

  // ---- Bookmarks ----
  const bmCategories = [
    { id: "bc_hr", name: "채용·HR", color: "oklch(0.55 0.13 150)" },
    { id: "bc_tech", name: "기술 문서", color: "oklch(0.52 0.11 250)" },
    { id: "bc_wiki", name: "회사 위키", color: "oklch(0.55 0.13 300)" },
    { id: "bc_metric", name: "대시보드·지표", color: "oklch(0.55 0.15 30)" },
    { id: "bc_pm", name: "기획·디자인", color: "oklch(0.55 0.13 330)" },
  ];
  const bookmarks = [
    { id: "b_pr", title: "결제 모듈 PR #482", url: "github.com/acme/payments/pull/482", category: "bc_tech", note: "리팩터링 메인 PR. 리뷰 진행 중.", taskIds: [] },
    { id: "b_okr", title: "전사 OKR 트래커", url: "okr.acme.internal/2026/q3", category: "bc_metric", note: "Q3 초안 작성용. 회사 목표 정렬 확인.", taskIds: [] },
    { id: "b_hr", title: "교육비·복지 정책 위키", url: "wiki.acme.internal/hr/benefits", category: "bc_hr", note: "교육비 지원 한도/절차.", taskIds: [] },
    { id: "b_dash", title: "결제 시스템 대시보드 (Grafana)", url: "grafana.acme.internal/d/payments", category: "bc_metric", note: "실패율·레이턴시 실시간 모니터링.", taskIds: [] },
    { id: "b_hire", title: "채용 파이프라인 (Greenhouse)", url: "greenhouse.io/acme/pipeline", category: "bc_hr", note: "백엔드 포지션 후보자 현황.", taskIds: [] },
    { id: "b_arch", title: "플랫폼 아키텍처 설계 문서", url: "wiki.acme.internal/platform/arch", category: "bc_tech", note: "마이그레이션 타깃 아키텍처.", taskIds: [] },
    { id: "b_runbook", title: "온콜 런북", url: "wiki.acme.internal/oncall/runbook", category: "bc_wiki", note: "장애 대응 절차.", taskIds: [] },
    { id: "b_figma", title: "알림센터 Figma", url: "figma.com/acme/notification-center", category: "bc_pm", note: "윤디자이너 작업 파일.", taskIds: [] },
    { id: "b_1on1", title: "1:1 미팅 가이드", url: "wiki.acme.internal/eng/1on1-guide", category: "bc_wiki", note: "신참 매니저용 질문 리스트.", taskIds: [] },
  ];

  const defaultState = {
    version: 3,
    me: { name: "나 (매니저)", initial: "나", color: "var(--accent)" },
    tasks, projects, meetings, bookmarks, bmCategories,
    quarter: "2026 Q2",
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === defaultState.version) return parsed;
      }
    } catch (e) { /* ignore */ }
    return JSON.parse(JSON.stringify(defaultState));
  }
  function save(state) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function reset() {
    localStorage.removeItem(STORE_KEY);
    return JSON.parse(JSON.stringify(defaultState));
  }

  window.AppData = {
    COLUMNS, PEOPLE, uid, load, save, reset,
    today: iso(TODAY),
    defaultState,
  };
})();
