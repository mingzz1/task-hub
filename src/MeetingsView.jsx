/* MeetingsView — schedule + agenda (물어볼 것) + 1:1 notes */
import React, { useState } from "react";
import { uid, today } from "./store.js";
import { Avatar, fmtDue, WD, cadenceLabel, nextMeetingDate, KIND_LABEL, dayDiff } from "./primitives.jsx";
import { Icons } from "./icons.jsx";

// when switching kind, seed sensible defaults for the new kind
function kindDefaults(k, m) {
  if (k === "recurring") return { kind: k, weekday: m.weekday != null ? m.weekday : 1, time: m.time || "10:00", everyWeeks: m.everyWeeks || 1, anchor: today };
  if (k === "oneoff") return { kind: k, date: m.date || today, time: m.time || "10:00" };
  if (k === "series") return { kind: k, sessions: (m.sessions && m.sessions.length) ? m.sessions : [{ id: uid(), date: today, time: m.time || "10:00", label: "1차" }] };
  return { kind: k };
}

export function MeetingsView({ state, activeId, setActiveId, onAddMeeting, onUpdateMeeting, onDeleteMeeting,
                               onAddAgenda, onToggleAgenda, onUpdateAgenda, onDeleteAgenda, onAddNote, onDeleteNote,
                               onAddSession, onUpdateSession, onDeleteSession }) {
  const [agendaDraft, setAgendaDraft] = useState("");
  const [draft, setDraft] = useState("");
  const [editSched, setEditSched] = useState(false);

  const meeting = state.meetings.find((m) => m.id === activeId) || state.meetings[0];
  if (!meeting) return React.createElement("div", { className: "empty-state" },
    React.createElement("div", { className: "empty-inner" }, React.createElement(Icons.Users, { size: 38 }),
      React.createElement("div", null, "미팅이 없습니다"),
      React.createElement("button", { className: "btn btn-primary btn-sm", onClick: onAddMeeting }, React.createElement(Icons.Plus, { size: 14 }), "미팅 추가")));

  const agenda = meeting.agenda || [];
  const openAgenda = agenda.filter((a) => !a.done);
  const doneAgenda = agenda.filter((a) => a.done);
  const notes = (meeting.notes || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  const openCount = (m) => (m.agenda || []).filter((a) => !a.done).length;
  const next = nextMeetingDate(meeting);

  const submitAgenda = () => { const v = agendaDraft.trim(); if (!v) return; onAddAgenda(meeting.id, v); setAgendaDraft(""); };
  const submitNote = () => { const v = draft.trim(); if (!v) return; onAddNote(meeting.id, v); setDraft(""); };

  return React.createElement("div", { className: "meet-layout" },
    // ---- left list ----
    React.createElement("div", { className: "meet-list" },
      React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 4px 6px" } },
        React.createElement("span", { className: "nav-group-label", style: { padding: 0 } }, "내 미팅"),
        React.createElement("button", { className: "btn-icon", style: { padding: 4 }, onClick: onAddMeeting, title: "미팅 추가" }, React.createElement(Icons.Plus, { size: 16 }))),
      state.meetings.map((m) => React.createElement("div", {
        key: m.id, className: "meet-item" + (m.id === meeting.id ? " active" : ""), onClick: () => { setActiveId(m.id); setEditSched(false); },
      },
        React.createElement("div", { className: "meet-item-top" },
          React.createElement("span", { className: "meet-swatch", style: { background: m.color } }),
          React.createElement(Avatar, { name: m.person, sm: true }),
          React.createElement("span", { className: "meet-name" }, m.name),
          openCount(m) ? React.createElement("span", { className: "meet-badge" }, openCount(m)) : null),
        React.createElement("div", { className: "meet-when" },
          React.createElement("span", { className: "kind-tag kind-" + (m.kind || "recurring") }, KIND_LABEL[m.kind || "recurring"]),
          cadenceLabel(m)))),
    ),

    // ---- main ----
    React.createElement("div", { className: "meet-main" },
      React.createElement("div", { className: "meet-detail-head" },
        React.createElement("span", { className: "meet-swatch lg", style: { background: meeting.color } }),
        React.createElement("input", { className: "meet-detail-name", value: meeting.name, onChange: (e) => onUpdateMeeting(meeting.id, { name: e.target.value }) }),
        React.createElement("div", { style: { flex: 1 } }),
        React.createElement("button", { className: "btn-icon", onClick: () => onDeleteMeeting(meeting.id), title: "미팅 삭제" }, React.createElement(Icons.Trash, { size: 16 }))),

      // schedule line (editable) — supports recurring / oneoff / series
      editSched ? React.createElement("div", { className: "sched-edit" },
        // kind switcher
        React.createElement("div", { className: "seg", style: { marginBottom: 2 } },
          ["recurring", "oneoff", "series"].map((k) => React.createElement("button", {
            key: k, className: (meeting.kind || "recurring") === k ? "on" : "",
            onClick: () => onUpdateMeeting(meeting.id, kindDefaults(k, meeting)),
          }, KIND_LABEL[k]))),
        // per-kind fields
        (meeting.kind || "recurring") === "recurring" ? React.createElement("div", { className: "sched-fields" },
          React.createElement("select", { className: "selectbox", style: { width: "auto" }, value: meeting.everyWeeks || 1, onChange: (e) => onUpdateMeeting(meeting.id, { everyWeeks: +e.target.value }) },
            React.createElement("option", { value: 1 }, "매주"), React.createElement("option", { value: 2 }, "격주")),
          React.createElement("select", { className: "selectbox", style: { width: "auto" }, value: meeting.weekday, onChange: (e) => onUpdateMeeting(meeting.id, { weekday: +e.target.value, anchor: today }) },
            WD.map((w, i) => React.createElement("option", { key: i, value: i }, w + "요일"))),
          React.createElement("input", { className: "input", type: "time", style: { width: 118 }, value: meeting.time || "10:00", onChange: (e) => onUpdateMeeting(meeting.id, { time: e.target.value }) })) : null,
        meeting.kind === "oneoff" ? React.createElement("div", { className: "sched-fields" },
          React.createElement("input", { className: "input", type: "date", style: { width: 160 }, value: meeting.date || "", onChange: (e) => onUpdateMeeting(meeting.id, { date: e.target.value }) }),
          React.createElement("input", { className: "input", type: "time", style: { width: 118 }, value: meeting.time || "10:00", onChange: (e) => onUpdateMeeting(meeting.id, { time: e.target.value }) })) : null,
        meeting.kind === "series" ? React.createElement("div", { className: "session-edit" },
          (meeting.sessions || []).map((s) => React.createElement("div", { className: "session-row", key: s.id },
            React.createElement("input", { className: "input", type: "date", style: { width: 150 }, value: s.date || "", onChange: (e) => onUpdateSession(meeting.id, s.id, { date: e.target.value }) }),
            React.createElement("input", { className: "input", type: "time", style: { width: 110 }, value: s.time || "10:00", onChange: (e) => onUpdateSession(meeting.id, s.id, { time: e.target.value }) }),
            React.createElement("input", { className: "input", style: { flex: 1, minWidth: 90 }, placeholder: "세션 이름 (예: 1차)", value: s.label || "", onChange: (e) => onUpdateSession(meeting.id, s.id, { label: e.target.value }) }),
            React.createElement("button", { className: "check-del", onClick: () => onDeleteSession(meeting.id, s.id) }, React.createElement(Icons.Trash, { size: 13 })))),
          React.createElement("button", { className: "add-inline", style: { marginTop: 2 }, onClick: () => onAddSession(meeting.id) }, React.createElement(Icons.Plus, { size: 14 }), "세션 추가")) : null,
        // shared: person + done
        React.createElement("div", { className: "sched-fields" },
          React.createElement(Avatar, { name: meeting.person, sm: true }),
          React.createElement("input", { className: "input", style: { width: 150 }, value: meeting.person, onChange: (e) => onUpdateMeeting(meeting.id, { person: e.target.value }), placeholder: "상대 / 참석자" }),
          React.createElement("div", { style: { flex: 1 } }),
          React.createElement("button", { className: "btn btn-primary btn-sm", onClick: () => setEditSched(false) }, "완료"))) :
        React.createElement("div", { className: "meet-sched-row", onClick: () => setEditSched(true) },
          React.createElement(Icons.Calendar, { size: 14 }),
          React.createElement("span", { className: "kind-tag kind-" + (meeting.kind || "recurring") }, KIND_LABEL[meeting.kind || "recurring"]),
          React.createElement("span", null, cadenceLabel(meeting)),
          React.createElement("span", { className: "dot-sep" }, "·"),
          React.createElement("span", null, meeting.person || "참석자 미정"),
          next ? React.createElement(React.Fragment, null, React.createElement("span", { className: "dot-sep" }, "·"),
            React.createElement("span", { className: "next-pill" }, "다음 " + fmtDue(next))) : null,
          React.createElement(Icons.Edit, { size: 13 })),

      // series sessions overview (read mode)
      !editSched && meeting.kind === "series" && (meeting.sessions || []).length ? React.createElement("div", { className: "session-list" },
        meeting.sessions.slice().sort((a, b) => (a.date || "").localeCompare(b.date || "")).map((s) => React.createElement("div", { className: "session-chip" + (dayDiff(s.date) < 0 ? " past" : ""), key: s.id },
          React.createElement("span", { className: "session-date" }, fmtDue(s.date)),
          React.createElement("span", { className: "session-time" }, s.time),
          s.label ? React.createElement("span", { className: "session-label" }, s.label) : null))) : null,

      // agenda
      React.createElement("div", { className: "section-label" }, React.createElement(Icons.Message, { size: 15 }), "이 미팅에서 물어볼 것"),
      React.createElement("div", { className: "add-agenda-row" },
        React.createElement(Icons.Plus, { size: 15 }),
        React.createElement("input", { className: "agenda-input", placeholder: "물어볼 것 / 안건 추가하고 Enter", value: agendaDraft, onChange: (e) => setAgendaDraft(e.target.value), onKeyDown: (e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) submitAgenda(); } })),
      openAgenda.length === 0 && doneAgenda.length === 0 ? React.createElement("div", { className: "muted", style: { fontSize: 12.5, padding: "8px 4px" } }, "다음 미팅에서 물어볼 것을 모아두세요.") : null,
      openAgenda.map((a) => React.createElement("div", { className: "agenda-item", key: a.id },
        React.createElement("button", { className: "agenda-check", onClick: () => onToggleAgenda(meeting.id, a.id), title: "다뤘음" }),
        React.createElement("input", { className: "agenda-text", value: a.text, onChange: (e) => onUpdateAgenda(meeting.id, a.id, e.target.value) }),
        React.createElement("button", { className: "check-del", onClick: () => onDeleteAgenda(meeting.id, a.id) }, React.createElement(Icons.Trash, { size: 13 })))),

      doneAgenda.length ? React.createElement("details", { style: { marginTop: 6 } },
        React.createElement("summary", { className: "muted", style: { fontSize: 12, cursor: "pointer", fontWeight: 600, padding: "4px 0" } }, `다룬 안건 ${doneAgenda.length}건`),
        doneAgenda.map((a) => React.createElement("div", { className: "agenda-item done", key: a.id },
          React.createElement("button", { className: "agenda-check on", onClick: () => onToggleAgenda(meeting.id, a.id) }, React.createElement(Icons.Check, { size: 11 })),
          React.createElement("span", { className: "agenda-text done" }, a.text),
          React.createElement("button", { className: "check-del", onClick: () => onDeleteAgenda(meeting.id, a.id) }, React.createElement(Icons.Trash, { size: 13 }))))) : null,

      // notes
      React.createElement("div", { className: "section-label" }, React.createElement(Icons.Note, { size: 15 }), "미팅 노트"),
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 } },
        React.createElement("textarea", { className: "textarea", placeholder: "오늘 논의 / 결정 / 후속 액션…  (저장하면 날짜와 함께 기록돼요)", value: draft, onChange: (e) => setDraft(e.target.value), style: { minHeight: 64 } }),
        React.createElement("div", { style: { display: "flex", justifyContent: "flex-end" } },
          React.createElement("button", { className: "btn btn-primary btn-sm", onClick: submitNote }, React.createElement(Icons.Plus, { size: 14 }), "노트 저장"))),

      notes.length === 0 ? React.createElement("div", { className: "muted", style: { fontSize: 12.5 } }, "아직 기록된 노트가 없습니다.") : null,
      notes.map((n) => React.createElement("div", { className: "note-entry", key: n.id },
        React.createElement("div", { className: "note-head" },
          React.createElement("span", { className: "note-date" }, fmtDue(n.date)),
          React.createElement("button", { className: "check-del", onClick: () => onDeleteNote(meeting.id, n.id) }, React.createElement(Icons.Trash, { size: 12 }))),
        React.createElement("div", { className: "note-text" }, n.text))),
    ),
  );
}
