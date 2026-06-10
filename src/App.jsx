/* App — shell, state, routing */
import React, { useState, useEffect, useRef } from "react";
import * as store from "./store.js";
import { COLUMNS, uid, today, isValidBackup } from "./store.js";
import { dayDiff } from "./primitives.jsx";
import { Icons } from "./icons.jsx";
import { BoardView } from "./BoardView.jsx";
import { CalendarView } from "./CalendarView.jsx";
import { ReviewView } from "./ReviewView.jsx";
import { MeetingsView } from "./MeetingsView.jsx";
import { BookmarksView } from "./BookmarksView.jsx";
import { TaskDetail } from "./TaskDetail.jsx";

const NAV = [
  { id: "board", label: "보드", icon: Icons.Board },
  { id: "calendar", label: "캘린더", icon: Icons.Calendar },
  { id: "review", label: "완료 · 성과", icon: Icons.Trophy },
  { id: "meetings", label: "미팅 · 1:1", icon: Icons.Users },
  { id: "bookmarks", label: "북마크", icon: Icons.Bookmark },
];
const TITLES = {
  board: ["업무 보드", "상태별로 끌어 옮기며 관리하세요"],
  calendar: ["캘린더", "마감일과 미팅을 한눈에"],
  review: ["완료 · 성과", "분기별 성과 기록 — 평가 시즌 대비"],
  meetings: ["미팅 · 1:1", "안건과 노트를 한 곳에"],
  bookmarks: ["북마크", "업무용 페이지를 카테고리로 정리"],
};

export default function App() {
  const [state, setState] = useState(store.load);
  const [view, setView] = useState("board");
  const [openId, setOpenId] = useState(null);
  const [meetingId, setMeetingId] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(null);
  const searchRef = useRef(null);
  const importRef = useRef(null);

  useEffect(() => { store.save(state); }, [state]);

  // keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") { setOpenId(null); return; }
      const typing = /input|textarea|select/i.test((e.target.tagName || ""));
      if (typing) return;
      if (e.key === "/") { e.preventDefault(); searchRef.current && searchRef.current.focus(); }
      if (e.key === "n") { e.preventDefault(); addTask("backlog"); }
      if (e.key >= "1" && e.key <= "5") setView(NAV[+e.key - 1].id);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  // ---- mutations ----
  const updateTask = (id, patch) => setState((s) => ({ ...s, tasks: s.tasks.map((t) => t.id === id ? { ...t, ...patch } : t) }));

  const moveTask = (id, toStatus, beforeId) => setState((s) => {
    const tasks = s.tasks.map((t) => ({ ...t }));
    const moved = tasks.find((t) => t.id === id);
    if (!moved) return s;
    moved.status = toStatus;
    if (toStatus === "done" && !moved.completedAt) { moved.completedAt = today; moved.quarter = moved.quarter || s.quarter; }
    const col = tasks.filter((t) => t.status === toStatus && t.id !== id).sort((a, b) => a.order - b.order);
    let idx = beforeId ? col.findIndex((t) => t.id === beforeId) : col.length;
    if (idx < 0) idx = col.length;
    col.splice(idx, 0, moved);
    col.forEach((t, i) => { t.order = i; });
    return { ...s, tasks };
  });

  const toggleDone = (id) => {
    const t = state.tasks.find((x) => x.id === id);
    if (!t) return;
    moveTask(id, t.status === "done" ? "inprogress" : "done", null);
  };

  const addTask = (status) => {
    const id = uid();
    const order = state.tasks.filter((t) => t.status === status).length;
    const nt = { id, title: "", status, priority: "med", due: null, people: [], project: null, meetingId: null, notes: "", checklist: [], bookmarkIds: [], order };
    setState((s) => ({ ...s, tasks: [...s.tasks, nt] }));
    setOpenId(id);
  };

  const deleteTask = (id) => { setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) })); setOpenId(null); };

  const addNote = (mid, text) => setState((s) => ({
    ...s, meetings: s.meetings.map((m) => m.id === mid ? { ...m, notes: [...(m.notes || []), { id: uid(), date: today, text }] } : m),
  }));
  const deleteNote = (mid, nid) => setState((s) => ({
    ...s, meetings: s.meetings.map((m) => m.id === mid ? { ...m, notes: (m.notes || []).filter((n) => n.id !== nid) } : m),
  }));

  // ---- meeting CRUD + agenda ----
  const addMeeting = () => {
    const id = uid();
    const m = { id, name: "새 미팅", person: "", color: "oklch(0.52 0.11 250)", kind: "recurring", weekday: 1, time: "10:00", everyWeeks: 1, anchor: today, agenda: [], notes: [] };
    setState((s) => ({ ...s, meetings: [...s.meetings, m] }));
    setMeetingId(id);
  };
  const updateMeeting = (mid, patch) => setState((s) => ({ ...s, meetings: s.meetings.map((m) => m.id === mid ? { ...m, ...patch } : m) }));
  const deleteMeeting = (mid) => {
    if (!confirm("이 미팅을 삭제할까요? 안건과 노트가 함께 사라집니다.")) return;
    setState((s) => ({ ...s, meetings: s.meetings.filter((m) => m.id !== mid), tasks: s.tasks.map((t) => t.meetingId === mid ? { ...t, meetingId: null } : t) }));
    setMeetingId(null);
  };
  const addAgenda = (mid, text) => setState((s) => ({
    ...s, meetings: s.meetings.map((m) => m.id === mid ? { ...m, agenda: [...(m.agenda || []), { id: uid(), text, done: false }] } : m),
  }));
  const toggleAgenda = (mid, aid) => setState((s) => ({
    ...s, meetings: s.meetings.map((m) => m.id === mid ? { ...m, agenda: (m.agenda || []).map((a) => a.id === aid ? { ...a, done: !a.done } : a) } : m),
  }));
  const updateAgenda = (mid, aid, text) => setState((s) => ({
    ...s, meetings: s.meetings.map((m) => m.id === mid ? { ...m, agenda: (m.agenda || []).map((a) => a.id === aid ? { ...a, text } : a) } : m),
  }));
  const deleteAgenda = (mid, aid) => setState((s) => ({
    ...s, meetings: s.meetings.map((m) => m.id === mid ? { ...m, agenda: (m.agenda || []).filter((a) => a.id !== aid) } : m),
  }));

  // ---- series sessions ----
  const addSession = (mid) => setState((s) => ({
    ...s, meetings: s.meetings.map((m) => m.id === mid ? { ...m, sessions: [...(m.sessions || []), { id: uid(), date: today, time: "10:00", label: "" }] } : m),
  }));
  const updateSession = (mid, sid, patch) => setState((s) => ({
    ...s, meetings: s.meetings.map((m) => m.id === mid ? { ...m, sessions: (m.sessions || []).map((x) => x.id === sid ? { ...x, ...patch } : x) } : m),
  }));
  const deleteSession = (mid, sid) => setState((s) => ({
    ...s, meetings: s.meetings.map((m) => m.id === mid ? { ...m, sessions: (m.sessions || []).filter((x) => x.id !== sid) } : m),
  }));

  const addBookmark = (data) => setState((s) => ({ ...s, bookmarks: [{ id: uid(), taskIds: [], ...data }, ...s.bookmarks] }));
  const deleteBookmark = (id) => setState((s) => ({ ...s, bookmarks: s.bookmarks.filter((b) => b.id !== id), tasks: s.tasks.map((t) => ({ ...t, bookmarkIds: (t.bookmarkIds || []).filter((x) => x !== id) })) }));

  const clearData = () => { if (confirm("모든 데이터를 비울까요? 업무·미팅·북마크가 전부 삭제됩니다.\n필요하면 먼저 '데이터 내보내기'로 백업하세요.")) setState(store.clearAll()); };

  // ---- backup: export / import (JSON) ----
  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `task-hub-backup-${today}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const importData = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let parsed;
      try { parsed = JSON.parse(reader.result); }
      catch { alert("JSON 파일을 읽을 수 없습니다. 파일이 손상되었거나 형식이 다릅니다."); return; }
      if (!isValidBackup(parsed)) { alert("Task Hub 백업 파일이 아니거나 버전이 맞지 않습니다."); return; }
      if (!confirm("현재 데이터를 가져온 파일 내용으로 교체할까요?\n(교체 전 '데이터 내보내기'로 백업해 두는 것을 권장합니다)")) return;
      setOpenId(null);
      setMeetingId(null);
      setFilter(null);
      setState(parsed);
    };
    reader.readAsText(file);
  };

  // ---- derived ----
  const active = state.tasks.filter((t) => t.status !== "done");
  const stats = {
    over: active.filter((t) => t.due && dayDiff(t.due) < 0).length,
    today: active.filter((t) => t.due && dayDiff(t.due) === 0).length,
    week: active.filter((t) => t.due && dayDiff(t.due) >= 0 && dayDiff(t.due) <= 7).length,
    blocked: state.tasks.filter((t) => t.status === "waiting" || t.status === "toask").length,
    progress: state.tasks.filter((t) => t.status === "inprogress").length,
  };
  const navCount = (id) => {
    if (id === "board") return active.length;
    if (id === "meetings") return state.meetings.reduce((n, m) => n + (m.agenda || []).filter((a) => !a.done).length, 0);
    if (id === "bookmarks") return state.bookmarks.length;
    if (id === "review") return state.tasks.filter((t) => t.status === "done").length;
    return null;
  };

  const openMeeting = (mid) => { setMeetingId(mid); setView("meetings"); };

  const openTask = (id) => setOpenId(id);
  const goFilter = (f) => { setView("board"); setFilter(filter === f ? null : f); };
  const openTaskObj = state.tasks.find((t) => t.id === openId);
  const [t0, t1] = TITLES[view];

  return React.createElement("div", { className: "app" },
    // ---------- Sidebar ----------
    React.createElement("aside", { className: "sidebar" },
      React.createElement("div", { className: "brand" },
        React.createElement("div", { className: "brand-mark" }, "T"),
        React.createElement("div", null,
          React.createElement("div", { className: "brand-name" }, "Task Hub"),
          React.createElement("div", { className: "brand-sub" }, "task & people"))),
      React.createElement("div", { className: "nav-group-label" }, "워크스페이스"),
      NAV.map((n) => React.createElement("button", {
        key: n.id, className: "nav-item" + (view === n.id ? " active" : ""),
        onClick: () => setView(n.id),
      },
        React.createElement(n.icon, { size: 17 }),
        React.createElement("span", null, n.label),
        navCount(n.id) != null ? React.createElement("span", { className: "count" }, navCount(n.id)) : null)),

      React.createElement("div", { className: "nav-group-label" }, "지금 막혀있는 것"),
      React.createElement("button", { className: "nav-item" + (filter === "blocked" && view === "board" ? " active" : ""), onClick: () => goFilter("blocked") },
        React.createElement(Icons.Inbox, { size: 17 }),
        React.createElement("span", null, "응답 대기 · 질문"),
        React.createElement("span", { className: "count" }, stats.blocked)),

      React.createElement("div", { className: "sidebar-foot" },
        React.createElement("button", { className: "nav-item", onClick: exportData, style: { fontSize: 12 }, title: "전체 데이터를 JSON 파일로 저장" },
          React.createElement(Icons.Download, { size: 15 }), "데이터 내보내기"),
        React.createElement("button", { className: "nav-item", onClick: () => importRef.current && importRef.current.click(), style: { fontSize: 12 }, title: "내보낸 JSON 파일에서 복원" },
          React.createElement(Icons.Upload, { size: 15 }), "데이터 가져오기"),
        React.createElement("input", {
          ref: importRef, type: "file", accept: "application/json,.json", style: { display: "none" },
          onChange: (e) => { importData(e.target.files[0]); e.target.value = ""; },
        }),
        React.createElement("button", { className: "nav-item", onClick: clearData, style: { fontSize: 12 } },
          React.createElement(Icons.Trash, { size: 15 }), "모든 데이터 비우기")),
    ),

    // ---------- Main ----------
    React.createElement("div", { className: "main" },
      React.createElement("div", { className: "topbar" },
        React.createElement("div", { style: { flex: 1 } },
          React.createElement("div", { className: "page-title" }, t0),
          React.createElement("div", { className: "page-sub" }, t1)),
        React.createElement("div", { className: "search" },
          React.createElement(Icons.Search, { size: 15 }),
          React.createElement("input", { ref: searchRef, placeholder: "업무 · 사람 · 북마크 검색", value: query, onChange: (e) => setQuery(e.target.value) }),
          query ? React.createElement("button", { className: "btn-icon", style: { padding: 2 }, onClick: () => setQuery("") }, React.createElement(Icons.X, { size: 14 })) :
            React.createElement("span", { className: "kbd" }, "/")),
        React.createElement("button", { className: "btn btn-primary", onClick: () => addTask("backlog") }, React.createElement(Icons.Plus, { size: 16 }), "새 업무")),

      // summary strip (board only)
      view === "board" ? React.createElement("div", { className: "summary" },
        React.createElement("div", { className: "stat danger" + (filter === "over" ? " on" : ""), onClick: () => goFilter("over") },
          React.createElement("span", { className: "stat-num" }, stats.over),
          React.createElement("span", { className: "stat-lab" }, "마감 초과")),
        React.createElement("div", { className: "stat warn" + (filter === "today" ? " on" : ""), onClick: () => goFilter("today") },
          React.createElement("span", { className: "stat-num" }, stats.today),
          React.createElement("span", { className: "stat-lab" }, "오늘 마감")),
        React.createElement("div", { className: "stat" + (filter === "week" ? " on" : ""), onClick: () => goFilter("week") },
          React.createElement("span", { className: "stat-num" }, stats.week),
          React.createElement("span", { className: "stat-lab" }, "이번 주")),
        React.createElement("div", { className: "stat-divider" }),
        React.createElement("div", { className: "stat" + (filter === "blocked" ? " on" : ""), onClick: () => goFilter("blocked") },
          React.createElement("span", { className: "stat-num", style: { color: "var(--st-wait)" } }, stats.blocked),
          React.createElement("span", { className: "stat-lab" }, "내가 막혀있는 것")),
        React.createElement("div", { className: "stat" },
          React.createElement("span", { className: "stat-num", style: { color: "var(--st-prog)" } }, stats.progress),
          React.createElement("span", { className: "stat-lab" }, "진행 중")),
        filter ? React.createElement("button", { className: "btn btn-ghost btn-sm", style: { marginLeft: "auto", alignSelf: "center" }, onClick: () => setFilter(null) },
          React.createElement(Icons.X, { size: 13 }), "필터 해제") : null,
      ) : null,

      // routed view
      React.createElement("div", { className: "content" },
        view === "board" ? React.createElement(BoardView, { state, query, activeFilter: filter, onOpenTask: openTask, onToggleDone: toggleDone, onMoveTask: moveTask, onAddTask: addTask }) : null,
        view === "calendar" ? React.createElement(CalendarView, { state, onOpenTask: openTask, onOpenMeeting: openMeeting }) : null,
        view === "review" ? React.createElement(ReviewView, { state, onOpenTask: openTask }) : null,
        view === "meetings" ? React.createElement(MeetingsView, {
          state, activeId: meetingId, setActiveId: setMeetingId,
          onAddMeeting: addMeeting, onUpdateMeeting: updateMeeting, onDeleteMeeting: deleteMeeting,
          onAddAgenda: addAgenda, onToggleAgenda: toggleAgenda, onUpdateAgenda: updateAgenda, onDeleteAgenda: deleteAgenda,
          onAddNote: addNote, onDeleteNote: deleteNote,
          onAddSession: addSession, onUpdateSession: updateSession, onDeleteSession: deleteSession,
        }) : null,
        view === "bookmarks" ? React.createElement(BookmarksView, { state, query, onAddBookmark: addBookmark, onDeleteBookmark: deleteBookmark, onOpenTask: openTask }) : null,
      ),
    ),

    // ---------- Task modal ----------
    openTaskObj ? React.createElement(TaskDetail, {
      task: openTaskObj, state,
      onUpdate: (patch) => updateTask(openId, patch),
      onDelete: deleteTask, onClose: () => setOpenId(null),
    }) : null,
  );
}
