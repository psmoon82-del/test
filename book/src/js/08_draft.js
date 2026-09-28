/* ============================================================ DRAFT · 원고
   Claude writes the first draft; the author rewrites it. "My sentences" = sentences that are not
   in Claude's latest draft, plus sentences the author wrote before a rewrite that Claude kept.
   It should rise piece by piece if the author's voice is taking over. */
const splitSent = (t) => String(t || "").split(/(?<=[.!?。…])\s+|\n+/).map((s) => s.trim()).filter((s) => s.length >= 2);
function mineStats(pc) {
  const d = pc.draft; if (!d || !d.ai) return null;
  const aiSet = new Set(); SECTIONS.forEach((s) => splitSent(d.ai.sections[s.id]).forEach((x) => aiSet.add(x)));
  const own = new Set(d.mine || []);
  const quotes = (pc.iv.quotes || []).filter((q) => q.length >= 6);
  let n = 0, mine = 0, quoted = 0; const per = {};
  SECTIONS.forEach((s) => {
    const xs = splitSent(d.cur[s.id]); let m = 0;
    xs.forEach((x) => { if (!aiSet.has(x) || own.has(x)) m++; if (quotes.some((q) => x.includes(q))) quoted++; });
    per[s.id] = xs.length ? Math.round((m / xs.length) * 100) : null;
    n += xs.length; mine += m;
  });
  return { n, mine: n ? Math.round((mine / n) * 100) : 0, quoted: n ? Math.round((quoted / n) * 100) : 0, per };
}
function pieceMD(it, pc) {
  const d = pc.draft; if (!d) return "";
  const body = SECTIONS.filter((s) => (d.cur[s.id] || "").trim()).map((s) => "## " + s.name + "\n\n" + d.cur[s.id].trim()).join("\n\n");
  const th = (d.theory || []).map((t) => "- " + t.name + (t.who ? " (" + t.who + ")" : "") + (t.use ? ": " + t.use : "")).join("\n");
  return "# " + (d.title || it.q) + "\n\n> " + it.q + "\n\n" + body + (th ? "\n\n---\n참고한 이론 (확인 필요)\n" + th : "") + "\n";
}
function viewDraft() {
  const it = issueById(S.ui.issue);
  if (!it) return issuePicker("draft");
  const pc = ensurePiece(it.id), d = pc.draft, busy = S.ui.busy.draft, err = S.ui.err.draft;
  const head = `<div class="page-head"><div><div class="eyebrow">Draft · ${esc(AREA_BY[it.area].name)}</div><h1>원고</h1><p class="lede">${esc(it.q)}</p></div><div class="row"><button class="btn sm ghost" data-act="openIv" data-id="${it.id}">${I.chat}인터뷰로</button><a href="#" class="btn sm ghost" data-act="go" data-view="draft" data-clear="1">다른 이슈</a></div></div>`;
  if (!d) {
    const iv = pc.iv, ok = iv.slots.opinion && iv.slots.reason;
    return head + `<section class="sheet pad stack lift" style="max-width:720px">
      <h3>아직 초안이 없어요</h3>
      <p class="muted">인터뷰에서 채운 다섯 칸과 인용 ${iv.quotes.length}개${iv.scenes.length ? ", 근거 장면 " + iv.scenes.length + "개" : ""}로 Claude가 초안을 씁니다. 저자의 표현을 살리고, 말하지 않은 사실은 만들지 않습니다.</p>
      <ul class="list-plain">${SLOTS.map((s) => `<li><b style="min-width:44px">${esc(s.name)}</b><span class="${iv.slots[s.id] ? "" : "muted"}">${esc(iv.slots[s.id] || "(비어 있음)")}</span></li>`).join("")}</ul>
      ${err ? `<p class="banner">${esc(err)}</p>` : ""}
      <div class="row"><button class="btn accent" data-act="draftWrite" ${busy || !ok || !aiAvailable() ? "disabled" : ""}>${busy ? '<span class="spinner"></span>쓰는 중 (1분 안팎)' : I.edit + "초안 쓰기"}</button>${ok ? "" : '<span class="muted" style="font-size:12px">의견과 이유가 채워져야 쓸 수 있어요.</span>'}${aiAvailable() ? "" : `<span class="muted" style="font-size:12px">${esc(aiOffMsg())}</span>`}</div>
    </section>`;
  }
  const st = mineStats(pc);
  const secs = SECTIONS.map((s) => {
    const v = d.cur[s.id] || "", p = st && st.per[s.id];
    if (s.opt && !v.trim() && !(d.ai.sections[s.id] || "").trim()) return `<div class="sec empty-sec"><div class="h"><b>${esc(s.name)}</b><span class="muted">근거 장면이 없어 비워 뒀어요. 필요하면 직접 쓰세요.</span></div><textarea class="input prose" rows="2" data-bind="PC.${it.id}.draft.cur.${s.id}" data-grow="1" rows="1"></textarea></div>`;
    return `<div class="sec"><div class="h"><b>${esc(s.name)}</b>${p != null ? `<span class="mine mono" title="Claude 초안에 없는 문장의 비율">내 문장 ${p}%</span>` : ""}</div><textarea class="input prose" data-bind="PC.${it.id}.draft.cur.${s.id}" data-grow="1" rows="2">${esc(v)}</textarea></div>`;
  }).join("");
  const theory = (d.theory || []).map((t) => `<li><div><b>${esc(t.name)}</b>${t.who ? ` <span class="muted">${esc(t.who)}</span>` : ""}${t.use ? `<div class="muted" style="font-size:12px">${esc(t.use)}</div>` : ""}</div></li>`).join("");
  const side = `<aside class="stack">
  <section class="sheet side-card"><h4>내 문장</h4><div class="big num">${st ? st.mine : 0}<small>%</small></div><div class="meter"><i style="width:${st ? st.mine : 0}%"></i></div><p class="muted" style="font-size:11.5px;margin-top:6px">Claude 초안에 없는 문장의 비율. 인용이 든 문장 ${st ? st.quoted : 0}%. 고칠수록 올라가요.</p></section>
  <section class="sheet side-card"><h4>연결한 이론 <span class="tag est">확인 필요</span></h4>${theory ? `<ul class="list-plain">${theory}</ul>` : '<p class="muted" style="font-size:12px">없어요.</p>'}<p class="muted" style="font-size:11.5px;margin-top:6px">Claude가 붙인 이름과 연도는 틀릴 수 있어요. 책에 넣기 전에 직접 확인하세요.</p></section>
  <section class="sheet side-card stack"><h4>다시 쓰기</h4><textarea class="input sm" id="draftAsk" rows="3" placeholder="예: 연결 부분을 줄이고, 말투를 더 짧게">${esc(S.ui.draftAsk || "")}</textarea><button class="btn sm" data-act="draftWrite" data-ask="1" ${busy || !aiAvailable() ? "disabled" : ""}>${busy ? '<span class="spinner"></span>쓰는 중' : "요청대로 다시 쓰기"}</button>${err ? `<p class="banner">${esc(err)}</p>` : ""}<p class="muted" style="font-size:11.5px">지금 원고는 판 기록에 남기고 새로 씁니다.</p></section>
  <section class="sheet side-card stack"><h4>판 기록 <span class="mono muted" style="font-size:11px">${(d.hist || []).length}</span></h4>${(d.hist || []).length ? `<ul class="list-plain">${d.hist.slice().reverse().map((h, i) => `<li><span class="mono muted" style="font-size:11.5px">${fmtTime(h.at)}</span><span>${esc(h.why || "")}</span><button class="btn sm ghost" data-act="draftRestore" data-i="${d.hist.length - 1 - i}">되돌리기</button></li>`).join("")}</ul>` : '<p class="muted" style="font-size:12px">아직 없어요.</p>'}<button class="btn sm" data-act="draftSnap">지금 판 저장</button></section>
</aside>`;
  return head + `<div class="dr"><section class="sheet pad lift stack"><input class="input title-in" data-bind="PC.${it.id}.draft.title" value="${esc(d.title || "")}" aria-label="꼭지 제목">${secs}
  <div class="row"><button class="btn ${it.status === "done" ? "" : "primary"}" data-act="draftDone">${it.status === "done" ? "완성 표시 풀기" : "완성으로 표시"}</button><button class="btn" data-act="draftCopy">${I.copy}Markdown 복사</button><button class="btn" data-act="draftSave">${I.down}.md 저장</button></div></section>${side}</div>`;
}
function afterDraft() { $$("textarea[data-grow]").forEach(grow); }
function grow(el) { el.style.height = "auto"; el.style.height = el.scrollHeight + 2 + "px"; }
async function draftRun(ask) {
  const it = issueById(S.ui.issue); if (!it) return;
  const pc = ensurePiece(it.id);
  S.ui.busy.draft = true; S.ui.err.draft = null; render();
  try {
    const r = await aiDraft(it, pc, ask);
    let mine = [];
    if (pc.draft && pc.draft.ai) {
      /* remember what the author wrote, so a rewrite that keeps it still counts it as theirs */
      const prevAi = new Set(); SECTIONS.forEach((s) => splitSent(pc.draft.ai.sections[s.id]).forEach((x) => prevAi.add(x)));
      const own = new Set(pc.draft.mine || []);
      SECTIONS.forEach((s) => splitSent(pc.draft.cur[s.id]).forEach((x) => { if (!prevAi.has(x) || own.has(x)) own.add(x); }));
      mine = Array.from(own).slice(-400);
    }
    if (pc.draft) { pc.draft.hist = pc.draft.hist || []; pc.draft.hist.push({ at: nowISO(), why: ask ? "다시 쓰기 전: " + cut(ask, 30) : "새 초안 전", title: pc.draft.title, sections: clone(pc.draft.cur) }); if (pc.draft.hist.length > 12) pc.draft.hist = pc.draft.hist.slice(-12); }
    pc.draft = { title: r.title, ai: { at: nowISO(), sections: r.sections }, cur: clone(r.sections), theory: r.theory, hist: (pc.draft && pc.draft.hist) || [], mine, at: nowISO() };
    if (it.status !== "done") it.status = "draft";
    S.ui.draftAsk = "";
    markDirty();
  } catch (e) { S.ui.err.draft = aiErrMsg(e); }
  S.ui.busy.draft = false; render();
}
