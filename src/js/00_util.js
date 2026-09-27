/* ============================================================ utilities */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nl2br = (s) => esc(s).replace(/\n/g, "<br>");
const uid = (p) => (p || "x") + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sum = (a) => a.reduce((x, y) => x + y, 0);
const avg = (a) => (a.length ? sum(a) / a.length : 0);
const pad2 = (n) => String(n).padStart(2, "0");
const nowISO = () => new Date().toISOString();
const localDate = (d) => { d = d || new Date(); return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); };
const curYM = () => { const d = new Date(); return d.getFullYear() + "-" + pad2(d.getMonth() + 1); };
const nowYear = () => { const d = new Date(); return d.getFullYear() + d.getMonth() / 12; };
const fmtDot = (iso) => { if (!iso) return "-"; const d = new Date(iso); if (isNaN(d)) return String(iso); return d.getFullYear() + "." + pad2(d.getMonth() + 1) + "." + pad2(d.getDate()); };
const fmtYM = (s) => { if (!s) return "연도 미정"; const [y, m, d] = String(s).split("-"); return y + (m ? "." + m : "") + (d ? "." + d : ""); };
/* "2017-05" -> 2017.33 ; "2017" -> 2017 ; null -> null */
const ym2num = (s) => { if (s == null || s === "") return null; const p = String(s).split("-"); const y = +p[0]; if (!y) return null; const m = p[1] ? +p[1] - 1 : 0; return y + m / 12; };
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const pick = (arr, n) => arr.slice(0, n);
const clone = (o) => JSON.parse(JSON.stringify(o));
const words = (n) => n;

let toastTimer = null;
function toast(msg, ms) {
  let el = $("#toast");
  if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, ms || 2600);
}

/* inline icons (stroke = currentColor) */
const I = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3 11 12 4l9 7"/><path d="M5 10v9h14v-9"/><path d="M10 19v-5h4v5"/></svg>',
  route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5" stroke-linecap="round"/></svg>',
  log: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h10l3 3v15H6z"/><path d="M9 9h7M9 13h7M9 17h4"/></svg>',
  dwg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M13 15h8M13 15v5M3 15h4" /><path d="M7 11l3-4 3 3 2-2" stroke-linecap="round"/></svg>',
  person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6" stroke-linecap="round"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="6" r="1.8"/><circle cx="19" cy="7" r="1.8"/><circle cx="6" cy="18" r="1.8"/><circle cx="18" cy="18" r="1.8"/><path d="M10.2 10.6 6.4 7.2M13.9 10.9l3.5-2.7M10.4 13.8l-3 2.7M13.8 13.8l2.9 2.8"/></svg>',
  gantt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M3 4v16h18"/><path d="M6 8h7M9 12h9M7 16h5"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 12 20 4l-6 16-3-7z"/></svg>',
  logo: '<svg viewBox="0 0 32 32" fill="none"><rect x="1" y="1" width="30" height="30" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M5 19h22l-3 6H8z" fill="var(--accent)"/><path d="M9 19v-6h6v6M15 15h5v4" stroke="currentColor" stroke-width="1.5"/><path d="M5 8h22" stroke="var(--signal)" stroke-width="1.5" stroke-dasharray="2 2"/></svg>',
};
