/* CalendarView — month grid: task due dates + recurring meetings */
import React, { useState } from "react";
import { today } from "./store.js";
import { WD, todayDate, dayDiff, meetingOccurrencesOn } from "./primitives.jsx";
import { Icons } from "./icons.jsx";

export function CalendarView({ state, onOpenTask, onOpenMeeting }) {
  const t = todayDate();
  const [view, setView] = useState({ y: t.getFullYear(), m: t.getMonth() });
  const [showMeetings, setShowMeetings] = useState(true);
  const [showDue, setShowDue] = useState(true);

  const first = new Date(view.y, view.m, 1);
  const startDow = first.getDay();
  const gridStart = new Date(view.y, view.m, 1 - startDow);
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
  const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const todayIso = today;

  const tasksOn = (iso) => state.tasks.filter((x) => x.due === iso);
  const meetingsOn = (d) => {
    const out = [];
    state.meetings.forEach((m) => meetingOccurrencesOn(m, d).forEach((occ) => out.push({ meeting: m, occ })));
    return out.sort((a, b) => (a.occ.time || "").localeCompare(b.occ.time || ""));
  };
  const projOf = (x) => state.projects.find((p) => p.id === x.project);

  const shift = (n) => {
    let m = view.m + n, y = view.y;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setView({ y, m });
  };

  return React.createElement("div", { className: "cal-wrap" },
    React.createElement("div", { className: "cal-head" },
      React.createElement("div", { className: "cal-month" }, `${view.y}년 ${view.m + 1}월`),
      React.createElement("div", { className: "icon-btn-row" },
        React.createElement("button", { className: "btn-icon", onClick: () => shift(-1) }, React.createElement(Icons.ChevL, { size: 18 })),
        React.createElement("button", { className: "btn-icon", onClick: () => shift(1) }, React.createElement(Icons.ChevR, { size: 18 }))),
      React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setView({ y: t.getFullYear(), m: t.getMonth() }) }, "오늘"),
      React.createElement("div", { style: { flex: 1 } }),
      React.createElement("button", { className: "cal-toggle" + (showMeetings ? " on" : ""), onClick: () => setShowMeetings((v) => !v) },
        React.createElement("span", { className: "tag-dot", style: { background: "var(--st-meet)" } }), "미팅"),
      React.createElement("button", { className: "cal-toggle" + (showDue ? " on" : ""), onClick: () => setShowDue((v) => !v) },
        React.createElement("span", { className: "tag-dot", style: { background: "var(--ink-3)" } }), "마감"),
    ),
    React.createElement("div", { className: "cal-grid" },
      WD.map((w, i) => React.createElement("div", { className: "cal-dow", key: w, style: i === 0 ? { color: "var(--danger)" } : i === 6 ? { color: "var(--st-prog)" } : null }, w)),
      cells.map((d, i) => {
        const iso = isoOf(d);
        const inMonth = d.getMonth() === view.m;
        const isToday = iso === todayIso;
        const dow = d.getDay();
        const dueItems = showDue ? tasksOn(iso) : [];
        const meets = showMeetings ? meetingsOn(d) : [];
        const total = meets.length + dueItems.length;
        let shownMeets = meets, shownDue = dueItems, overflow = 0;
        if (total > 4) {
          // prioritize meetings, then due
          shownMeets = meets.slice(0, 4);
          const remain = Math.max(0, 4 - shownMeets.length);
          shownDue = dueItems.slice(0, remain);
          overflow = total - (shownMeets.length + shownDue.length);
        }
        return React.createElement("div", { className: "cal-cell" + (inMonth ? "" : " muted") + (isToday ? " today" : ""), key: i },
          React.createElement("div", { className: "cal-date" + ((dow === 0 || dow === 6) ? " wknd" : "") }, d.getDate()),
          shownMeets.map(({ meeting: m, occ }, mi) => {
            const open = (m.agenda || []).filter((a) => !a.done).length;
            return React.createElement("div", {
              key: "m" + m.id + mi, className: "cal-ev meet",
              style: { background: m.color + "1c", color: m.color },
              onClick: () => onOpenMeeting(m.id), title: m.name + (occ.label ? " · " + occ.label : "") + (open ? " · 안건 " + open + "건" : ""),
            },
              React.createElement("span", { className: "ev-dot", style: { background: m.color } }),
              React.createElement("span", { style: { fontFamily: "var(--mono)", fontSize: 10, opacity: 0.85 } }, occ.time),
              React.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, m.name),
              open ? React.createElement("span", { className: "ev-badge" }, open) : null);
          }),
          shownDue.map((x) => {
            const proj = projOf(x);
            const over = x.status !== "done" && dayDiff(iso) < 0;
            const done = x.status === "done";
            return React.createElement("div", {
              key: x.id, className: "cal-ev" + (over ? " over" : ""),
              style: !over ? { background: (proj ? proj.color : "var(--ink-3)") + "1a", color: proj ? proj.color : "var(--ink-2)", opacity: done ? 0.5 : 1, textDecoration: done ? "line-through" : "none" } : null,
              onClick: () => onOpenTask(x.id), title: x.title,
            },
              React.createElement("span", { className: "ev-dot", style: { background: over ? "var(--danger)" : (proj ? proj.color : "var(--ink-3)") } }),
              React.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, x.title));
          }),
          overflow > 0 ? React.createElement("div", { style: { fontSize: 10.5, color: "var(--ink-3)", paddingLeft: 4 } }, `+${overflow}건 더`) : null);
      }),
    ),
  );
}
