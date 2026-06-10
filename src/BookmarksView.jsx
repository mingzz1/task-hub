/* BookmarksView — compact categorized list, linked to tasks. Categories are editable. */
import React, { useState } from "react";
import { Icons } from "./icons.jsx";

const CAT_PALETTE = [
  "oklch(0.55 0.15 25)", "oklch(0.58 0.12 62)", "oklch(0.5 0.08 110)", "oklch(0.55 0.13 150)",
  "oklch(0.52 0.09 195)", "oklch(0.52 0.11 250)", "oklch(0.52 0.13 264)", "oklch(0.52 0.13 300)",
  "oklch(0.55 0.13 330)", "oklch(0.55 0.02 80)",
];
const UNCAT_COLOR = "var(--ink-3)";

function Swatches({ value, onPick }) {
  return React.createElement("div", { style: { display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" } },
    CAT_PALETTE.map((col) => React.createElement("button", {
      key: col, title: "색상 선택",
      style: {
        width: 18, height: 18, borderRadius: "50%", background: col, cursor: "pointer",
        border: value === col ? "2px solid var(--ink)" : "2px solid transparent",
      },
      onClick: () => onPick(col),
    })));
}

export function BookmarksView({ state, query, onAddBookmark, onDeleteBookmark, onOpenTask,
                                onAddCategory, onUpdateCategory, onDeleteCategory }) {
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", url: "", category: (state.bmCategories[0] || {}).id || "", note: "" });
  const [catForm, setCatForm] = useState(null); // null | { name, color }
  const [editCatId, setEditCatId] = useState(null);
  const q = query.trim().toLowerCase();

  const linkedTasks = (bid) => state.tasks.filter((t) => (t.bookmarkIds || []).includes(bid));
  // 카테고리가 없거나(null) 삭제된 카테고리를 가리키면 미분류로 취급
  const isUncat = (b) => !b.category || !state.bmCategories.some((c) => c.id === b.category);

  const bms = state.bookmarks.filter((b) => {
    if (filter === "none" && !isUncat(b)) return false;
    if (filter !== "all" && filter !== "none" && b.category !== filter) return false;
    if (q && !(b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q) || (b.note || "").toLowerCase().includes(q))) return false;
    return true;
  });
  const ofCat = (cid) => bms.filter((b) => b.category === cid);
  const uncatBms = bms.filter(isUncat);
  const hasUncat = state.bookmarks.some(isUncat);

  // 검색 중에는 결과가 있는 카테고리만, 평소에는 빈 카테고리도 보여서 관리 가능하게
  const visibleCats = state.bmCategories
    .filter((c) => filter === "all" || filter === c.id)
    .filter((c) => !q || ofCat(c.id).length);
  const showUncat = (filter === "all" || filter === "none") && uncatBms.length > 0;

  const submit = () => {
    if (!form.title.trim()) return;
    onAddBookmark({ ...form, category: form.category || null, url: form.url.replace(/^https?:\/\//, "") });
    setForm({ title: "", url: "", category: (state.bmCategories[0] || {}).id || "", note: "" });
    setAdding(false);
  };

  const submitCat = () => {
    if (!catForm || !catForm.name.trim()) return;
    onAddCategory({ name: catForm.name.trim(), color: catForm.color });
    setCatForm(null);
  };

  const removeCat = (c) => {
    const n = state.bookmarks.filter((b) => b.category === c.id).length;
    if (n && !confirm(`'${c.name}' 카테고리에 북마크 ${n}개가 있습니다.\n삭제하면 해당 북마크는 '미분류'로 이동합니다.`)) return;
    if (editCatId === c.id) setEditCatId(null);
    if (filter === c.id) setFilter("all");
    onDeleteCategory(c.id);
  };

  const bmRow = (b, color) => {
    const links = linkedTasks(b.id);
    return React.createElement("div", { className: "bm-row", key: b.id },
      React.createElement("a", { className: "bm-row-main", href: "https://" + b.url, target: "_blank", rel: "noreferrer" },
        React.createElement("span", { className: "bm-fav", style: { background: color } }, b.title.slice(0, 1)),
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
  };

  const catHead = (c) => {
    const editing = editCatId === c.id;
    if (!editing) return React.createElement("div", { className: "bm-cat-head" },
      React.createElement("span", { className: "tag-dot", style: { background: c.color, width: 9, height: 9 } }),
      React.createElement("span", { className: "bm-cat-name" }, c.name),
      React.createElement("span", { className: "muted", style: { fontSize: 12, fontFamily: "var(--mono)" } }, ofCat(c.id).length),
      React.createElement("button", { className: "btn-icon", style: { padding: 3 }, title: "카테고리 편집", onClick: () => setEditCatId(c.id) }, React.createElement(Icons.Edit, { size: 13 })),
      React.createElement("button", { className: "btn-icon", style: { padding: 3 }, title: "카테고리 삭제", onClick: () => removeCat(c) }, React.createElement(Icons.Trash, { size: 13 })));
    return React.createElement("div", { className: "bm-cat-head", style: { flexWrap: "wrap", rowGap: 6 } },
      React.createElement("span", { className: "tag-dot", style: { background: c.color, width: 9, height: 9 } }),
      React.createElement("input", {
        className: "input", style: { width: 160, padding: "4px 10px" }, value: c.name, autoFocus: true,
        onChange: (e) => onUpdateCategory(c.id, { name: e.target.value }),
        onKeyDown: (e) => { if ((e.key === "Enter" && !e.nativeEvent.isComposing) || e.key === "Escape") setEditCatId(null); },
      }),
      React.createElement(Swatches, { value: c.color, onPick: (col) => onUpdateCategory(c.id, { color: col }) }),
      React.createElement("button", { className: "btn btn-primary btn-sm", onClick: () => setEditCatId(null) }, "완료"));
  };

  return React.createElement("div", { className: "content", style: { overflow: "hidden" } },
    React.createElement("div", { className: "bm-cats" },
      React.createElement("button", { className: "chip-btn" + (filter === "all" ? " on" : ""), onClick: () => setFilter("all") }, "전체"),
      state.bmCategories.map((c) => React.createElement("button", {
        key: c.id, className: "chip-btn" + (filter === c.id ? " on" : ""), onClick: () => setFilter(c.id),
      }, React.createElement("span", { className: "tag-dot", style: { background: c.color } }), c.name)),
      hasUncat ? React.createElement("button", { className: "chip-btn" + (filter === "none" ? " on" : ""), onClick: () => setFilter("none") },
        React.createElement("span", { className: "tag-dot", style: { background: UNCAT_COLOR } }), "미분류") : null,
      React.createElement("button", { className: "chip-btn", title: "카테고리 추가", onClick: () => setCatForm(catForm ? null : { name: "", color: CAT_PALETTE[5] }) },
        React.createElement(Icons.Plus, { size: 13 }), "카테고리"),
      React.createElement("div", { style: { flex: 1 } }),
      React.createElement("button", { className: "btn btn-primary btn-sm", onClick: () => setAdding(!adding) }, React.createElement(Icons.Plus, { size: 14 }), "북마크 추가")),

    catForm ? React.createElement("div", { className: "bm-addform", style: { gridTemplateColumns: "220px auto 1fr" } },
      React.createElement("input", {
        className: "input", placeholder: "카테고리 이름", value: catForm.name, autoFocus: true,
        onChange: (e) => setCatForm({ ...catForm, name: e.target.value }),
        onKeyDown: (e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) submitCat(); },
      }),
      React.createElement(Swatches, { value: catForm.color, onPick: (col) => setCatForm({ ...catForm, color: col }) }),
      React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8 } },
        React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setCatForm(null) }, "취소"),
        React.createElement("button", { className: "btn btn-primary btn-sm", onClick: submitCat }, "추가"))) : null,

    adding ? React.createElement("div", { className: "bm-addform" },
      React.createElement("input", { className: "input", placeholder: "제목", value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }), autoFocus: true }),
      React.createElement("input", { className: "input", placeholder: "URL (예: wiki.acme.internal/...)", value: form.url, onChange: (e) => setForm({ ...form, url: e.target.value }) }),
      React.createElement("select", { className: "selectbox", value: form.category, onChange: (e) => setForm({ ...form, category: e.target.value }) },
        state.bmCategories.map((c) => React.createElement("option", { key: c.id, value: c.id }, c.name)),
        React.createElement("option", { value: "" }, "미분류")),
      React.createElement("input", { className: "input", placeholder: "메모 (선택)", value: form.note, onChange: (e) => setForm({ ...form, note: e.target.value }) }),
      React.createElement("div", { style: { gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 8 } },
        React.createElement("button", { className: "btn btn-ghost btn-sm", onClick: () => setAdding(false) }, "취소"),
        React.createElement("button", { className: "btn btn-primary btn-sm", onClick: submit }, "추가"))) : null,

    React.createElement("div", { className: "bm-list-wrap" },
      visibleCats.length === 0 && !showUncat ?
        React.createElement("div", { className: "empty-inner", style: { padding: 60 } }, React.createElement(Icons.Bookmark, { size: 38 }), React.createElement("div", null, "북마크가 없습니다")) :
        React.createElement(React.Fragment, null,
          visibleCats.map((c) => React.createElement("div", { className: "bm-cat-block", key: c.id },
            catHead(c),
            React.createElement("div", { className: "bm-rows" },
              ofCat(c.id).length === 0 ? React.createElement("div", { className: "muted", style: { fontSize: 12, padding: "6px 4px" } }, "북마크 없음") :
                ofCat(c.id).map((b) => bmRow(b, c.color))))),
          showUncat ? React.createElement("div", { className: "bm-cat-block", key: "__uncat" },
            React.createElement("div", { className: "bm-cat-head" },
              React.createElement("span", { className: "tag-dot", style: { background: UNCAT_COLOR, width: 9, height: 9 } }),
              React.createElement("span", { className: "bm-cat-name" }, "미분류"),
              React.createElement("span", { className: "muted", style: { fontSize: 12, fontFamily: "var(--mono)" } }, uncatBms.length)),
            React.createElement("div", { className: "bm-rows" }, uncatBms.map((b) => bmRow(b, UNCAT_COLOR)))) : null))
  );
}
