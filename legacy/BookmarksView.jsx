/* BookmarksView — compact categorized list, linked to tasks. Exposes window.BookmarksView */
(function () {
  const Icons = window.Icons;
  const { useState } = React;

  function BookmarksView({ state, query, onAddBookmark, onDeleteBookmark, onOpenTask }) {
    const [filter, setFilter] = useState("all");
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({ title: "", url: "", category: state.bmCategories[0].id, note: "" });
    const q = query.trim().toLowerCase();

    const linkedTasks = (bid) => state.tasks.filter((t) => (t.bookmarkIds || []).includes(bid));

    const bms = state.bookmarks.filter((b) => {
      if (filter !== "all" && b.category !== filter) return false;
      if (q && !(b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q) || (b.note || "").toLowerCase().includes(q))) return false;
      return true;
    });
    const cats = state.bmCategories.filter((c) => bms.some((b) => b.category === c.id));

    const submit = () => {
      if (!form.title.trim()) return;
      onAddBookmark({ ...form, url: form.url.replace(/^https?:\/\//, "") });
      setForm({ title: "", url: "", category: state.bmCategories[0].id, note: "" });
      setAdding(false);
    };

    return React.createElement("div", { className: "content", style: { overflow: "hidden" } },
      React.createElement("div", { className: "bm-cats" },
        React.createElement("button", { className: "chip-btn" + (filter === "all" ? " on" : ""), onClick: () => setFilter("all") }, "전체"),
        state.bmCategories.map((c) => React.createElement("button", {
          key: c.id, className: "chip-btn" + (filter === c.id ? " on" : ""), onClick: () => setFilter(c.id),
        }, React.createElement("span", { className: "tag-dot", style: { background: c.color } }), c.name)),
        React.createElement("div", { style: { flex: 1 } }),
        React.createElement("button", { className: "btn btn-primary btn-sm", onClick: () => setAdding(!adding) }, React.createElement(Icons.Plus, { size: 14 }), "북마크 추가")),

      adding ? React.createElement("div", { className: "bm-addform" },
        React.createElement("input", { className: "input", placeholder: "제목", value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }), autoFocus: true }),
        React.createElement("input", { className: "input", placeholder: "URL (예: wiki.acme.internal/...)", value: form.url, onChange: (e) => setForm({ ...form, url: e.target.value }) }),
        React.createElement("select", { className: "selectbox", value: form.category, onChange: (e) => setForm({ ...form, category: e.target.value }) },
          state.bmCategories.map((c) => React.createElement("option", { key: c.id, value: c.id }, c.name))),
        React.createElement("input", { className: "input", placeholder: "메모 (선택)", value: form.note, onChange: (e) => setForm({ ...form, note: e.target.value }) }),
        React.createElement("div", { style: { gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 8 } },
          React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setAdding(false) }, "취소"),
          React.createElement("button", { className: "btn btn-primary btn-sm", onClick: submit }, "추가"))) : null,

      React.createElement("div", { className: "bm-list-wrap" },
        cats.length === 0 ? React.createElement("div", { className: "empty-inner", style: { padding: 60 } }, React.createElement(Icons.Bookmark, { size: 38 }), React.createElement("div", null, "북마크가 없습니다")) :
        cats.map((c) => React.createElement("div", { className: "bm-cat-block", key: c.id },
          React.createElement("div", { className: "bm-cat-head" },
            React.createElement("span", { className: "tag-dot", style: { background: c.color, width: 9, height: 9 } }),
            React.createElement("span", { className: "bm-cat-name" }, c.name),
            React.createElement("span", { className: "muted", style: { fontSize: 12, fontFamily: "var(--mono)" } }, bms.filter((b) => b.category === c.id).length)),
          React.createElement("div", { className: "bm-rows" },
            bms.filter((b) => b.category === c.id).map((b) => {
              const links = linkedTasks(b.id);
              return React.createElement("div", { className: "bm-row", key: b.id },
                React.createElement("a", { className: "bm-row-main", href: "https://" + b.url, target: "_blank", rel: "noreferrer" },
                  React.createElement("span", { className: "bm-fav", style: { background: c.color } }, b.title.slice(0, 1)),
                  React.createElement("span", { className: "bm-row-title" }, b.title),
                  React.createElement("span", { className: "bm-row-url" }, b.url),
                  React.createElement(Icons.External, { size: 13 })),
                b.note ? React.createElement("span", { className: "bm-row-note" }, b.note) : React.createElement("span", { className: "bm-row-note muted" }, "—"),
                React.createElement("span", { className: "bm-row-links" + (links.length ? " has" : "") },
                  links.length ? React.createElement(React.Fragment, null,
                    React.createElement(Icons.Link, { size: 12 }),
                    links.slice(0, 2).map((t) => React.createElement("button", { key: t.id, className: "bm-task-pill", onClick: () => onOpenTask(t.id), title: t.title }, t.title)),
                    links.length > 2 ? React.createElement("span", { className: "muted", style: { fontSize: 11 } }, `+${links.length - 2}`) : null) :
                    React.createElement("span", { className: "muted", style: { fontSize: 11 } }, "연결 없음")),
                React.createElement("button", { className: "bm-row-del", onClick: () => onDeleteBookmark(b.id), title: "삭제" }, React.createElement(Icons.Trash, { size: 14 })));
            })))))
      );
  }

  window.BookmarksView = BookmarksView;
})();
