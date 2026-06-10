/* TaskDetail — slide-in editor sheet */
import React, { useState } from "react";
import { COLUMNS, uid, today } from "./store.js";
import { DueBadge, Avatar } from "./primitives.jsx";
import { Icons } from "./icons.jsx";

const PRI_OPTS = [["high", "높음"], ["med", "중간"], ["low", "낮음"]];

function Row({ label, icon, children, top }) {
  return React.createElement("div", { className: "field-row" + (top ? " top" : "") },
    React.createElement("div", { className: "field-label" }, icon, label),
    React.createElement("div", { style: { minWidth: 0 } }, children));
}

export function TaskDetail({ task, state, onUpdate, onDelete, onClose }) {
  const [bmPicker, setBmPicker] = useState(false);
  const [peopleInput, setPeopleInput] = useState("");
  const [newCheck, setNewCheck] = useState("");

  const col = COLUMNS.find((c) => c.id === task.status);
  const linkedBms = (task.bookmarkIds || []).map((id) => state.bookmarks.find((b) => b.id === id)).filter(Boolean);
  // 후보 목록은 실제 업무들에 쓰인 이름에서 수집 — 선택 해제하면 다른 곳에 안 쓰인 이름은 사라진다
  const knownPeople = Array.from(new Set([...state.tasks.flatMap((t) => t.people || []), ...task.people]));
  const checklist = task.checklist || [];

  const setChecklist = (cl) => onUpdate({ checklist: cl });
  const togglePerson = (n) => {
    const has = task.people.includes(n);
    onUpdate({ people: has ? task.people.filter((x) => x !== n) : [...task.people, n] });
  };
  const addPerson = () => {
    const n = peopleInput.trim();
    if (n && !task.people.includes(n)) onUpdate({ people: [...task.people, n] });
    setPeopleInput("");
  };
  const addCheck = () => {
    const t = newCheck.trim();
    if (!t) return;
    setChecklist([...checklist, { id: uid(), text: t, done: false }]);
    setNewCheck("");
  };
  const toggleBm = (id) => {
    const has = (task.bookmarkIds || []).includes(id);
    onUpdate({ bookmarkIds: has ? task.bookmarkIds.filter((x) => x !== id) : [...(task.bookmarkIds || []), id] });
  };

  return React.createElement("div", { className: "scrim", onMouseDown: onClose },
    React.createElement("div", { className: "sheet", onMouseDown: (e) => e.stopPropagation() },
      // head — status chips
      React.createElement("div", { className: "sheet-head" },
        React.createElement("div", { className: "chips", style: { flex: 1 } },
          COLUMNS.map((c) => React.createElement("button", {
            key: c.id,
            className: "chip-btn" + (task.status === c.id ? " on" : ""),
            style: task.status === c.id ? { background: c.bg, borderColor: c.color, color: c.color } : null,
            onClick: () => onUpdate({ status: c.id, ...(c.id === "done" && !task.completedAt ? { completedAt: today, quarter: state.quarter } : {}) }),
          }, c.label))),
        React.createElement("button", { className: "btn-icon", onClick: () => onDelete(task.id), title: "삭제" }, React.createElement(Icons.Trash, { size: 16 })),
        React.createElement("button", { className: "btn-icon", onClick: onClose, title: "닫기" }, React.createElement(Icons.X, { size: 18 })),
      ),

      React.createElement("div", { className: "sheet-body" },
        // title
        React.createElement("input", {
          className: "title-input", value: task.title, placeholder: "업무 제목",
          onChange: (e) => onUpdate({ title: e.target.value }),
        }),

        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } },
          // priority
          React.createElement(Row, { label: "우선순위", icon: React.createElement(Icons.Flag, { size: 14 }) },
            React.createElement("div", { className: "seg" },
              PRI_OPTS.map(([v, l]) => React.createElement("button", {
                key: v, className: task.priority === v ? "on" : "", onClick: () => onUpdate({ priority: v }),
              }, l)))),
          // due
          React.createElement(Row, { label: "마감일", icon: React.createElement(Icons.Clock, { size: 14 }) },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
              React.createElement("input", { className: "input", type: "date", style: { width: 170 }, value: task.due || "", onChange: (e) => onUpdate({ due: e.target.value || null }) }),
              task.due ? React.createElement(DueBadge, { iso: task.due }) : null,
              task.due ? React.createElement("button", { className: "btn-icon", style: { padding: 4 }, onClick: () => onUpdate({ due: null }), title: "지우기" }, React.createElement(Icons.X, { size: 14 })) : null)),
          // project
          React.createElement(Row, { label: "프로젝트", icon: React.createElement(Icons.Tag, { size: 14 }), top: true },
            React.createElement("div", { className: "chips" },
              state.projects.map((p) => React.createElement("button", {
                key: p.id, className: "chip-btn" + (task.project === p.id ? " on" : ""),
                onClick: () => onUpdate({ project: task.project === p.id ? null : p.id }),
              }, React.createElement("span", { className: "tag-dot", style: { background: p.color } }), p.name)))),
          // meeting
          React.createElement(Row, { label: "연결 미팅", icon: React.createElement(Icons.Users, { size: 14 }) },
            React.createElement("select", { className: "selectbox", style: { width: "auto", minWidth: 220 }, value: task.meetingId || "", onChange: (e) => onUpdate({ meetingId: e.target.value || null }) },
              React.createElement("option", { value: "" }, "— 없음 —"),
              state.meetings.map((m) => React.createElement("option", { key: m.id, value: m.id }, m.name)))),
        ),

        // people
        React.createElement("div", { className: "field" },
          React.createElement("div", { className: "field-label" }, React.createElement(Icons.Person, { size: 14 }), "관련자 / 담당자"),
          React.createElement("div", { className: "chips" },
            knownPeople.map((n) => React.createElement("button", {
              key: n, className: "chip-btn chip-x" + (task.people.includes(n) ? " on" : ""), onClick: () => togglePerson(n),
            }, React.createElement(Avatar, { name: n, sm: true }), n)),
            React.createElement("input", {
              className: "input", style: { width: 130, padding: "4px 10px" }, placeholder: "+ 이름 추가", value: peopleInput,
              onChange: (e) => setPeopleInput(e.target.value),
              onKeyDown: (e) => { if (e.key === "Enter") addPerson(); },
            }))),

        // done → impact block
        task.status === "done" ? React.createElement("div", { style: { background: "var(--st-done-bg)", border: "1px solid oklch(0.85 0.05 150)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13, color: "var(--st-done)" } },
            React.createElement(Icons.Trophy, { size: 16 }), "성과 기록"),
          React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } },
            React.createElement("div", { className: "field", style: { flex: "0 0 150px" } },
              React.createElement("label", { style: { fontSize: 11.5, fontWeight: 600, color: "var(--ink-2)" } }, "분기·기간"),
              React.createElement("input", { className: "input", value: task.quarter || "", placeholder: "예: 2026 Q2", onChange: (e) => onUpdate({ quarter: e.target.value }) })),
            React.createElement("div", { className: "field", style: { flex: "0 0 150px" } },
              React.createElement("label", { style: { fontSize: 11.5, fontWeight: 600, color: "var(--ink-2)" } }, "완료일"),
              React.createElement("input", { className: "input", type: "date", value: task.completedAt || "", onChange: (e) => onUpdate({ completedAt: e.target.value }) }))),
          React.createElement("div", { className: "field" },
            React.createElement("label", { style: { fontSize: 11.5, fontWeight: 600, color: "var(--ink-2)" } }, "임팩트·결과 (성과평가용)"),
            React.createElement("textarea", { className: "textarea", value: task.impact || "", placeholder: "정량 지표·영향 범위·협업·역할을 한두 문장으로. 평가 시즌에 그대로 자료가 됩니다.", onChange: (e) => onUpdate({ impact: e.target.value }) }))) : null,

        // checklist
        React.createElement("div", { className: "field" },
          React.createElement("div", { className: "field-label" }, React.createElement(Icons.Check, { size: 14 }), "체크리스트",
            checklist.length ? React.createElement("span", { className: "muted", style: { fontWeight: 400 } }, `${checklist.filter((c) => c.done).length}/${checklist.length}`) : null),
          checklist.length ? React.createElement("div", { className: "progress-track" },
            React.createElement("div", { className: "progress-fill", style: { width: `${(checklist.filter((c) => c.done).length / checklist.length) * 100}%` } })) : null,
          React.createElement("div", { className: "check-list" },
            checklist.map((c) => React.createElement("div", { className: "check-row", key: c.id },
              React.createElement("button", { className: "check-box" + (c.done ? " on" : ""), onClick: () => setChecklist(checklist.map((x) => x.id === c.id ? { ...x, done: !x.done } : x)) }, c.done ? React.createElement(Icons.Check, { size: 11 }) : null),
              React.createElement("input", { className: "check-text" + (c.done ? " done" : ""), value: c.text, onChange: (e) => setChecklist(checklist.map((x) => x.id === c.id ? { ...x, text: e.target.value } : x)) }),
              React.createElement("button", { className: "check-del", onClick: () => setChecklist(checklist.filter((x) => x.id !== c.id)) }, React.createElement(Icons.Trash, { size: 13 })))),
            React.createElement("div", { className: "check-row" },
              React.createElement("span", { className: "check-box", style: { borderStyle: "dashed" } }),
              React.createElement("input", { className: "check-text", placeholder: "+ 항목 추가", value: newCheck, onChange: (e) => setNewCheck(e.target.value), onKeyDown: (e) => { if (e.key === "Enter") addCheck(); } })))),

        // notes
        React.createElement("div", { className: "field" },
          React.createElement("div", { className: "field-label" }, React.createElement(Icons.Note, { size: 14 }), "메모"),
          React.createElement("textarea", { className: "textarea", value: task.notes || "", placeholder: "맥락, 다음 액션, 참고사항…", onChange: (e) => onUpdate({ notes: e.target.value }) })),

        // bookmarks
        React.createElement("div", { className: "field" },
          React.createElement("div", { className: "field-label" }, React.createElement(Icons.Bookmark, { size: 14 }), "연결된 북마크"),
          linkedBms.map((b) => React.createElement("div", { className: "link-card", key: b.id },
            React.createElement("div", { className: "link-ico", style: { background: (state.bmCategories.find((c) => c.id === b.category) || {}).color + "22", color: (state.bmCategories.find((c) => c.id === b.category) || {}).color } }, React.createElement(Icons.Bookmark, { size: 15 })),
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
              React.createElement("div", { className: "link-title" }, b.title),
              React.createElement("div", { className: "link-sub" }, b.url)),
            React.createElement("button", { className: "btn-icon", style: { padding: 5 }, onClick: () => toggleBm(b.id), title: "연결 해제" }, React.createElement(Icons.X, { size: 15 })))),
          bmPicker ? React.createElement("div", { style: { border: "1px solid var(--line)", borderRadius: 9, padding: 6, maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 } },
            state.bookmarks.filter((b) => !(task.bookmarkIds || []).includes(b.id)).map((b) => React.createElement("button", {
              key: b.id, className: "nav-item", style: { fontSize: 12.5 }, onClick: () => { toggleBm(b.id); setBmPicker(false); },
            }, React.createElement(Icons.Plus, { size: 13 }), b.title))) :
            React.createElement("button", { className: "add-inline", onClick: () => setBmPicker(true) }, React.createElement(Icons.Link, { size: 14 }), "북마크 연결")),
      ),

      React.createElement("div", { className: "sheet-foot" },
        React.createElement("span", { className: "muted", style: { fontSize: 11.5, fontFamily: "var(--mono)", flex: 1 } }, col ? col.label : ""),
        task.status === "done"
          ? React.createElement("button", { className: "btn btn-ghost", onClick: () => onUpdate({ status: "inprogress" }) }, "완료 취소")
          : React.createElement("button", { className: "btn btn-primary", onClick: () => onUpdate({ status: "done", completedAt: task.completedAt || today, quarter: task.quarter || state.quarter }) },
            React.createElement(Icons.Check, { size: 15 }), "완료로 표시"),
      ),
    ));
}
