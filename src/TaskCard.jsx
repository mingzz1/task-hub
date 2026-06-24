/* TaskCard — board card */
import React from "react";
import { ProjectTag, DueBadge, AvatarStack, PRI, fmtDue } from "./primitives.jsx";
import { Icons } from "./icons.jsx";

export function TaskCard({ task, project, meeting, bookmarkCount, onOpen, onToggleDone, dragHandlers, dragging }) {
  const checklist = task.checklist || [];
  const doneCount = checklist.filter((c) => c.done).length;
  const isDone = task.status === "done";

  return React.createElement("div", {
    className: "card" + (dragging ? " dragging" : ""),
    draggable: true,
    onClick: () => onOpen(task.id),
    ...dragHandlers,
  },
    React.createElement("span", { className: "pri", style: { background: (PRI[task.priority] || PRI.low).c, opacity: task.priority === "low" ? 0.45 : 1 } }),
    React.createElement("div", { className: "card-top" },
      React.createElement("button", {
        className: "card-check" + (isDone ? " on" : ""),
        title: isDone ? "완료 해제" : "완료로 표시",
        onClick: (e) => { e.stopPropagation(); onToggleDone(task.id); },
      }, isDone ? React.createElement(Icons.Check, { size: 11 }) : null),
      React.createElement("div", { className: "card-title" + (isDone ? " done" : "") }, task.title),
    ),
    // 완료 카드는 마감일(지났어도) 대신 완료일을 표시 — 완료된 일에 빨간 경고는 의미 없음
    (project || task.due || (isDone && task.completedAt)) ? React.createElement("div", { className: "card-meta" },
      project ? React.createElement(ProjectTag, { project }) : null,
      isDone
        ? (task.completedAt ? React.createElement("span", { className: "due normal" },
            React.createElement(Icons.Check, { size: 11 }), fmtDue(task.completedAt) + " 완료") : null)
        : (task.due ? React.createElement(DueBadge, { iso: task.due }) : null),
    ) : null,
    (task.people.length || checklist.length || meeting || bookmarkCount) ?
      React.createElement("div", { className: "card-foot" },
        React.createElement(AvatarStack, { people: task.people, sm: true }),
        React.createElement("div", { style: { flex: 1 } }),
        checklist.length ? React.createElement("span", { className: "mini-link", title: "체크리스트" },
          React.createElement(Icons.Check, { size: 12 }), `${doneCount}/${checklist.length}`) : null,
        bookmarkCount ? React.createElement("span", { className: "mini-link", title: "연결된 북마크" },
          React.createElement(Icons.Bookmark, { size: 12 }), bookmarkCount) : null,
        meeting ? React.createElement("span", { className: "mini-link", title: "연결된 미팅: " + meeting.name, style: { color: "var(--st-meet)" } },
          React.createElement(Icons.Users, { size: 12 })) : null,
      ) : null,
  );
}
