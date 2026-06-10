/* ReviewView — completed tasks for perf review. Exposes window.ReviewView */
(function () {
  const { fmtDue, ProjectTag, AvatarStack } = window.UI;
  const Icons = window.Icons;
  const { useState } = React;

  function ReviewView({ state, onOpenTask }) {
    const [qFilter, setQFilter] = useState("all");
    const [projFilter, setProjFilter] = useState("all");
    const [copied, setCopied] = useState(false);

    const done = state.tasks.filter((t) => t.status === "done");
    const quarters = Array.from(new Set(done.map((t) => t.quarter).filter(Boolean))).sort().reverse();

    let filtered = done.slice();
    if (qFilter !== "all") filtered = filtered.filter((t) => t.quarter === qFilter);
    if (projFilter !== "all") filtered = filtered.filter((t) => t.project === projFilter);
    filtered.sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));

    // group by quarter
    const groups = {};
    filtered.forEach((t) => { const k = t.quarter || "기타"; (groups[k] = groups[k] || []).push(t); });
    const groupKeys = Object.keys(groups).sort().reverse();

    const projOf = (t) => state.projects.find((p) => p.id === t.project);

    const doExport = () => {
      let md = "# 완료 업무 — 성과 기록\n\n";
      groupKeys.forEach((k) => {
        md += `## ${k}\n\n`;
        groups[k].forEach((t) => {
          md += `- **${t.title}**` + (t.completedAt ? ` _(${fmtDue(t.completedAt)})_` : "") + "\n";
          if (t.impact) md += `  - ${t.impact}\n`;
        });
        md += "\n";
      });
      navigator.clipboard.writeText(md).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
    };

    return React.createElement("div", { className: "scroll-page fade-in" },
      React.createElement("div", { className: "review-bar" },
        React.createElement("div", { className: "chips" },
          React.createElement("button", { className: "chip-btn" + (qFilter === "all" ? " on" : ""), onClick: () => setQFilter("all") }, "전체 분기"),
          quarters.map((q) => React.createElement("button", { key: q, className: "chip-btn" + (qFilter === q ? " on" : ""), onClick: () => setQFilter(q) }, q))),
        React.createElement("div", { style: { width: 1, height: 20, background: "var(--line)" } }),
        React.createElement("select", { className: "selectbox", style: { width: "auto" }, value: projFilter, onChange: (e) => setProjFilter(e.target.value) },
          React.createElement("option", { value: "all" }, "모든 프로젝트"),
          state.projects.map((p) => React.createElement("option", { key: p.id, value: p.id }, p.name))),
        React.createElement("div", { style: { flex: 1 } }),
        React.createElement("span", { className: "muted", style: { fontSize: 12.5, fontFamily: "var(--mono)" } }, `${filtered.length}건`),
        React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: doExport },
          React.createElement(copied ? Icons.Check : Icons.External, { size: 14 }), copied ? "복사됨!" : "마크다운 복사"),
      ),

      groupKeys.length === 0 ? React.createElement("div", { className: "empty-inner", style: { padding: 60 } },
        React.createElement(Icons.Trophy, { size: 40 }), React.createElement("div", null, "완료된 업무가 여기에 쌓입니다")) :
      groupKeys.map((k) => React.createElement("div", { className: "q-block", key: k },
        React.createElement("div", { className: "q-head" },
          React.createElement("span", { className: "q-title" }, k),
          React.createElement("span", { className: "q-meta" }, `${groups[k].length}건`),
          React.createElement("span", { className: "q-line" })),
        groups[k].map((t) => React.createElement("div", { className: "done-card", key: t.id, onClick: () => onOpenTask(t.id) },
          React.createElement("div", { className: "done-mark" }, React.createElement(Icons.Check, { size: 13 })),
          React.createElement("div", { style: { flex: 1, minWidth: 0 } },
            React.createElement("div", { className: "done-title" }, t.title),
            t.impact ? React.createElement("div", { className: "done-impact" },
              React.createElement("span", { className: "q" }, "↗"), React.createElement("span", null, t.impact)) :
              React.createElement("div", { className: "impact-empty" }, "임팩트 메모를 추가하면 평가 자료로 바로 쓸 수 있어요 — 클릭해서 작성"),
            React.createElement("div", { className: "done-meta" },
              t.completedAt ? React.createElement("span", { className: "due normal" }, React.createElement(Icons.Check, { size: 11 }), fmtDue(t.completedAt) + " 완료") : null,
              projOf(t) ? React.createElement(ProjectTag, { project: projOf(t) }) : null,
              React.createElement(AvatarStack, { people: t.people, sm: true }))))),
      )),
    );
  }

  window.ReviewView = ReviewView;
})();
