/* Shared primitives + date utils */
import React from "react";
import { PEOPLE, today } from "./store.js";
import { Icons } from "./icons.jsx";

export const WD = ["일", "월", "화", "수", "목", "금", "토"];
export const PRI = {
  high: { c: "var(--pri-high)", label: "높음" },
  med: { c: "var(--pri-med)", label: "중간" },
  low: { c: "var(--pri-low)", label: "낮음" },
};

export function parseISO(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}
export function todayDate() {
  const t = new Date(today + "T00:00:00");
  t.setHours(0, 0, 0, 0);
  return t;
}
export function dayDiff(iso) {
  const d = parseISO(iso);
  if (!d) return null;
  return Math.round((d - todayDate()) / 86400000);
}
export function fmtDue(iso) {
  const d = parseISO(iso);
  if (!d) return "날짜 없음";
  return `${d.getMonth() + 1}/${d.getDate()} (${WD[d.getDay()]})`;
}
export function dueClass(iso) {
  const diff = dayDiff(iso);
  if (diff === null) return "none";
  if (diff < 0) return "over";
  if (diff === 0) return "today";
  if (diff <= 2) return "soon";
  return "normal";
}
export function dueLabel(iso) {
  const diff = dayDiff(iso);
  if (diff === null) return "";
  if (diff < 0) return `${Math.abs(diff)}일 지남`;
  if (diff === 0) return "오늘";
  if (diff === 1) return "내일";
  return fmtDue(iso);
}

export function isoOf(dateObj) {
  return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
}

// recurring rule match
export function recurringOn(m, dateObj) {
  if (dateObj.getDay() !== m.weekday) return false;
  const anchor = parseISO(m.anchor);
  if (!anchor) return true;
  const ev = m.everyWeeks || 1;
  const weeks = Math.round((dateObj - anchor) / (7 * 86400000));
  return ((weeks % ev) + ev) % ev === 0;
}

// does a meeting (any kind) occur on a date? returns array of occurrences {time,label}
export function meetingOccurrencesOn(m, dateObj) {
  const di = isoOf(dateObj);
  if (m.kind === "oneoff") return m.date === di ? [{ time: m.time, label: null }] : [];
  if (m.kind === "series") return (m.sessions || []).filter((s) => s.date === di).map((s) => ({ time: s.time, label: s.label }));
  return recurringOn(m, dateObj) ? [{ time: m.time, label: null }] : [];
}
// back-compat boolean
export function meetingOnDate(m, dateObj) { return meetingOccurrencesOn(m, dateObj).length > 0; }

export function nextMeetingDate(m) {
  const t = todayDate();
  if (m.kind === "oneoff") return (m.date && parseISO(m.date) >= t) ? m.date : null;
  if (m.kind === "series") {
    const up = (m.sessions || []).map((s) => s.date).filter((dt) => parseISO(dt) >= t).sort();
    return up[0] || null;
  }
  for (let i = 0; i < 56; i++) {
    const x = new Date(t); x.setDate(t.getDate() + i);
    if (recurringOn(m, x)) return isoOf(x);
  }
  return null;
}
export function cadenceLabel(m) {
  if (m.kind === "oneoff") return `1회 · ${fmtDue(m.date)} ${m.time || ""}`.trim();
  if (m.kind === "series") return `시리즈 · ${(m.sessions || []).length}회`;
  return `${m.everyWeeks === 2 ? "격주" : "매주"} ${WD[m.weekday]} ${m.time}`;
}
export const KIND_LABEL = { recurring: "반복", oneoff: "1회성", series: "시리즈" };

export const PriorityDot = ({ p, withLabel }) => {
  const cfg = PRI[p] || PRI.low;
  return React.createElement("span", { className: "tag", style: { background: "transparent", padding: 0, color: "var(--ink-2)" }, title: `우선순위 ${cfg.label}` },
    React.createElement("span", { className: "pri-dot", style: { background: cfg.c } }),
    withLabel ? React.createElement("span", { style: { fontSize: 11 } }, cfg.label) : null);
};

// 이름에서 고정 색상 유도 — 샘플 인물 외의 사람도 회색이 아닌 고유 색을 갖도록
function hueOf(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)) % 360;
  return h;
}

export const Avatar = ({ name, sm }) => {
  const color = PEOPLE[name] || (name ? `oklch(0.55 0.12 ${hueOf(name)})` : "var(--ink-3)");
  const txt = name ? Array.from(name)[0] : "?";
  return React.createElement("span", { className: "avatar" + (sm ? " sm" : ""), style: { background: color }, title: name }, txt);
};

export const AvatarStack = ({ people, sm }) => {
  if (!people || !people.length) return null;
  return React.createElement("span", { className: "people" },
    people.slice(0, 3).map((n) => React.createElement(Avatar, { key: n, name: n, sm })),
    people.length > 3 ? React.createElement("span", { className: "avatar" + (sm ? " sm" : ""), style: { background: "var(--surface-3)", color: "var(--ink-2)" } }, "+" + (people.length - 3)) : null);
};

export const ProjectTag = ({ project }) => {
  if (!project) return null;
  return React.createElement("span", { className: "tag", style: { background: "var(--surface-2)", color: "var(--ink-2)" } },
    React.createElement("span", { className: "tag-dot", style: { background: project.color } }),
    project.name);
};

export const DueBadge = ({ iso, plain }) => {
  const cls = dueClass(iso);
  return React.createElement("span", { className: "due " + cls },
    React.createElement(Icons.Clock, { size: 11 }),
    plain ? fmtDue(iso) : dueLabel(iso));
};
