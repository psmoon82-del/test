/* ============================================================ INTERVIEW · 인터뷰 (one issue at a time) */
function issuePicker(kind) {
  const xs = S.ISS.items.filter((x) => (kind === "iv" ? x.status !== "done" : x.status === "draft" || x.status === "done" || x.status === "ready"));
  const title = kind === "iv" ? "인터뷰할 이슈를 고르세요" : "원고를 열 이슈를 고르세요";
  return `<div class="page-head"><div><div class="eyebrow">${kind === "iv" ? "Interview" : "Draft"}</div><h1>${kind === "iv" ? "인터뷰" : "원고"}</h1><p class="lede">${title}. 이슈는 이슈 지도에서 더하거나 지울 수 있어요.</p></div></div>
<section class="sheet pad">${xs.length ? `<ul class="list-plain">${xs.map((x) => `<li class="iss"><div class="q"><span class="tag st-${x.status}">${esc(STATUS_BY[x.status].name)}</span><span class="tag">${esc(AREA_BY[x.area].name)}</span><a href="#" data-act="${kind === "iv" ? "openIv" : "openDraft"}" data-id="${x.id}">${esc(x.q)}</a></div></li>`).join("")}</ul>` : `<p class="empty">${kind === "iv" ? "이슈가 없어요." : "아직 초안을 쓸 만큼 인터뷰한 이슈가 없어요."} <a href="#map" data-go="map">이슈 지도로</a></p>`}</section>`;
}
function viewInterview() {
  const it = issueById(S.ui.issue);
  if (!it) return issuePicker("iv");
  const pc = ensurePiece(it.id), iv = pc.iv, busy = S.ui.busy.iv, err = S.ui.err.iv;
  let log;
  if (!iv.turns.length && !busy) {
    log = `<div class="iv-empty"><div class="eyebrow">${esc(AREA_BY[it.area].name)}</div><h2>${esc(it.q)}</h2>
      <p class="muted">Claude가 의견, 이유, 반론, 조건을 차례로 묻고 원칙은 맨 마지막에 묻습니다. 논리만으로 충분하면 지난 기록을 찾지 않아요.</p>
      ${err ? `<p class="banner">${esc(err)}</p>` : ""}
      ${aiAvailable() ? `<button class="btn accent" data-act="ivStart">${I.chat}${err ? "다시 시작" : "인터뷰 시작"}</button>` : `<p class="banner">${esc(aiOffMsg())}</p>`}</div>`;
  } else {
    log = iv.turns.map((t, ti) => {
      if (t.role === "user") return `<div class="msg u"><span class="who">나 · ${fmtTime(t.at)}</span><div class="bub">${esc(t.content)}</div></div>`;
      const sug = (t.sug || []).filter((id) => S.SC.items.some((s) => s.id === id) && !iv.scenes.includes(id) && !(t.no || []).includes(id));
      return `<div class="msg a"><span class="who">CLAUDE · ${fmtTime(t.at)}</span><div class="bub">${esc(t.content)}</div>${sug.length ? `<div class="facts">${sug.map((id) => { const s = S.SC.items.find((x) => x.id === id); return `<span class="fact-chip"><b>근거 장면?</b>${esc((s.when ? s.when + " · " : "") + s.title)}<button class="yes" data-act="sceneAttach" data-id="${id}" data-t="${ti}" title="근거로 붙이기">붙이기</button><button data-act="sceneNo" data-id="${id}" data-t="${ti}" aria-label="아니다" title="아니다">×</button></span>`; }).join("")}</div>` : ""}</div>`;
    }).join("");
    if (busy) log += `<div class="msg a"><span class="who">CLAUDE</span><div class="bub typing"><span class="spinner"></span><span id="ivElapsed">생각하는 중</span></div></div>`;
    if (err) log += `<div class="banner" style="align-self:stretch;align-items:center"><span style="flex:1">${esc(err)}</span><button class="btn sm" data-act="ivRetry">다시 보내기</button></div>`;
  }
  const canDraft = !!(iv.slots.opinion && iv.slots.reason);
  const pend = (iv.pend || iv.n >= IV_CAP) && !busy && iv.turns.length;
  const pendBar = pend ? `<div class="iv-pend"><span>${iv.pend ? "충분히 들었어요. 초안을 써 볼까요?" : `${IV_CAP}번 답했어요. 초안으로 넘어가도 돼요.`}</span><span class="row" style="gap:6px"><button class="btn sm primary" data-act="openDraft" data-id="${it.id}">초안 쓰기</button><button class="btn sm ghost" data-act="ivStay">더 이야기하기</button></span></div>` : "";
  const inputOff = busy || !aiAvailable() || !iv.turns.length;
  const chat = `<section class="sheet chat lift"><div class="chat-log" id="chatLog">${log}</div><div class="chat-in">${pendBar}<div class="row"><textarea class="input" id="ivInput" rows="2" placeholder="${iv.turns.length ? "생각나는 대로 답해 주세요. Enter로 보내고 Shift+Enter로 줄을 바꿔요." : "먼저 인터뷰를 시작해 주세요."}" ${inputOff ? "disabled" : ""}>${esc(S.ui.ivDraft || "")}</textarea><button class="btn primary" data-act="ivSend" ${inputOff ? "disabled" : ""} aria-label="보내기">${I.send}</button></div>
    <div class="row iv-foot" style="justify-content:space-between"><span class="muted" style="font-size:11.5px">답 ${iv.n}/${IV_CAP} · 인용 ${iv.quotes.length}</span><span class="row" style="gap:6px">${iv.turns.length ? `<button class="btn sm" data-act="openDraft" data-id="${it.id}" ${canDraft ? "" : "disabled title=\"의견과 이유가 채워지면 쓸 수 있어요\""}>초안 쓰기</button><button class="btn sm ghost" data-act="ivClear">대화 비우기</button>` : ""}</span></div></div></section>`;

  const ck = iv.check || {};
  const slots = SLOTS.map((s) => `<div class="slot ${iv.slots[s.id] ? "on" : ""}"><div class="h"><b>${esc(s.name)}</b><span class="muted">${esc(s.q)}</span></div><textarea class="input sm" rows="2" data-bind="PC.${it.id}.iv.slots.${s.id}" placeholder="(비어 있음)">${esc(iv.slots[s.id] || "")}</textarea></div>`).join("");
  const checks = CHECKS.map((c) => `<span class="ck ${ck[c.id] === true ? "ok" : ck[c.id] === false ? "no" : ""}" title="${esc(c.d)}">${ck[c.id] === true ? "✓" : ck[c.id] === false ? "–" : "·"} ${esc(c.name)}</span>`).join("");
  const allOk = CHECKS.every((c) => ck[c.id] === true);
  const quotes = iv.quotes.map((q, i) => `<li><span>“${esc(q)}”</span><button class="btn sm ghost" data-act="quoteDel" data-i="${i}" aria-label="인용 지우기">×</button></li>`).join("");
  const scenes = iv.scenes.map((id) => { const s = S.SC.items.find((x) => x.id === id); return s ? `<li><span>${esc((s.when ? s.when + " · " : "") + s.title)}</span><button class="btn sm ghost" data-act="sceneDetach" data-id="${id}" aria-label="떼기">×</button></li>` : ""; }).join("");
  const side = `<aside class="stack">
  <section class="sheet side-card"><div class="eyebrow">${esc(AREA_BY[it.area].name)} · ${esc(STATUS_BY[it.status].name)}</div><h4 class="iv-q">${esc(it.q)}</h4><a href="#" data-act="go" data-view="iv" data-clear="1" style="font-size:12px">다른 이슈</a></section>
  <section class="sheet side-card"><h4>점검</h4><div class="cks">${checks}</div><p class="muted" style="font-size:11.5px;margin-top:6px">${ck.note ? esc(ck.note) : allOk ? "논리만으로 충분해요. 지난 기록은 찾지 않아요." : "셋 다 통과하면 기록을 찾지 않아요. 부족하면 먼저 예를 묻고, 그래도 부족할 때만 근거 장면을 제안해요."}</p></section>
  <section class="sheet side-card"><h4>다섯 칸</h4><div class="slots">${slots}</div><p class="muted" style="font-size:11.5px;margin-top:6px">Claude가 답을 요약해 채워요. 틀리면 바로 고치세요.</p></section>
  <section class="sheet side-card"><h4>인용 <span class="mono muted" style="font-size:11px">${iv.quotes.length}</span></h4>${quotes ? `<ul class="list-plain quotes">${quotes}</ul>` : '<p class="muted" style="font-size:12px">초안에 그대로 쓸 내 표현이 여기에 쌓여요.</p>'}</section>
  <section class="sheet side-card"><h4>근거 장면</h4>${scenes ? `<ul class="list-plain">${scenes}</ul>` : '<p class="muted" style="font-size:12px">붙인 장면이 없어요. 필요할 때만 붙입니다.</p>'}</section>
</aside>`;
  return `<div class="page-head"><div><div class="eyebrow">Interview · 인터뷰</div><h1>인터뷰</h1></div></div><div class="iv">${chat}${side}</div>`;
}
function fmtTime(iso) { if (!iso) return ""; const d = new Date(iso); return d.getMonth() + 1 + "/" + d.getDate() + " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes()); }
function afterInterview() {
  const lg = $("#chatLog"); if (lg) lg.scrollTop = lg.scrollHeight;
  const inp = $("#ivInput"); if (inp && !inp.disabled && S.ui.focusIv) { inp.focus(); S.ui.focusIv = false; }
}
let ivTimer = null;
function ivBusy(on) {
  S.ui.busy.iv = on; clearInterval(ivTimer);
  if (on) { const t0 = Date.now(); ivTimer = setInterval(() => { const el = $("#ivElapsed"); if (el) el.textContent = "생각하는 중 · " + Math.round((Date.now() - t0) / 1000) + "초"; }, 1000); }
}
async function ivRun(opening) {
  const it = issueById(S.ui.issue); if (!it) return;
  const pc = ensurePiece(it.id), iv = pc.iv;
  S.ui.err.iv = null; ivBusy(true); render();
  try {
    const r = await aiInterviewTurn(it, pc, opening);
    const sl = r.slots && typeof r.slots === "object" ? r.slots : {};
    SLOTS.forEach((s) => { const v = String(sl[s.id] || "").trim(); if (v) iv.slots[s.id] = v; });
    (Array.isArray(r.quotes) ? r.quotes : []).forEach((q) => { q = String(q || "").trim(); if (q.length >= 4 && !iv.quotes.includes(q)) iv.quotes.push(q); });
    if (r.check && typeof r.check === "object") { const c = {}; CHECKS.forEach((k) => (c[k.id] = r.check[k.id] === true)); c.note = String(r.check.note || ""); iv.check = c; }
    const sug = (Array.isArray(r.scenes) ? r.scenes : []).map(String).filter((id) => S.SC.items.some((s) => s.id === id) && !iv.scenes.includes(id));
    if (!opening) iv.n++;
    if (r.done === true) iv.pend = true;
    iv.turns.push({ role: "assistant", content: String(r.reply), at: nowISO(), sug });
    if (iv.turns.length > 160) iv.turns = iv.turns.slice(-160);
    if (it.status === "idea") it.status = "talk";
    if (it.status === "talk" && SLOTS.every((s) => iv.slots[s.id]) && CHECKS.every((c) => iv.check[c.id])) it.status = "ready";
    markDirty();
    S.ui.focusIv = true;
  } catch (e) {
    S.ui.err.iv = aiErrMsg(e);
  }
  ivBusy(false); render();
}
