/* ============================================================ state, persistence, diagnostics */
const S = {
  mode: "boot", uid: null, isOwner: false,
  B: null,                 /* b_book: settings and meta */
  ISS: { items: [] },      /* b_issues: the issue map */
  SC: { items: [] },       /* b_scenes: my record (scenes I told) */
  AT: null,                /* b_atlas: material imported from an Atlas JSON export */
  PC: {},                  /* b_p_<issue id>: interview and draft of one piece */
  ui: { view: "home", issue: null, area: "all", scEdit: null, busy: {}, err: {} },
  saveState: "idle",
  diag: { caps: null, perms: null, save: null, ai: null, writes: 0, lastWrite: null },
};

function blankBook() {
  return { v: 1, createdAt: nowISO(), updatedAt: nowISO(), meta: { rejected: [], suggestedAt: null } };
}
function blankPiece() {
  return {
    iv: { turns: [], slots: {}, check: {}, quotes: [], scenes: [], n: 0, pend: false },
    draft: null,
  };
}
function ensurePiece(id) {
  if (!S.PC[id]) S.PC[id] = blankPiece();
  const p = S.PC[id], b = blankPiece();
  for (const k in b.iv) if (p.iv[k] == null) p.iv[k] = b.iv[k];
  return p;
}
const issueById = (id) => S.ISS.items.find((x) => x.id === id);
function addIssue(area, q, extra) {
  const it = Object.assign({ id: uid("i"), area: AREA_BY[area] ? area : "meaning", q: String(q).trim(), status: "idea", at: nowISO() }, extra || {});
  S.ISS.items.push(it);
  return it;
}

/* ---------------- persistence ----------------
   Each piece has its own document so no single one nears the store's 256 KiB cap.
   flush() writes only documents whose JSON changed since the last successful save. */
const DOC_LIMIT = 240 * 1024;
const lastSaved = {};
const knownDocs = new Set();
let writing = Promise.resolve();

function stateDocs() {
  const d = { b_book: S.B, b_issues: S.ISS, b_scenes: S.SC };
  if (S.AT) d.b_atlas = S.AT;
  for (const id in S.PC) d["b_p_" + id] = S.PC[id];
  return d;
}
function markDirty() { if (S.B) S.B.updatedAt = nowISO(); flushSoon(); }
const flushSoon = debounce(flush, 900);
function setSave(st) { S.saveState = st; $$(".save-state").forEach((el) => { el.className = "save-state " + st; const t = el.querySelector("span"); if (t) t.textContent = { idle: "저장됨", saving: "저장 중", off: "저장 안 됨", local: "이 브라우저에 저장", err: "저장 실패" }[st] || st; }); }
function flush() {
  if (!S.B || (S.mode !== "cloud" && S.mode !== "local")) return;
  writing = writing.then(async () => {
    const docs = stateDocs();
    const changed = Object.keys(docs).map((n) => [n, JSON.stringify(docs[n])]).filter(([n, j]) => j !== lastSaved[n]);
    if (!changed.length) return;
    setSave("saving"); renderDiag();
    for (const [n, j] of changed) {
      if (j.length > DOC_LIMIT) { noteErr("save", { code: "too_large", message: n + " " + Math.round(j.length / 1024) + "KB" }); setSave("err"); toast("'" + n + "' 문서가 너무 커져 저장하지 못했어요."); return; }
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
/* a document that should no longer exist: an issue's piece, or the Atlas import */
function dropDoc(n) {
  if (!knownDocs.has(n)) return;
  writing = writing.then(async () => {
    try { await Backend.remove(n); knownDocs.delete(n); delete lastSaved[n]; } catch (e) { noteErr("save", e); }
  });
}
function dropPiece(id) { delete S.PC[id]; dropDoc("b_p_" + id); }
window.addEventListener("beforeunload", () => flush());

async function withTimeout(p, ms, fallback) {
  let t; const timer = new Promise((r) => { t = setTimeout(() => r(fallback), ms); });
  const v = await Promise.race([p, timer]); clearTimeout(t); return v;
}
/* diagnostics: what the viewer actually served, and the last failure codes */
function noteErr(kind, e) {
  S.diag[kind] = { code: (e && e.code) || (e && e.name) || "unknown", msg: String((e && e.message) || (e && e.code ? "" : e) || "").slice(0, 200), at: new Date().toLocaleTimeString() };
  console.error("[book] " + kind + " failed", e);
  renderDiag();
}
window.addEventListener("error", (ev) => noteErr("js", ev.error || { message: ev.message }));
window.addEventListener("unhandledrejection", (ev) => noteErr("js", ev.reason));
async function readPerms() {
  try { const pm = window.claude && (await window.claude.use("permissions")); S.diag.perms = pm ? await pm.state() : null; } catch (e) { S.diag.perms = null; }
  renderDiag();
}
async function boot() {
  await Backend.init();
  S.mode = Backend.kind; S.uid = Backend.uid; S.isOwner = Backend.isOwner;
  S.diag.caps = Object.assign({}, Backend.caps);
  readPerms();
  let docs = {};
  if (S.mode !== "noid") {
    try { docs = await Backend.loadAll(); }
    catch (e) { S.mode = "noid"; noteErr("boot", e); }
  }
  Object.keys(docs).forEach((n) => { knownDocs.add(n); lastSaved[n] = JSON.stringify(docs[n]); });
  S.B = Object.assign(blankBook(), docs.b_book || {});
  S.B.meta = Object.assign(blankBook().meta, S.B.meta || {});
  S.ISS = Object.assign({ items: [] }, docs.b_issues || {});
  S.SC = Object.assign({ items: [] }, docs.b_scenes || {});
  S.AT = docs.b_atlas || null;
  Object.keys(docs).forEach((n) => { if (n.startsWith("b_p_") && docs[n] && !docs[n].gone) S.PC[n.slice(4)] = docs[n]; });
  if (!docs.b_book) {
    /* first run: starter questions so the map is never empty */
    STARTER.forEach(([a, q]) => addIssue(a, q, { starter: true }));
    S.firstRun = true;
    flushSoon();
  }
}
