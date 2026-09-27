/* ============================================================ shell, router, events */
const ROUTES = { home: viewHome, ledger: viewLedger, journey: viewJourney, tree: viewTree, interview: viewInterview, log: viewLog, export: viewExport, review: viewReview, portrait: viewPortrait, map: viewMap, gantt: viewGantt, metrics: viewMetrics };
const AFTER = { interview: afterInterview, map: afterMap, log: applyLogSearch, ledger: applyLedSearch, tree: afterTree, journey: () => { if (curCh().id === "thoughts") afterTree(); } };
const DRAWING_VIEWS = ["portrait", "map", "gantt", "metrics"];

function buildShell() {
  const nav = (v, icon, label) => '<a href="#' + v + '" data-go="' + v + '">' + icon + "<span>" + label + "</span></a>";
  $("#app").innerHTML =
    '<div class="app"><aside class="rail"><div class="brand"><div class="brand-mark">' + I.logo + '<div><div class="brand-name">Atlas</div></div></div><div class="brand-who"><span id="rOwner"></span><span class="mono" id="rRev"></span></div></div>' +
    '<nav class="nav" aria-label="주 메뉴">' + nav("home", I.home, "개요") + nav("ledger", I.ledger, "Records") + nav("journey", I.route, "탐구") + nav("interview", I.chat, "AI 인터뷰") + nav("log", I.log, "기록") + nav("tree", I.tree, "생각 나무") +
    '<div class="nav-label">한눈에 보기</div>' + nav("portrait", I.person, "자화상") + nav("map", I.map, "Network") + nav("gantt", I.gantt, "연표") + nav("metrics", I.chart, "지표") +
    '<div class="nav-label">꺼내 쓰기</div>' + nav("export", I.pack, "Pack") + "</nav>" +
    '<div class="rail-foot"><div class="save-state"><i></i><span>저장됨</span></div><div>모든 변경은 자동으로 저장돼요.</div><details class="diag"><summary>연결 상태</summary><div class="diag-body"></div></details></div></aside>' +
    '<div class="main"><header class="topbar-m"><div class="brand-mark">' + I.logo + '<span class="brand-name">Atlas</span></div><div class="row" style="gap:10px"><span class="mono muted" id="mRev" style="font-size:11px"></span><span class="save-state"><i></i><span>저장됨</span></span></div></header><main class="page" id="page"></main></div>' +
    '<nav class="tabbar" aria-label="하단 메뉴">' + [["home", I.home, "개요"], ["ledger", I.ledger, "Records"], ["journey", I.route, "탐구"], ["interview", I.chat, "인터뷰"], ["export", I.pack, "Pack"]].map(([v, ic, l]) => '<a href="#' + v + '" data-go="' + v + '" data-tab="' + v + '">' + ic + l + "</a>").join("") + "</nav></div>";
  setSave(S.mode === "cloud" ? "idle" : S.mode === "local" ? "local" : "off");
}
let lastView = null;
function diagHTML() {
  const d = S.diag, c = d.caps;
  const yn = (v) => (v ? "연결됨" : "없음");
  const row = (k, v) => "<div><b>" + esc(k) + "</b> " + esc(v) + "</div>";
  const err = (e) => (e ? e.code + (e.msg ? " — " + e.msg : "") + " (" + e.at + ")" : "없음");
  const perms = d.perms ? Object.keys(d.perms).map((k) => k + ":" + d.perms[k]).join(", ") : "알 수 없음";
  return row("모드", S.mode) + (c ? row("저장소", yn(c.db)) + row("사용자", yn(c.user) + (S.uid ? " · id 있음" : " · id 없음") + (S.isOwner ? " · 소유자" : "")) + row("Claude", yn(c.sample) + (S.aiOff ? " · 꺼짐(" + S.aiOff + ")" : "")) : row("런타임", "없음")) +
    row("권한", perms) + row("저장 성공", d.writes + "회" + (d.lastWrite ? " (마지막 " + d.lastWrite + ")" : "") + (S.saveState === "saving" ? " · 저장 중" : "")) + (S.aiLite ? row("AI 방식", "가벼운 방식(quick)") : "") + row("마지막 저장 오류", err(d.save)) + row("마지막 AI 오류", err(d.ai)) + (d.boot ? row("불러오기 오류", err(d.boot)) : "") + (d.js ? row("앱 오류", err(d.js)) : "");
}
function renderDiag() { const h = diagHTML(); $$(".diag-body").forEach((el) => { el.innerHTML = h; }); }
function render() {
  const v = S.ui.view;
  $$(".nav a[data-go]").forEach((a) => a.classList.toggle("on", a.dataset.go === v));
  $$(".tabbar a").forEach((a) => a.classList.toggle("on", a.dataset.tab === v));
  const P = S.P;
  const set = (id, t) => { const el = $("#" + id); if (el) el.textContent = t; };
  set("rOwner", P.basics.name || "이름 없음"); set("rRev", revStr() + " · " + fmtDot(P.updatedAt)); set("mRev", revStr());
  const page = $("#page");
  const y = window.scrollY;
  page.innerHTML = ROUTES[v]();
  if (lastView !== v) { window.scrollTo(0, 0); lastView = v; } else window.scrollTo(0, y);
  if (AFTER[v]) AFTER[v]();
  renderDiag();
}
function goView(v) {
  if (!ROUTES[v]) v = "home";
  if (v !== "map" && mapSim) { mapSim.stop(); mapSim = null; }
  S.ui.view = v;
  try { history.replaceState(null, "", "#" + v); } catch (e) { /* sandboxed */ }
  render();
}
window.addEventListener("hashchange", () => { const h = location.hash.replace("#", ""); if (ROUTES[h] && h !== S.ui.view) { S.ui.view = h; render(); } });

function setPath(path, v) {
  const parts = path.split("."); let o = S;
  for (let i = 0; i < parts.length - 1; i++) { const k = parts[i]; if (o[k] == null) o[k] = /^\d+$/.test(parts[i + 1]) ? [] : {}; o = o[k]; }
  o[parts[parts.length - 1]] = v;
}
function normYM(v) {
  v = String(v || "").trim(); if (!v) return { ok: true, v: null };
  const m = v.replace(/[./]/g, "-").match(/^(\d{4})(?:-(\d{1,2}))?$/);
  if (!m) return { ok: false };
  const mm = m[2] ? clamp(+m[2], 1, 12) : null;
  return { ok: true, v: m[1] + (mm ? "-" + pad2(mm) : "") };
}

/* ---------------- events ---------------- */
document.addEventListener("click", (e) => {
  const go = e.target.closest("[data-go]");
  if (go) { e.preventDefault(); goView(go.dataset.go); return; }
  const a = e.target.closest("[data-act]"); if (!a) return;
  const fn = ACT[a.dataset.act]; if (!fn) return;
  if (a.tagName === "A" || a.tagName === "BUTTON") e.preventDefault();
  fn(a, e);
});
document.addEventListener("input", (e) => {
  const el = e.target;
  if (el.id === "logQ") { S.ui.logQ = el.value; applyLogSearch(); return; }
  if (el.id === "ledQ") { S.ui.ledQ = el.value; applyLedSearch(); return; }
  if (el.id === "logText") { S.ui.logDraft = el.value; return; }
  if (el.id === "ivInput") { S.ui.ivDraft = el.value; return; }
  if (!el.dataset || !el.dataset.bind) return;
  let v = el.value;
  if (el.dataset.type === "num") v = v.trim() === "" ? null : parseInt(v.replace(/\D/g, ""), 10) || null;
  if (el.dataset.ym) return; /* committed on change */
  setPath(el.dataset.bind, v);
  if (el.dataset.mark) { const [k, i] = el.dataset.mark.split(":"); if (k === "rv" && S.P.wants.items[+i]) S.P.wants.items[+i].rv = true; }
  touchEntry(el.dataset.bind);
  markDirty();
});
function touchEntry(bind) { const m = /^P\.ledger\.(\d+)\./.exec(bind || ""); if (m && S.P.ledger[+m[1]]) { const e = S.P.ledger[+m[1]]; e.up = nowISO(); delete e.mig; } }
document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.id === "xlsxFile" && el.files && el.files[0]) { ACT.importFile(el.files[0]); el.value = ""; return; }
  if (!el.dataset || !el.dataset.bind) return;
  if (el.dataset.ym) {
    const r = normYM(el.value);
    if (!r.ok) { toast("연도는 2017 또는 2017-05처럼 적어 주세요."); return; }
    setPath(el.dataset.bind, r.v);
    const m = el.dataset.bind.match(/^P\.timeline\.events\.(\d+)\./);
    if (m && r.v && S.P.timeline.events[+m[1]]) S.P.timeline.events[+m[1]].est = false;
    touchEntry(el.dataset.bind);
    markDirty();
  } else if (el.tagName === "SELECT") { setPath(el.dataset.bind, el.value); touchEntry(el.dataset.bind); markDirty(); }
  if (el.dataset.rerender) render();
});
document.addEventListener("keydown", (e) => {
  const el = e.target; if (!el || e.isComposing || e.keyCode === 229) return;
  if (el.id === "ivInput" && e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ACT.ivSend(); return; }
  if (el.id === "logText" && e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); ACT.logAdd(); return; }
  if (e.key === "Enter") {
    const map = { newLoveName: "loveAdd", newLoveWhy: "loveAdd", newSub: "loveSubAdd", newNode: "treeAdd", newWant: "wantAdd", evLabel: "evAdd", newAct: "actAdd" };
    if (map[el.id]) { e.preventDefault(); ACT[map[el.id]](); }
  }
});

function firstOpenStep(id) {
  const steps = STEPS[id]();
  if (S.P.done[id]) return steps.length;
  const k = steps.findIndex((s) => !s.ok());
  return k === -1 ? 0 : k;
}
async function runInsight(id) {
  if (!aiAvailable() || S.ui.busy["ins_" + id]) return;
  S.ui.busy["ins_" + id] = true; render();
  try { await aiChapterInsight(id); } catch (e) { toast(aiErrMsg(e), 4200); }
  S.ui.busy["ins_" + id] = false; render();
}
const needDirty = () => markDirty();

const ACT = {
  go: (a) => goView(a.dataset.view === "ch" ? "journey" : a.dataset.view),
  openCh: (a) => { const id = a.dataset.id || (CH.find((c) => !S.P.done[c.id]) || CH[0]).id; S.ui.ch = id; S.ui.step = firstOpenStep(id); S.ui.lovesCat = null; S.ui.wantType = null; lastView = null; goView("journey"); },
  stepPrev: () => { S.ui.step = Math.max(0, S.ui.step - 1); render(); scrollCh(); },
  stepNext: () => { const n = STEPS[curCh().id]().length; S.ui.step = Math.min(n, S.ui.step + 1); render(); scrollCh(); },
  chDone: () => {
    const id = curCh().id, P = S.P; P.done[id] = true; P.chapterAt[id] = nowISO();
    if (id === "wheel") { const snap = {}; WHEEL.forEach((w) => { const a = P.wheel.areas[w.id]; if (a) snap[w.id] = { sat: a.sat, imp: a.imp }; }); P.wheelHist.push({ at: nowISO(), v: snap }); }
    if (id === "basics") P.basics.confirmed = true;
    bumpRev(CH_BY[id].code + " " + CH_BY[id].name + " 완료");
    needDirty(); toast(CH_BY[id].name + " 완료 · " + revStr());
    if (id !== "basics" && aiAvailable() && !S.AI.insights[id]) runInsight(id); else render();
  },
  basicsConfirm: () => { S.P.basics.confirmed = true; S.P.basics.birthEst = false; needDirty(); render(); toast("기본 정보를 확인했어요."); },
  wheelSat: (a) => { const P = S.P; P.wheel.areas[a.dataset.a] = Object.assign(P.wheel.areas[a.dataset.a] || {}, { sat: +a.dataset.v }); needDirty(); render(); },
  wheelImp: (a) => { const P = S.P; P.wheel.areas[a.dataset.a] = Object.assign(P.wheel.areas[a.dataset.a] || {}, { imp: +a.dataset.v }); needDirty(); render(); },
  ipip: (a) => { S.P.ipip.answers[a.dataset.n] = +a.dataset.v; needDirty(); render(); },
  dilemma: (a) => {
    const i = +a.dataset.i; S.P.values.picks[i] = a.dataset.v; needDirty(); render();
    setTimeout(() => { if (S.ui.view === "journey" && curCh().id === "values" && S.ui.step === i) { S.ui.step = Math.min(DILEMMAS.length, i + 1); render(); } }, 280);
  },
  act: (a) => { S.P.energy.acts[a.dataset.a] = a.dataset.v; needDirty(); render(); },
  chrono: (a) => { S.P.energy.chrono[a.dataset.q] = +a.dataset.v; needDirty(); render(); },
  disc: (a) => { S.P.energy.disc[a.dataset.i] = a.dataset.v; needDirty(); render(); },
  loveCat: (a) => { const id = a.dataset.id || null; S.ui.lovesCat = id; if (id && !S.P.loves.seen[id]) { S.P.loves.seen[id] = true; needDirty(); } render(); scrollCh(); },
  loveSub: (a) => { const x = S.P.loves.cats[S.ui.lovesCat]; const v = a.dataset.v; const i = x.subs.indexOf(v); if (i > -1) x.subs.splice(i, 1); else x.subs.push(v); needDirty(); render(); },
  loveSubAdd: () => { const el = $("#newSub"); const v = el && el.value.trim(); if (!v) return; const x = S.P.loves.cats[S.ui.lovesCat]; if (!x.subs.includes(v)) x.subs.push(v); needDirty(); render(); },
  loveAdd: () => { const n = $("#newLoveName"), w = $("#newLoveWhy"); const name = n && n.value.trim(); if (!name) { n && n.focus(); return; } S.P.loves.cats[S.ui.lovesCat].items.push({ id: uid("l"), name, why: (w && w.value.trim()) || "", src: "" }); needDirty(); render(); const nn = $("#newLoveName"); if (nn) nn.focus(); },
  loveDel: (a) => { S.P.loves.cats[S.ui.lovesCat].items.splice(+a.dataset.i, 1); needDirty(); render(); },
  treeView: (a) => { S.ui.treeView = a.dataset.v; S.ui.mindScroll = null; render(); },
  treeSel: (a) => { const m = $(".tree-mind"); if (m) S.ui.mindScroll = [m.scrollLeft, m.scrollTop]; S.ui.treeSel = a.dataset.id || null; S.ui.confirmDel = null; render(); },
  treeAdd: () => { const el = $("#newNode"); const v = el && el.value.trim(); if (!v) { el && el.focus(); return; } const n = treeAdd(S.ui.treeSel, v); if (!S.ui.treeSel) S.ui.treeSel = n.id; needDirty(); render(); const ne = $("#newNode"); if (ne) ne.focus(); },
  treeStd: () => { S.P.meta.treeStd = 0; ensureTreeAreas(S.P); needDirty(); render(); },
  treeUp: () => treeMove(-1),
  treeDown: () => treeMove(1),
  treeIn: () => { const n = treeNode(S.ui.treeSel); if (!n) return; const sibs = treeChildren(S.P, n.parent); const k = sibs.indexOf(n); if (k < 1) { toast("바로 위에 같은 층 주제가 있어야 들여쓸 수 있어요."); return; } const np = sibs[k - 1]; n.parent = np.id; n.order = treeChildren(S.P, np.id).length; treeNorm(sibs[0].parent); needDirty(); render(); },
  treeOut: () => { const n = treeNode(S.ui.treeSel); if (!n || !n.parent) return; const par = treeNode(n.parent); const old = n.parent; n.parent = par ? par.parent : null; n.order = (par ? par.order : 0) + 0.5; treeNorm(old); treeNorm(n.parent); needDirty(); render(); },
  treeDel: () => { const n = treeNode(S.ui.treeSel); if (!n) return; const gone = new Set([n.id].concat(treeDesc(n.id).map((x) => x.id))); S.P.tree.nodes = S.P.tree.nodes.filter((x) => !gone.has(x.id)); treeNorm(n.parent); S.ui.treeSel = n.parent || null; S.ui.confirmDel = null; needDirty(); render(); toast("'" + cut(n.label, 20) + "'" + (gone.size > 1 ? " 외 " + (gone.size - 1) + "개" : "") + "를 지웠어요."); },
  thStatus: (a) => { const n = treeNode(S.ui.treeSel); if (!n) return; n.status = n.status === a.dataset.v ? null : a.dataset.v; needDirty(); render(); },
  thWeight: (a) => { const n = treeNode(S.ui.treeSel); if (!n) return; n.weight = n.weight === +a.dataset.v ? null : +a.dataset.v; needDirty(); render(); },
  actAdd: () => { const el = $("#newAct"); const v = el && el.value.trim(); if (!v) return; S.P.energy.custom.push({ id: uid("a"), t: v }); needDirty(); render(); const ne = $("#newAct"); if (ne) ne.focus(); },
  actDel: (a) => { const id = a.dataset.id; S.P.energy.custom = S.P.energy.custom.filter((x) => x.id !== id); delete S.P.energy.acts[id]; needDirty(); render(); },
  /* ledger */
  ledCat: (a) => { S.ui.ledCat = a.dataset.id || null; S.ui.ledEdit = null; render(); },
  ledOpen: (a) => { S.ui.ledCat = a.dataset.id || null; S.ui.ledEdit = null; goView("ledger"); },
  entryEdit: (a) => { S.ui.ledEdit = a.dataset.id || null; S.ui.confirmDel = null; render(); },
  entrySet: (a) => { const e = S.P.ledger[+a.dataset.i]; if (!e) return; e[a.dataset.k] = a.dataset.v; e.up = nowISO(); needDirty(); render(); },
  entryOk: (a) => { const e = S.P.ledger.find((x) => x.id === a.dataset.id); if (!e) return; e.up = nowISO(); needDirty(); render(); toast("확인했어요."); },
  entryAdd: (a) => {
    const v = $("#newEntValue"), val = v && v.value.trim(); if (!val) { v && v.focus(); toast("내용을 적어 주세요."); return; }
    const d = normYM($("#newEntDate").value); if (!d.ok) { toast("날짜는 2024 또는 2024-05처럼 적어 주세요."); return; }
    addEntry({ cat: a.dataset.cat, sub: $("#newEntSub").value.trim(), label: $("#newEntLabel").value.trim(), value: val, date: d.v, conf: $("#newEntEst").checked ? "est" : "sure" });
    needDirty(); render(); toast("Records에 적었어요."); const f = $("#newEntLabel"); if (f) f.focus();
  },
  entryDel: (a) => {
    const id = a.dataset.id; const P = S.P; const f = P.ledger.find((x) => x.id === id);
    P.ledger = P.ledger.filter((x) => x.id !== id);
    S.CHAT.turns.forEach((t) => { if (t.facts) t.facts = t.facts.filter((x) => x !== id); });
    S.LOG.items.forEach((r) => { if (r.extracted) r.extracted = r.extracted.filter((x) => x !== id); });
    S.ui.confirmDel = null; S.ui.ledEdit = null; markDirty(); render(); if (f) toast("지웠어요: " + cut(entryText(f), 30));
  },
  reviewDone: () => { if (S.P.meta.migration) S.P.meta.migration.reviewed = true; if (S.P.meta.treeMove) S.P.meta.treeMove.reviewed = true; S.P.ledger.forEach((e) => delete e.mig); needDirty(); goView("home"); toast("확인을 마쳤어요."); },
  /* weekly questions (written by the scheduled check-in) */
  nudgeAnswer: (a) => {
    const i = +a.dataset.i, q = S.NUDGE.questions[i], el = $("#nq_" + i), v = el && el.value.trim(); if (!q || !v) { el && el.focus(); return; }
    const e = addEntry({ cat: CAT_BY[q.cat] ? q.cat : "etc", label: q.label || "", value: v, src: "nudge" });
    if (q.entry) { const old = S.P.ledger.find((x) => x.id === q.entry); if (old) old.up = nowISO(); }
    q.done = true; q.answer = e.id; q.at = nowISO(); needDirty(); render(); toast("Records에 적었어요.");
  },
  nudgeSkip: (a) => { const q = S.NUDGE.questions[+a.dataset.i]; if (!q) return; q.skip = true; needDirty(); render(); },
  /* export */
  packSel: (a) => { S.ui.pack = a.dataset.id; render(); },
  packCopy: async () => {
    const ta = $("#packText"), text = ta ? ta.value : "";
    try { await navigator.clipboard.writeText(text); noteExport("copy", S.ui.pack); toast("복사했어요. AI 대화에 붙여 넣으세요."); }
    catch (e) { if (ta) { ta.focus(); ta.select(); } toast("자동 복사가 막혀 있어요. 선택된 글을 직접 복사해 주세요.", 4200); }
  },
  packSave: () => { const p = PACK_BY[S.ui.pack] || PACKS[0]; saveFile("atlas-" + p.id + "-" + stamp() + ".md", packText(S.P, p), "md", p.id); },
  jsonSave: () => saveFile("atlas-" + stamp() + ".json", JSON.stringify({ schema: "atlas.profile/4", exportedAt: nowISO(), profile: S.P, log: S.LOG, ai: { portrait: S.AI.portrait, map: S.AI.map } }, null, 2), "json"),
  xlsxSave: async () => {
    S.ui.busy.xlsx = true; render();
    try { const buf = await buildWorkbook(S.P); await saveFile("atlas-" + stamp() + ".xlsx", new Blob([buf]), "xlsx"); }
    catch (e) { toast(e && e.message ? e.message : "엑셀을 만들지 못했어요.", 4200); }
    S.ui.busy.xlsx = false; render();
  },
  importFile: async (file) => {
    S.ui.busy.xlsx = true; S.ui.importPlan = null; render();
    try { S.ui.importPlan = await planImport(file); } catch (e) { noteErr("import", e); toast("엑셀을 읽지 못했어요 (" + ((e && (e.code || e.message)) || "오류") + ").", 4500); }
    S.ui.busy.xlsx = false; render();
  },
  importApply: () => { const n = applyImport(S.ui.importPlan); S.ui.importPlan = null; noteExport("import"); render(); toast(n + "건을 적용했어요."); },
  importCancel: () => { S.ui.importPlan = null; render(); },
  wantType: (a) => { S.ui.wantType = a.dataset.id || null; render(); scrollCh(); },
  wantSet: (a) => { const w = S.P.wants.items[+a.dataset.i]; if (!w) return; const k = a.dataset.k; w[k] = k === "prio" ? +a.dataset.v : a.dataset.v; w.rv = true; needDirty(); render(); },
  wantDel: (a) => { S.P.wants.items.splice(+a.dataset.i, 1); needDirty(); render(); },
  wantAdd: () => { const el = $("#newWant"), hz = $("#newWantHz"); const v = el && el.value.trim(); if (!v) return; S.P.wants.items.push({ id: uid("w"), type: S.ui.wantType, text: v, horizon: (hz && hz.value) || "3y", prio: 2, status: "idea", why: "", src: "", rv: true }); needDirty(); render(); const ne = $("#newWant"); if (ne) ne.focus(); },
  wantConfirmAll: () => { S.P.wants.items.forEach((w) => { if (w.type === S.ui.wantType) w.rv = true; }); needDirty(); render(); toast("이 목록을 모두 확인했어요."); },
  evOk: (a) => { const e = S.P.timeline.events[+a.dataset.i]; if (e) { e.est = false; needDirty(); render(); } },
  evDel: (a) => { const i = +a.dataset.i; const e = S.P.timeline.events[i]; if (!e) return; S.P.timeline.events.splice(i, 1); if (S.ui.editEvent === e.id) S.ui.editEvent = null; needDirty(); render(); toast("'" + e.label + "' 이정표를 지웠어요."); },
  evAdd: () => { const lb = $("#evLabel"); const label = lb && lb.value.trim(); if (!label) return; const s = normYM($("#evS").value), en = normYM($("#evE").value); if (!s.ok || !en.ok) { toast("연도는 2017 또는 2017-05처럼 적어 주세요."); return; } S.P.timeline.events.push({ id: uid("e"), lane: $("#evLane").value, label, s: s.v, e: en.v, kind: en.v ? "phase" : "milestone", est: false, src: "", note: "" }); needDirty(); render(); },
  evNew: () => { const e = { id: uid("e"), lane: "me", label: "새 이정표", s: curYM(), e: null, kind: "milestone", est: false, src: "", note: "" }; S.P.timeline.events.push(e); S.ui.editEvent = e.id; needDirty(); render(); },
  evEdit: (a) => { S.ui.editEvent = a.dataset.id; if (S.ui.view !== "gantt") goView("gantt"); else { render(); window.scrollTo({ top: 0, behavior: "smooth" }); } },
  evEditClose: () => { S.ui.editEvent = null; render(); },
  insight: (a) => runInsight(a.dataset.id),
  ivStart: () => { S.CHAT.turns = []; ivRun(true); },
  ivSend: () => {
    const el = $("#ivInput"); const text = el && el.value.trim();
    if (!text || S.ui.busy.iv) return;
    S.CHAT.turns.push({ role: "user", content: text, at: nowISO() }); S.ui.ivDraft = ""; markDirty(); ivRun(false);
  },
  ivRetry: () => { const t = S.CHAT.turns; if (t.length && t[t.length - 1].role === "user") ivRun(false); else ivRun(!t.length); },
  ivTopic: (a) => { S.CHAT.topic = a.dataset.v; markDirty(); render(); toast("다음 질문부터 '" + (TOPICS.find((t) => t[0] === a.dataset.v) || [0, ""])[1] + "'에 초점을 맞춰요."); },
  ivNewTopic: () => { if (S.ui.busy.iv) return; S.CHAT.turns.push({ role: "user", content: "(이 질문은 넘어가고, 현재 초점에 맞는 다른 질문을 해 주세요)", at: nowISO(), meta: true }); markDirty(); ivRun(false); },
  ivClear: () => {
    if (!S.ui.confirmIvClear) { S.ui.confirmIvClear = true; toast("한 번 더 누르면 대화가 비워져요. 알게 된 사실은 남아요."); setTimeout(() => (S.ui.confirmIvClear = false), 3500); return; }
    S.ui.confirmIvClear = false; S.CHAT.turns = []; S.ui.ivErr = null; markDirty(); render();
  },
  factDel: (a) => ACT.entryDel(a),
  logType: (a) => { const t = $("#logText"); if (t) S.ui.logDraft = t.value; S.ui.newType = a.dataset.v; render(); const t2 = $("#logText"); if (t2) { t2.value = S.ui.logDraft || ""; t2.focus(); } },
  logAdd: () => {
    const t = $("#logText"); const text = t && t.value.trim(); if (!text) { t && t.focus(); return; }
    const d = ($("#logDate") && $("#logDate").value) || localDate();
    S.LOG.items.push({ id: uid("r"), type: S.ui.newType || "thought", date: d, text, src: "", at: nowISO() });
    S.ui.logDraft = ""; markDirty(); render(); toast("기록했어요.");
  },
  logFilter: (a) => { S.ui.logFilter = a.dataset.v; render(); },
  recExtract: async (a) => {
    const r = S.LOG.items.find((x) => x.id === a.dataset.id); if (!r || S.ui.busy["rec_" + r.id]) return;
    S.ui.busy["rec_" + r.id] = true; render();
    try {
      const fs = await aiExtractFromRecord(r);
      r.extracted = []; fs.forEach((f) => r.extracted.push(addEntry({ cat: f.cat, label: f.label, value: f.text, src: "record", rec: r.id }).id));
      r.extractedNone = !fs.length; markDirty();
      toast(fs.length ? "사실 " + fs.length + "개를 Records에 더했어요." : "새로 뽑을 사실이 없었어요.");
    } catch (e) { toast(aiErrMsg(e), 4200); }
    S.ui.busy["rec_" + r.id] = false; render();
  },
  recDelAsk: (a) => { S.ui.confirmDel = a.dataset.id; render(); },
  recDelCancel: () => { S.ui.confirmDel = null; render(); },
  recDel: (a) => { S.LOG.items = S.LOG.items.filter((x) => x.id !== a.dataset.id); S.ui.confirmDel = null; markDirty(); render(); toast("기록을 지웠어요."); },
  drawPortrait: async () => {
    if (S.ui.busy.portrait) return; S.ui.busy.portrait = true; render();
    try { await aiPortrait(); toast("초상을 그렸어요 · " + revStr()); } catch (e) { toast(aiErrMsg(e), 4500); }
    S.ui.busy.portrait = false; render();
  },
  drawMap: async () => {
    if (S.ui.busy.map) return; S.ui.busy.map = true; render();
    try { const m = await aiMap(buildGraph(S.P).nodes); toast("주제 " + m.themes.length + "개, 숨은 연결 " + m.links.length + "개를 찾았어요."); } catch (e) { toast(aiErrMsg(e), 4500); }
    S.ui.busy.map = false; render();
  },
  mapToggle: (a) => { S.ui.mapHide[a.dataset.v] = !S.ui.mapHide[a.dataset.v]; render(); },
  mapSel: (a) => { S.ui.mapSel = a.dataset.id; render(); const w = $("#mapWrap"); if (w) w.scrollIntoView({ behavior: "smooth", block: "center" }); },
  mapClose: () => { S.ui.mapSel = null; render(); },
  ganttRange: (a) => { S.ui.ganttRange = a.dataset.v; render(); },
  ganttWants: () => { S.ui.ganttAllWants = !S.ui.ganttAllWants; render(); },
  dismissSeed: () => { S.P.dismissSeedNote = true; needDirty(); render(); },
};
function treeMove(dir) {
  const n = treeNode(S.ui.treeSel); if (!n) return;
  const sibs = treeChildren(S.P, n.parent), k = sibs.indexOf(n), o = sibs[k + dir]; if (!o) return;
  const t = n.order; n.order = o.order; o.order = t; treeNorm(n.parent); needDirty(); render();
}
function scrollCh() { const el = $("#chSheet"); if (el) { const top = el.getBoundingClientRect().top + window.scrollY - 70; if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" }); } }

/* ---------------- start ---------------- */
(async function main() {
  $("#app").innerHTML = '<div class="boot">' + I.logo.replace("<svg", '<svg width="40" height="40"') + "<span>ATLAS · 불러오는 중</span></div>";
  const h = (location.hash || "").replace("#", ""); if (ROUTES[h]) S.ui.view = h;
  try { await boot(); } catch (e) { S.mode = "local"; S.P = ensureShape(blankProfile()); }
  buildShell(); render();
})();
