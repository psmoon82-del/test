/* ============================================================ state, scoring, persistence */
const S = {
  mode: "boot", uid: null, isOwner: false, db: null, sample: null, user: null,
  P: null,
  AI: { portrait: null, map: null, insights: {} },
  CHAT: { turns: [], topic: "auto" },
  LOG: { items: [] },
  ui: {
    view: "home", ch: null, step: 0,
    lovesCat: null, thGroup: null, thItem: null, wantType: null,
    logFilter: "all", logQ: "", mapSel: null, mapHide: {}, ganttRange: "all", editEvent: null,
    busy: {},
  },
  saveState: "idle",
  diag: { caps: null, perms: null, save: null, ai: null, writes: 0, lastWrite: null },
};

function blankProfile() {
  return {
    v: 3, rev: 0, revLog: [], createdAt: nowISO(), updatedAt: nowISO(),
    basics: { name: "", nick: "", birthYear: null, birthEst: false, region: "", family: "", job: "", career: "", intro: "", confirmed: false },
    wheel: { areas: {} }, wheelHist: [],
    ipip: { answers: {} },
    values: { picks: {} },
    energy: { acts: {}, flowRecent: "", flowChild: "", flowLast: "", chrono: {}, disc: {} },
    loves: { cats: {}, seen: {} },
    thoughts: { items: [] },
    wants: { items: [] },
    timeline: { events: [] },
    facts: [], hints: {}, prior: {}, progressLog: [], done: {}, chapterAt: {},
  };
}
function ensureShape(P) {
  const b = blankProfile();
  for (const k in b) if (P[k] == null) P[k] = b[k];
  for (const k of ["basics", "wheel", "ipip", "values", "energy", "loves", "thoughts", "wants", "timeline"]) {
    for (const kk in b[k]) if (P[k][kk] == null) P[k][kk] = b[k][kk];
  }
  if (!P.done) P.done = {};
  if (!P.loves.seen) P.loves.seen = {};
  LOVE_CATS.forEach((c) => { if (!P.loves.cats[c.id]) P.loves.cats[c.id] = { subs: [], items: [] }; });
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
  ACTS.forEach((a) => { const v = P.energy.acts[a.id]; if (v) r[v].push(a); });
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
      const a = Object.keys(e.acts).length / ACTS.length;
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
    case "thoughts": { const it = P.thoughts.items; return it.length ? Math.round((it.filter((x) => x.status).length / it.length) * 100) : 0; }
    case "wants": { const it = P.wants.items; return it.length ? Math.round((it.filter((x) => x.rv).length / it.length) * 100) : 0; }
    case "timeline": { const ev = P.timeline.events; return ev.length ? Math.round((ev.filter((x) => !x.est && x.s).length / ev.length) * 100) : 0; }
  }
  return 0;
}
function chState(P, id) { if (P.done[id]) return "done"; return chProgress(P, id) > 0 ? "doing" : "todo"; }
function overall(P) {
  const base = avg(CH.map((c) => (P.done[c.id] ? 100 : chProgress(P, c.id) * 0.9)));
  const ivFacts = P.facts.filter((f) => f.src === "interview").length;
  const extra = (S.AI.portrait ? 5 : 0) + (S.AI.map ? 3 : 0) + Math.min(7, ivFacts);
  return Math.round(base * 0.85 + extra);
}
function nextAction(P) {
  const ch = CH.find((c) => !P.done[c.id]);
  if (ch) {
    const st = chState(P, ch.id);
    return { kind: "ch", ch, label: (st === "doing" ? "이어서 하기 · " : "시작하기 · ") + "CH." + ch.code + " " + ch.name, desc: ch.title, href: "#journey/" + ch.id };
  }
  if (!S.AI.portrait) return { kind: "portrait", label: "자기 초상 그리기", desc: "여정을 모두 마쳤어요. Claude가 한 장의 초상으로 정리합니다.", href: "#portrait" };
  return { kind: "interview", label: "시운전 · AI 인터뷰", desc: "빈 곳을 대화로 채워 초상을 더 선명하게 만들어요.", href: "#interview" };
}
function bumpRev(note) {
  const P = S.P; P.rev = (P.rev || 0) + 1;
  P.revLog.push({ rev: P.rev, at: nowISO(), note });
  if (P.revLog.length > 60) P.revLog = P.revLog.slice(-60);
}
const revStr = () => "REV." + pad2(S.P?.rev || 0);

/* ---------------- persistence ---------------- */
const DOCS = { profile: () => S.P, ai: () => S.AI, chat: () => S.CHAT, log: () => S.LOG };
const dirty = new Set();
let writing = Promise.resolve();
function docPath(name) { return "data/users/" + S.uid + "/" + name; }
function markDirty(...names) {
  names.forEach((n) => dirty.add(n));
  if (S.P) S.P.updatedAt = nowISO();
  trackProgress();
  flushSoon();
}
const flushSoon = debounce(flush, 900);
function setSave(st) { S.saveState = st; $$(".save-state").forEach((el) => { el.className = "save-state " + st; const t = el.querySelector("span"); if (t) t.textContent = { idle: "저장됨", saving: "저장 중", off: "저장 안 됨(미리보기)", err: "저장 실패" }[st] || st; }); }
function flush() {
  if (S.mode !== "cloud" || !S.db || !S.uid) { dirty.clear(); return; }
  const names = Array.from(dirty); dirty.clear();
  if (!names.length) return;
  setSave("saving"); renderDiag();
  writing = writing.then(async () => {
    for (const n of names) {
      try { await S.db.doc(docPath(n)).set(clone(DOCS[n]())); S.diag.writes++; S.diag.lastWrite = new Date().toLocaleTimeString(); }
      catch (e) {
        if (e && e.code === "unavailable") { try { await new Promise((r) => setTimeout(r, 800 + Math.random() * 600)); await S.db.doc(docPath(n)).set(clone(DOCS[n]())); S.diag.writes++; S.diag.lastWrite = new Date().toLocaleTimeString(); continue; } catch (e2) { e = e2; } }
        noteErr("save", e); setSave("err"); toast("저장하지 못했어요 (" + ((e && e.code) || "오류") + "). 잠시 후 다시 시도해 주세요.");
        dirty.add(n); return;
      }
    }
    S.diag.save = null; setSave("idle"); renderDiag();
  });
}
window.addEventListener("beforeunload", () => { if (dirty.size) flush(); });
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
  S.diag[kind] = { code: (e && e.code) || "unknown", msg: String((e && e.message) || (e && e.code ? "" : e) || "").slice(0, 200), at: new Date().toLocaleTimeString() };
  console.error("[lifedock] " + kind + " failed", e);
  renderDiag();
}
async function readPerms() {
  try { const pm = await window.claude.use("permissions"); S.diag.perms = pm ? await pm.state() : null; } catch (e) { S.diag.perms = null; }
  renderDiag();
}
async function boot() {
  const c = window.claude;
  if (!c || typeof c.use !== "function") {
    S.mode = "local"; S.P = ensureShape(blankProfile());
    return;
  }
  const [db, user, sample] = await Promise.all([
    withTimeout(c.use("db").catch(() => null), 12000, null),
    withTimeout(c.use("user").catch(() => null), 12000, null),
    withTimeout(c.use("sample").catch(() => null), 12000, null),
  ]);
  S.db = db; S.user = user; S.sample = sample;
  S.diag.caps = { db: !!db, user: !!user, sample: !!sample };
  readPerms();
  if (user) {
    try { S.uid = await user.id(); } catch (e) { S.uid = null; }
    try { S.isOwner = await user.isOwner(); } catch (e) { S.isOwner = false; }
  }
  if (!db || !S.uid) { S.mode = db ? "noid" : "local"; S.P = ensureShape(blankProfile()); return; }
  S.mode = "cloud";
  try {
    const [p, ai, chat, log] = await Promise.all(["profile", "ai", "chat", "log"].map((n) => db.doc(docPath(n)).get()));
    const blankish = (d) => !d || (!(d.basics && d.basics.name) && !(d.facts || []).length && !(d.rev) && !((d.thoughts && d.thoughts.items) || []).length && !Object.keys((d.ipip && d.ipip.answers) || {}).length);
    if (p.exists && !(S.isOwner && blankish(p.data()) && !(log.exists && (log.data().items || []).length))) {
      S.P = ensureShape(p.data());
      if (ai.exists) S.AI = Object.assign({ portrait: null, map: null, insights: {} }, ai.data());
      if (chat.exists) S.CHAT = Object.assign({ turns: [], topic: "auto" }, chat.data());
      if (log.exists) S.LOG = Object.assign({ items: [] }, log.data());
    } else {
      let seeded = false;
      if (S.isOwner) {
        try {
          const sd = await db.doc("seed/owner").get();
          if (sd.exists) { const d = sd.data(); S.P = ensureShape(clone(d.profile)); S.LOG = clone(d.log || { items: [] }); seeded = true; }
        } catch (e) { /* no seed */ }
      }
      if (!seeded) S.P = ensureShape(blankProfile());
      S.P.createdAt = nowISO();
      trackProgress();
      markDirty("profile", "log", "ai", "chat");
      S.firstRun = true; S.seeded = seeded;
    }
  } catch (e) {
    S.mode = "noid"; S.P = ensureShape(blankProfile());
    S.bootErr = (e && e.code) || "load"; noteErr("boot", e);
  }
}
