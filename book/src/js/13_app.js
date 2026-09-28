/* ============================================================ shell, router, events, actions */
const ROUTES = { home: viewHome, map: viewIssues, iv: viewInterview, draft: viewDraft, rec: viewRecords };
const AFTER = { iv: afterInterview, draft: afterDraft };
const NAV = [["home", I.home, "개요"], ["map", I.tree, "이슈 지도"], ["iv", I.chat, "인터뷰"], ["draft", I.edit, "원고"], ["rec", I.ledger, "나의 기록"]];

function buildShell() {
  const nav = (v, icon, label) => `<a href="#${v}" data-go="${v}">${icon}<span>${label}</span></a>`;
  $("#app").innerHTML =
    `<div class="app"><aside class="rail"><div class="brand"><div class="brand-mark">${I.logo}<div class="brand-name">책 쓰기</div></div></div>` +
    `<nav class="nav" aria-label="주 메뉴">${NAV.map((n) => nav(...n)).join("")}</nav>` +
    `<div class="rail-foot"><div class="save-state"><i></i><span>저장됨</span></div><div>모든 변경은 자동으로 저장돼요.</div><details class="diag"><summary>연결 상태</summary><div class="diag-body"></div></details></div></aside>` +
    `<div class="main"><header class="topbar-m"><div class="brand-mark">${I.logo}<span class="brand-name">책 쓰기</span></div><span class="save-state"><i></i><span>저장됨</span></span></header><main class="page" id="page"></main></div>` +
    `<nav class="tabbar" aria-label="하단 메뉴">${NAV.map(([v, ic, l]) => `<a href="#${v}" data-go="${v}" data-tab="${v}">${ic}${l}</a>`).join("")}</nav></div>`;
  setSave(S.mode === "cloud" ? "idle" : S.mode === "local" ? "local" : "off");
}
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
let lastView = null;
function render() {
  const v = S.ui.view;
  $$(".nav a[data-go]").forEach((a) => a.classList.toggle("on", a.dataset.go === v));
  $$(".tabbar a").forEach((a) => a.classList.toggle("on", a.dataset.tab === v));
  const page = $("#page"), y = window.scrollY;
  page.innerHTML = ROUTES[v]();
  if (lastView !== v) { window.scrollTo(0, 0); lastView = v; } else window.scrollTo(0, y);
  if (AFTER[v]) AFTER[v]();
  renderDiag();
}
/* #iv/<issue id> and #draft/<issue id> keep the open issue across reloads */
function hashOf() { return S.ui.view + ((S.ui.view === "iv" || S.ui.view === "draft") && S.ui.issue ? "/" + S.ui.issue : ""); }
function goView(v, issue) {
  if (!ROUTES[v]) v = "home";
  S.ui.view = v;
  if (issue !== undefined) S.ui.issue = issue;
  try { history.replaceState(null, "", "#" + hashOf()); } catch (e) { /* sandboxed */ }
  render();
}
function readHash() {
  const [v, id] = location.hash.replace("#", "").split("/");
  if (!ROUTES[v]) return false;
  S.ui.view = v; if (id) S.ui.issue = id;
  return true;
}
window.addEventListener("hashchange", () => { if (location.hash.replace("#", "") !== hashOf() && readHash()) render(); });

function setPath(path, v) {
  const parts = path.split("."); let o = S;
  for (let i = 0; i < parts.length - 1; i++) { const k = parts[i]; if (o[k] == null) o[k] = /^\d+$/.test(parts[i + 1]) ? [] : {}; o = o[k]; }
  o[parts[parts.length - 1]] = v;
}
async function saveFile(name, data) {
  try { await Backend.download(name, data); toast("저장했어요: " + name); }
  catch (e) {
    if (e && e.code === "declined") return;
    toast(e && e.code === "unavailable" ? "이 화면에서는 파일 저장을 쓸 수 없어요." : "파일을 저장하지 못했어요 (" + ((e && e.code) || "오류") + ").", 4200);
  }
}
const stamp = () => localDate().replace(/-/g, "");

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
  if (el.id === "ivInput") { S.ui.ivDraft = el.value; return; }
  if (el.id === "draftAsk") { S.ui.draftAsk = el.value; return; }
  if (!el.dataset || !el.dataset.bind) return;
  setPath(el.dataset.bind, el.value);
  if (el.dataset.grow) grow(el);
  markDirty();
});
document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.id === "atlasFile" && el.files && el.files[0]) { ACT.atlasImport(el.files[0]); el.value = ""; }
});
document.addEventListener("keydown", (e) => {
  const el = e.target; if (!el || e.isComposing || e.keyCode === 229) return;
  if (el.id === "ivInput" && e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ACT.ivSend(); return; }
  if (el.id === "newQ" && e.key === "Enter") { e.preventDefault(); ACT.issueAdd(); }
});

const curIssue = () => issueById(S.ui.issue);
const ACT = {
  go: (a) => goView(a.dataset.view, a.dataset.clear ? null : undefined),
  area: (a) => { S.ui.area = a.dataset.v; render(); },

  /* ---- issue map ---- */
  issueAdd: () => {
    const q = ($("#newQ") || {}).value || "", area = ($("#newArea") || {}).value || "meaning";
    if (!q.trim()) { toast("질문을 적어 주세요."); return; }
    addIssue(area, q); markDirty(); render(); toast("질문을 더했어요.");
  },
  issueDel: (a) => {
    const it = issueById(a.dataset.id); if (!it) return;
    const pc = S.PC[it.id], talked = pc && (pc.iv.turns.length || pc.draft);
    if (talked && !confirm("이 이슈의 인터뷰와 원고도 함께 지워져요. 지울까요?")) return;
    S.ISS.items = S.ISS.items.filter((x) => x !== it);
    S.B.meta.rejected = (S.B.meta.rejected || []).concat([{ q: it.q, area: it.area }]).slice(-80);
    dropPiece(it.id);
    if (S.ui.issue === it.id) S.ui.issue = null;
    markDirty(); render();
  },
  issueRestore: (a) => {
    const r = S.B.meta.rejected.splice(+a.dataset.i, 1)[0]; if (!r) return;
    addIssue(r.area || "meaning", r.q || r); markDirty(); render();
  },
  issueSuggest: async () => {
    if (S.ui.busy.sug) return;
    const area = S.ui.area !== "all" ? S.ui.area : null;
    S.ui.busy.sug = true; S.ui.err.sug = null; render();
    try {
      const xs = await aiSuggestIssues(area);
      const have = new Set(S.ISS.items.map((x) => x.q).concat((S.B.meta.rejected || []).map((r) => r.q || r)));
      let n = 0;
      xs.forEach((x) => { const q = String(x.q).trim(); if (have.has(q)) return; have.add(q); addIssue(area || x.area, q, { ai: true, why: String(x.why || "") }); n++; });
      S.B.meta.suggestedAt = nowISO();
      markDirty(); toast(n ? "질문 " + n + "개를 더했어요." : "새로 더할 질문이 없었어요.");
    } catch (e) { S.ui.err.sug = aiErrMsg(e); }
    S.ui.busy.sug = false; render();
  },
  openIv: (a) => { S.ui.ivDraft = ""; goView("iv", a.dataset.id); },
  openDraft: (a) => goView("draft", a.dataset.id),

  /* ---- interview ---- */
  ivStart: () => ivRun(true),
  ivSend: () => {
    const inp = $("#ivInput"), it = curIssue();
    if (!inp || inp.disabled || !it) return;
    const text = inp.value.trim(); if (!text) return;
    const iv = ensurePiece(it.id).iv;
    iv.turns.push({ role: "user", content: text, at: nowISO() });
    iv.pend = false; S.ui.ivDraft = ""; markDirty();
    ivRun(false);
  },
  ivRetry: () => { const it = curIssue(); if (!it) return; const t = ensurePiece(it.id).iv.turns; ivRun(!t.length); },
  ivStay: () => { const it = curIssue(); if (!it) return; const iv = ensurePiece(it.id).iv; iv.pend = false; if (iv.n >= IV_CAP) iv.n = IV_CAP - 4; markDirty(); render(); },
  ivClear: () => {
    const it = curIssue(); if (!it || !confirm("이 이슈의 대화를 비울까요? 채운 칸과 인용은 남아요.")) return;
    const iv = ensurePiece(it.id).iv; iv.turns = []; iv.n = 0; iv.pend = false; markDirty(); render();
  },
  quoteDel: (a) => { const it = curIssue(); if (!it) return; S.PC[it.id].iv.quotes.splice(+a.dataset.i, 1); markDirty(); render(); },
  sceneAttach: (a) => { const it = curIssue(); if (!it) return; const iv = S.PC[it.id].iv; if (!iv.scenes.includes(a.dataset.id)) iv.scenes.push(a.dataset.id); markDirty(); render(); },
  sceneNo: (a) => { const it = curIssue(); if (!it) return; const t = S.PC[it.id].iv.turns[+a.dataset.t]; if (t) (t.no = t.no || []).push(a.dataset.id); markDirty(); render(); },
  sceneDetach: (a) => { const it = curIssue(); if (!it) return; const iv = S.PC[it.id].iv; iv.scenes = iv.scenes.filter((x) => x !== a.dataset.id); markDirty(); render(); },

  /* ---- draft ---- */
  draftWrite: (a) => {
    if (S.ui.busy.draft) return;
    const ask = a.dataset.ask ? String(S.ui.draftAsk || "").trim() : "";
    if (a.dataset.ask && !ask) { toast("어떻게 고칠지 적어 주세요."); return; }
    draftRun(ask);
  },
  draftSnap: () => {
    const it = curIssue(); if (!it) return; const d = S.PC[it.id].draft; if (!d) return;
    d.hist = (d.hist || []).concat([{ at: nowISO(), why: "직접 저장", title: d.title, sections: clone(d.cur) }]).slice(-12);
    markDirty(); render(); toast("지금 판을 저장했어요.");
  },
  draftRestore: (a) => {
    const it = curIssue(); if (!it) return; const d = S.PC[it.id].draft, h = d && d.hist[+a.dataset.i]; if (!h) return;
    if (!confirm("이 판으로 되돌릴까요? 지금 원고는 판 기록에 남겨요.")) return;
    d.hist.push({ at: nowISO(), why: "되돌리기 전", title: d.title, sections: clone(d.cur) });
    d.cur = clone(h.sections); if (h.title) d.title = h.title;
    d.hist = d.hist.slice(-12); markDirty(); render();
  },
  draftDone: () => { const it = curIssue(); if (!it) return; it.status = it.status === "done" ? "draft" : "done"; markDirty(); render(); },
  draftCopy: async () => {
    const it = curIssue(); if (!it) return; const md = pieceMD(it, S.PC[it.id]);
    try { await navigator.clipboard.writeText(md); toast("Markdown을 복사했어요."); } catch (e) { toast("복사하지 못했어요. .md 저장을 써 주세요."); }
  },
  draftSave: () => { const it = curIssue(); if (!it) return; saveFile("book-" + stamp() + "-" + it.id + ".md", pieceMD(it, S.PC[it.id])); },

  /* ---- my record ---- */
  scAdd: () => {
    const when = ($("#scWhen") || {}).value || "", title = ($("#scTitle") || {}).value || "", text = ($("#scText") || {}).value || "";
    if (!title.trim() && !text.trim()) { toast("제목이나 내용을 적어 주세요."); return; }
    S.SC.items.push({ id: uid("s"), when: when.trim(), title: title.trim() || cut(text, 30), text: text.trim(), src: "me", at: nowISO() });
    markDirty(); render(); toast("장면을 더했어요.");
  },
  scEdit: (a) => { S.ui.scEdit = a.dataset.id; render(); },
  scDone: () => { S.ui.scEdit = null; render(); },
  scDel: (a) => {
    if (!confirm("이 장면을 지울까요?")) return;
    S.SC.items = S.SC.items.filter((x) => x.id !== a.dataset.id);
    for (const id in S.PC) S.PC[id].iv.scenes = S.PC[id].iv.scenes.filter((x) => x !== a.dataset.id);
    S.ui.scEdit = null; markDirty(); render();
  },
  atlasImport: async (file) => {
    try {
      const j = JSON.parse(await file.text());
      const items = atlasItems(j);
      if (!items.length) { toast("가져올 기록이 없었어요."); return; }
      S.AT = { at: nowISO(), schema: String(j.schema || ""), items };
      markDirty(); render(); toast("Atlas 기록 " + items.length + "개를 가져왔어요.");
    } catch (e) { toast(e && e.message && !(e instanceof SyntaxError) ? e.message : "JSON 파일을 읽지 못했어요.", 4200); }
  },
  atlasDel: () => { if (!confirm("가져온 Atlas 기록을 지울까요? Atlas 원본은 그대로예요.")) return; S.AT = null; dropDoc("b_atlas"); markDirty(); render(); },
};

(async function start() {
  try { await boot(); } catch (e) { noteErr("boot", e); if (!S.B) { S.B = blankBook(); } }
  readHash();
  buildShell();
  render();
})();
