/* BoardView — kanban with drag & drop. Exposes window.BoardView */
(function () {
  const { COLUMNS } = window.AppData;
  const { dayDiff } = window.UI;
  const Icons = window.Icons;
  const TaskCard = window.TaskCard;
  const { useState } = React;

  function matchesFilter(t, filter) {
    if (!filter) return true;
    if (filter === "today") return t.due && dayDiff(t.due) === 0 && t.status !== "done";
    if (filter === "week") return t.due && dayDiff(t.due) >= 0 && dayDiff(t.due) <= 7 && t.status !== "done";
    if (filter === "over") return t.due && dayDiff(t.due) < 0 && t.status !== "done";
    if (filter === "blocked") return (t.status === "waiting" || t.status === "toask");
    return true;
  }

  function BoardView({ state, query, activeFilter, onOpenTask, onToggleDone, onMoveTask, onAddTask }) {
    const [dragging, setDragging] = useState(null);
    const [over, setOver] = useState({ col: null, beforeId: null });
    const q = query.trim().toLowerCase();

    const visibleTasks = state.tasks.filter((t) => {
      if (q && !(t.title.toLowerCase().includes(q) || (t.notes || "").toLowerCase().includes(q) || t.people.some((p) => p.toLowerCase().includes(q)))) return false;
      if (!matchesFilter(t, activeFilter)) return false;
      return true;
    });

    const byStatus = (sid) => visibleTasks.filter((t) => t.status === sid).sort((a, b) => a.order - b.order);
    const projOf = (t) => state.projects.find((p) => p.id === t.project);
    const meetOf = (t) => state.meetings.find((m) => m.id === t.meetingId);

    const handleDrop = (colId) => {
      if (dragging) onMoveTask(dragging, colId, over.beforeId);
      setDragging(null);
      setOver({ col: null, beforeId: null });
    };

    return React.createElement("div", { className: "board" },
      COLUMNS.map((c) => {
        const items = byStatus(c.id);
        return React.createElement("div", { className: "column", key: c.id },
          React.createElement("div", { className: "col-head" },
            React.createElement("span", { className: "col-dot", style: { background: c.color } }),
            React.createElement("span", { className: "col-title" }, c.label),
            c.hint ? React.createElement("span", { className: "col-hint" }, c.hint) : null,
            React.createElement("span", { className: "col-count" }, items.length),
            React.createElement("button", { className: "col-add", title: "이 칸에 추가", onClick: () => onAddTask(c.id) }, React.createElement(Icons.Plus, { size: 15 })),
          ),
          React.createElement("div", {
            className: "col-body" + (over.col === c.id ? " dragover" : ""),
            onDragOver: (e) => { e.preventDefault(); if (over.col !== c.id || over.beforeId !== null) setOver({ col: c.id, beforeId: null }); },
            onDrop: (e) => { e.preventDefault(); handleDrop(c.id); },
          },
            items.length === 0 && over.col !== c.id ? React.createElement("div", { className: "col-empty" }, "비어 있음") : null,
            items.map((t) => React.createElement(React.Fragment, { key: t.id },
              React.createElement(TaskCard, {
                task: t, project: projOf(t), meeting: meetOf(t),
                bookmarkCount: (t.bookmarkIds || []).length,
                onOpen: onOpenTask, onToggleDone,
                dragging: dragging === t.id,
                dragHandlers: {
                  onDragStart: (e) => { setDragging(t.id); e.dataTransfer.effectAllowed = "move"; },
                  onDragEnd: () => { setDragging(null); setOver({ col: null, beforeId: null }); },
                  onDragOver: (e) => {
                    e.preventDefault(); e.stopPropagation();
                    const r = e.currentTarget.getBoundingClientRect();
                    const before = e.clientY < r.top + r.height / 2;
                    const bid = before ? t.id : (items[items.indexOf(t) + 1] || {}).id || null;
                    if (over.col !== c.id || over.beforeId !== bid) setOver({ col: c.id, beforeId: bid });
                  },
                  onDrop: (e) => { e.preventDefault(); e.stopPropagation(); handleDrop(c.id); },
                },
              }),
            )),
            React.createElement("button", { className: "col-add", style: { alignSelf: "flex-start", marginTop: 2, fontSize: 12, padding: "5px 6px", display: "flex", gap: 6, color: "var(--ink-3)" }, onClick: () => onAddTask(c.id) },
              React.createElement(Icons.Plus, { size: 14 }), "추가"),
          ),
        );
      }),
    );
  }

  window.BoardView = BoardView;
})();
