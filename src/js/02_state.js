/* ============================================================ state, scoring, persistence */
const S = {
  mode: "boot", uid: null, isOwner: false,
  P: null,
  AI: { portrait: null, map: null, insights: {} },
  CHAT: { turns: [], topic: "auto" },
  LOG: { items: [] },
  NUDGE: null,
  ui: {
    view: "home", ch: null, step: 0,
    lovesCat: null, wantType: null, treeSel: null, treeView: "outline",
    ledCat: null, ledQ: "", ledEdit: null, pack: "all",
    logFilter: "all", logQ: "", mapSel: null, mapHide: {}, ganttRange: "all", editEvent: null,
    busy: {},
  },
  saveState: "idle",
  diag: { caps: null, perms: null, save: null, ai: null, writes: 0, lastWrite: null },
};

function blankProfile() {
  return {
    v: 4, rev: 0, revLog: [], createdAt: nowISO(), updatedAt: nowISO(),
    basics: { name: "", nick: "", birthYear: null, birthEst: false, region: "", family: "", job: "", career: "", intro: "", confirmed: false },
    wheel: { areas: {} }, wheelHist: [],
    ipip: { answers: {} },
    values: { picks: {} },
    energy: { acts: {}, custom: [], flowRecent: "", flowChild: "", flowLast: "", chrono: {}, disc: {} },
    loves: { cats: {}, seen: {} },
    tree: { nodes: [] },
    wants: { items: [] },
    timeline: { events: [] },
    ledger: [],
    hints: {}, prior: {}, progressLog: [], done: {}, chapterAt: {},
    meta: { migration: null, exports: [] },
  };
}
function ensureShape(P) {
  const b = blankProfile();
  for (const k in b) if (P[k] == null) P[k] = b[k];
  for (const k of ["basics", "wheel", "ipip", "values", "energy", "loves", "tree", "wants", "timeline", "meta"]) {
    for (const kk in b[k]) if (P[k][kk] == null) P[k][kk] = b[k][kk];
  }
  if (!P.loves.seen) P.loves.seen = {};
  LOVE_CATS.forEach((c) => { if (!P.loves.cats[c.id]) P.loves.cats[c.id] = { subs: [], items: [] }; });
  P.ledger.forEach((e) => { if (!CAT_BY[e.cat]) e.cat = "etc"; });
  return P;
}

/* ---------------- v3 -> v4 migration ----------------
   v3 kept free-form facts in P.facts and a flat think-tree in P.thoughts with five fixed groups.
   v4 files facts into the ledger and turns the think-tree into a real tree. The v3 document is left untouched as a backup. */
const SENSITIVE_CATS = new Set(["health", "money"]);
function migrateV3(p3) {
  const P = ensureShape(Object.assign(blankProfile(), clone(p3)));
  const now = nowISO();
  const facts = p3.facts || [];
  P.ledger = facts.filter((f) => f && f.text).map((f) => {
    const cat = AREA_TO_CAT[f.area] || "etc";
    return { id: f.id || uid("f"), cat, sub: "", label: "", value: String(f.text), date: null, sens: SENSITIVE_CATS.has(cat) ? "sensitive" : "normal", conf: "sure", src: f.src || "", rec: f.rec || null, at: f.at || now, up: f.at || now, mig: true };
  });
  const items = (p3.thoughts && p3.thoughts.items) || [];
  const nodes = [];
  const groups = Array.from(new Set(items.map((x) => x.group).filter(Boolean)));
  groups.forEach((g, i) => { const G = THOUGHT_GROUPS.find((x) => x.id === g); nodes.push({ id: "g_" + g, parent: null, label: G ? G.name : g, memo: "", now: "", status: null, weight: null, order: i }); });
  items.forEach((x, i) => {
    nodes.push({ id: x.id, parent: x.group ? "g_" + x.group : null, label: x.label, memo: x.memo || "", now: x.now || "", status: x.status || null, weight: x.weight || null, src: x.src || "", order: i });
    (x.links || []).forEach((w, k) => nodes.push({ id: x.id + "_w" + k, parent: x.id, label: String(w), kind: "word", memo: "", now: "", status: null, weight: null, order: k }));
  });
  P.tree = { nodes };
  delete P.facts; delete P.thoughts;
  P.v = 4;
  P.meta.migration = { at: now, from: 3, reviewed: false, facts: P.ledger.length, nodes: nodes.length };
  return P;
}

/* ---------------- scoring ---------------- */
function ipipScores(P) {
  const out = {};
  for (const t of TRAIT_ORDER) {
    const its = IPIP.filter((x) => x.t === t);
    const vals = its.map((x) => { const v = P.ipip.answers[x.n]; return v == null ? null : x.k > 0 ? v : 6 - v; }).filter((v) => v != null);
    out[t] = { n: vals.length, score: vals.length ? avg(vals) : null };
  }
  return out;
}
const lvl = (s) => (s == null ? null : s >= 3.6 ? "hi" : s <= 2.6 ? "lo" : "mid");
const LVL_KO = { hi: "높음", mid: "중간", lo: "낮음" };

function valueScores(P) {
  const m = {};
  VALUES.forEach((v) => (m[v.id] = { id: v.id, wins: 0, n: 0 }));
  DILEMMAS.forEach((d, i) => {
    const p = P.values.picks[i];
    if (!p) return;
    m[d.a[0]].n++; m[d.b[0]].n++;
    m[p === "a" ? d.a[0] : d.b[0]].wins++;
  });
  return Object.values(m).map((r) => ({ ...r, score: r.n ? r.wins / r.n : null }))
    .sort((x, y) => (y.score ?? -1) - (x.score ?? -1) || y.wins - x.wins);
}
function discTally(P) {
  const t = { D: 0, I: 0, S: 0, C: 0 }; let n = 0;
  DISC_PAIRS.forEach((p, i) => { const v = P.energy.disc[i]; if (v === "a") { t[p.a[0]]++; n++; } else if (v === "b") { t[p.b[0]]++; n++; } });
  const x = n ? ((t.D + t.I) - (t.S + t.C)) / n : 0;
  const y = n ? ((t.D + t.C) - (t.I + t.S)) / n : 0;
  const top = n ? Object.entries(t).sort((a, b) => b[1] - a[1]).filter((e, i, arr) => e[1] === arr[0][1]).map((e) => e[0]) : [];
  return { t, n, x, y, top };
}
function chrono(P) {
  const c = P.energy.chrono || {}; const vals = CHRONO.map((q) => c[q.id]).filter((v) => v != null);
  if (!vals.length) return null;
  const s = sum(vals) / vals.length;
  return { s, n: vals.length, label: s >= 3.8 ? "아침형" : s <= 2.4 ? "저녁형" : "중간형" };
}
function wheelStats(P) {
  return WHEEL.map((w) => {
    const a = P.wheel.areas[w.id] || {};
    const sat = a.sat ?? null, imp = a.imp ?? null;
    const gap = sat != null && imp != null ? imp * 2 - sat : null;
    return { ...w, sat, imp, gap, note: a.note || "" };
  });
}
function energyLists(P) {
  const r = { c: [], n: [], d: [] };
  allActs(P).forEach((a) => { const v = P.energy.acts[a.id]; if (v) r[v].push(a); });
  return r;
}
function allLoveItems(P) {
  const out = [];
  LOVE_CATS.forEach((c) => (P.loves.cats[c.id]?.items || []).forEach((it) => out.push({ ...it, cat: c.id })));
  return out;
}

/* ---------------- progress ---------------- */
function chProgress(P, id) {
  switch (id) {
    case "basics": { const b = P.basics; const f = ["name", "birthYear", "region", "family", "job"].filter((k) => b[k]).length; return Math.round((f / 5) * 80 + (b.confirmed ? 20 : 0)); }
    case "wheel": return Math.round((WHEEL.filter((w) => { const a = P.wheel.areas[w.id]; return a && a.sat != null && a.imp != null; }).length / WHEEL.length) * 100);
    case "ipip": return Math.round((Object.keys(P.ipip.answers).length / IPIP.length) * 100);
    case "values": return Math.round((Object.keys(P.values.picks).length / DILEMMAS.length) * 100);
    case "energy": {
      const e = P.energy;
      const a = Math.min(1, Object.keys(e.acts).length / allActs(P).length);
      const f = (e.flowRecent || e.flowLast ? 0.5 : 0) + (e.flowChild ? 0.5 : 0);
      const c = Object.keys(e.chrono || {}).length / CHRONO.length;
      const d = Object.keys(e.disc).length / DISC_PAIRS.length;
      return Math.round((a * 0.45 + f * 0.15 + c * 0.15 + d * 0.25) * 100);
    }
    case "loves": {
      const withItems = LOVE_CATS.filter((c) => (P.loves.cats[c.id]?.items || []).length).length;
      const seen = LOVE_CATS.filter((c) => P.loves.seen[c.id]).length;
      return Math.round((withItems / 7) * 60 + (seen / 7) * 40);
    }
    case "thoughts": {
      const ns = P.tree.nodes; if (!ns.length) return 0;
      const rv = ns.filter((n) => n.parent && n.kind !== "word");
      return rv.length ? Math.round((rv.filter((n) => n.status).length / rv.length) * 100) : Math.min(30, ns.length * 5);
    }
    case "wants": { const it = P.wants.items; return it.length ? Math.round((it.filter((x) => x.rv).length / it.length) * 100) : 0; }
    case "timeline": { const ev = P.timeline.events; return ev.length ? Math.round((ev.filter((x) => !x.est && x.s).length / ev.length) * 100) : 0; }
  }
  return 0;
}
function chState(P, id) { if (P.done[id]) return "done"; return chProgress(P, id) > 0 ? "doing" : "todo"; }
/* ledger categories that hold something, counting the structured sections that feed them */
function catFilled(P, c) {
  if (P.ledger.some((e) => e.cat === c)) return true;
  if (c === "taste") return allLoveItems(P).length > 0;
  if (c === "thoughts") return P.tree.nodes.length > 0;
  if (c === "goals") return P.wants.items.length > 0;
  if (c === "history") return P.timeline.events.length > 0;
  if (c === "basic") return !!P.basics.name;
  if (c === "mind") return Object.keys(P.ipip.answers).length > 0;
  return false;
}
function ledgerCoverage(P) { const cs = CAT_IDS.filter((c) => c !== "etc"); return Math.round((cs.filter((c) => catFilled(P, c)).length / cs.length) * 100); }
function overall(P) {
  const base = avg(CH.map((c) => (P.done[c.id] ? 100 : chProgress(P, c.id) * 0.9)));
  const ivFacts = P.ledger.filter((f) => f.src === "interview").length;
  const extra = (S.AI.portrait ? 4 : 0) + (S.AI.map ? 3 : 0) + Math.min(3, ivFacts);
  return Math.min(100, Math.round(base * 0.7 + ledgerCoverage(P) * 0.2 + extra));
}
function nextAction(P) {
  const ch = CH.find((c) => !P.done[c.id]);
  if (ch) {
    const st = chState(P, ch.id);
    return { kind: "ch", ch, label: (st === "doing" ? "이어서 하기 · " : "시작하기 · ") + ch.code + " " + ch.name, desc: ch.title, href: "#journey/" + ch.id };
  }
  if (!S.AI.portrait) return { kind: "portrait", label: "자기 초상 그리기", desc: "탐구를 모두 마쳤어요. Claude가 한 장의 초상으로 정리합니다.", href: "#portrait" };
  return { kind: "interview", label: "AI 인터뷰", desc: "빈 곳을 대화로 채워 지도를 더 선명하게 만들어요.", href: "#interview" };
}
function bumpRev(note) {
  const P = S.P; P.rev = (P.rev || 0) + 1;
  P.revLog.push({ rev: P.rev, at: nowISO(), note });
  if (P.revLog.length > 60) P.revLog = P.revLog.slice(-60);
}
/* editions: every chapter done, portrait or map redrawn adds one */
const revStr = () => ((S.P?.rev || 0) + 1) + "판";

/* ---------------- persistence ----------------
   The profile is split into documents so no single one nears the store's 256 KiB cap.
   flush() writes only documents whose JSON changed since the last successful save. */
const SPLIT = { a_taste: "loves", a_tree: "tree", a_goals: "wants", a_history: "timeline" };
const SPLIT_KEYS = new Set(Object.values(SPLIT).concat(["ledger"]));
const DOC_NAMES = ["a_core"].concat(Object.keys(SPLIT), CAT_IDS.map((c) => "a_led_" + c), ["ai", "chat", "log", "nudge"]);
const LEGACY_DOCS = ["profile"];
const DOC_LIMIT = 240 * 1024;
const lastSaved = {};
const knownDocs = new Set();
let writing = Promise.resolve();

function stateDocs() {
  const P = S.P, core = {};
  for (const k in P) if (!SPLIT_KEYS.has(k)) core[k] = P[k];
  const d = { a_core: core };
  for (const [name, key] of Object.entries(SPLIT)) d[name] = { [key]: P[key] };
  CAT_IDS.forEach((c) => { const items = P.ledger.filter((e) => e.cat === c); if (items.length || knownDocs.has("a_led_" + c)) d["a_led_" + c] = { items }; });
  d.ai = S.AI; d.chat = S.CHAT; d.log = S.LOG;
  if (S.NUDGE) d.nudge = S.NUDGE;
  return d;
}
function assemble(docs) {
  const P = Object.assign({}, docs.a_core);
  for (const [name, key] of Object.entries(SPLIT)) if (docs[name]) P[key] = docs[name][key];
  P.ledger = [];
  CAT_IDS.forEach((c) => { const d = docs["a_led_" + c]; if (d && Array.isArray(d.items)) P.ledger.push(...d.items); });
  return ensureShape(P);
}
function markDirty() {
  if (S.P) S.P.updatedAt = nowISO();
  trackProgress();
  flushSoon();
}
const flushSoon = debounce(flush, 900);
function setSave(st) { S.saveState = st; $$(".save-state").forEach((el) => { el.className = "save-state " + st; const t = el.querySelector("span"); if (t) t.textContent = { idle: "저장됨", saving: "저장 중", off: "저장 안 됨", local: "이 브라우저에 저장", err: "저장 실패" }[st] || st; }); }
function flush() {
  if (!S.P || (S.mode !== "cloud" && S.mode !== "local")) return;
  writing = writing.then(async () => {
    const docs = stateDocs();
    const changed = Object.keys(docs).map((n) => [n, JSON.stringify(docs[n])]).filter(([n, j]) => j !== lastSaved[n]);
    if (!changed.length) return;
    setSave("saving"); renderDiag();
    for (const [n, j] of changed) {
      if (j.length > DOC_LIMIT) { noteErr("save", { code: "too_large", message: n + " " + Math.round(j.length / 1024) + "KB" }); setSave("err"); toast("'" + n + "' 문서가 너무 커져 저장하지 못했어요. 오래된 기록을 정리해 주세요."); return; }
      const put = () => Backend.save(n, JSON.parse(j));
      let err = null;
      try { await put(); } catch (e) { err = e || { code: "unknown" }; }
      if (err && err.code === "unavailable") { await new Promise((r) => setTimeout(r, 800 + Math.random() * 600)); try { await put(); err = null; } catch (e2) { err = e2 || { code: "unknown" }; } }
      if (err) { noteErr("save", err); setSave("err"); toast("저장하지 못했어요 (" + (err.code || "오류") + "). 잠시 후 다시 시도해 주세요."); return; }
      lastSaved[n] = j; knownDocs.add(n); S.diag.writes++; S.diag.lastWrite = new Date().toLocaleTimeString();
    }
    S.diag.save = null; setSave(S.mode === "local" ? "local" : "idle"); renderDiag();
  });
}
window.addEventListener("beforeunload", () => flush());
function trackProgress() {
  const P = S.P; if (!P) return;
  const d = localDate(); const p = overall(P);
  const last = P.progressLog[P.progressLog.length - 1];
  if (last && last.d === d) last.p = p; else P.progressLog.push({ d, p });
  if (P.progressLog.length > 400) P.progressLog = P.progressLog.slice(-400);
}

async function withTimeout(p, ms, fallback) {
  let t; const timer = new Promise((r) => { t = setTimeout(() => r(fallback), ms); });
  const v = await Promise.race([p, timer]); clearTimeout(t); return v;
}
/* diagnostics: what the viewer actually served, and the last failure codes */
function noteErr(kind, e) {
  S.diag[kind] = { code: (e && e.code) || (e && e.name) || "unknown", msg: String((e && e.message) || (e && e.code ? "" : e) || "").slice(0, 200), at: new Date().toLocaleTimeString() };
  console.error("[atlas] " + kind + " failed", e);
  renderDiag();
}
window.addEventListener("error", (ev) => noteErr("js", ev.error || { message: ev.message }));
window.addEventListener("unhandledrejection", (ev) => noteErr("js", ev.reason));
async function readPerms() {
  try { const pm = window.claude && (await window.claude.use("permissions")); S.diag.perms = pm ? await pm.state() : null; } catch (e) { S.diag.perms = null; }
  renderDiag();
}
const blankishV3 = (d) => !d || (!(d.basics && d.basics.name) && !(d.facts || []).length && !d.rev && !((d.thoughts && d.thoughts.items) || []).length && !Object.keys((d.ipip && d.ipip.answers) || {}).length);
async function boot() {
  await Backend.init();
  S.mode = Backend.kind; S.uid = Backend.uid; S.isOwner = Backend.isOwner;
  S.diag.caps = Object.assign({}, Backend.caps);
  readPerms();
  if (S.mode === "noid") { S.P = ensureShape(blankProfile()); return; }
  let docs = {};
  try { docs = await Backend.loadAll(); }
  catch (e) { S.mode = "noid"; S.P = ensureShape(blankProfile()); S.diag.boot = null; noteErr("boot", e); return; }
  Object.keys(docs).forEach((n) => { knownDocs.add(n); lastSaved[n] = JSON.stringify(docs[n]); });
  if (docs.ai) S.AI = Object.assign({ portrait: null, map: null, insights: {} }, docs.ai);
  if (docs.chat) S.CHAT = Object.assign({ turns: [], topic: "auto" }, docs.chat);
  if (docs.log) S.LOG = Object.assign({ items: [] }, docs.log);
  if (docs.nudge) S.NUDGE = docs.nudge;
  if (docs.a_core) { S.P = assemble(docs); return; }
  const legacy = docs.profile;
  if (legacy && !(S.isOwner && blankishV3(legacy) && !(S.LOG.items || []).length)) {
    S.P = migrateV3(legacy); S.migrated = true;
  } else {
    let seeded = false;
    if (S.isOwner) {
      try { const sd = await Backend.readShared("seed/owner"); if (sd) { S.P = migrateV3(sd.profile); S.P.meta.migration = null; S.LOG = clone(sd.log || { items: [] }); seeded = true; } } catch (e) { /* no seed */ }
    }
    if (!seeded) S.P = ensureShape(blankProfile());
    S.P.createdAt = nowISO();
    S.firstRun = true; S.seeded = seeded;
  }
  trackProgress();
  flushSoon();
}
