/* ============================================================ INTERVIEW · AI 인터뷰 */
function viewInterview() {
  const P = S.P, turns = S.CHAT.turns, busy = S.ui.busy.iv;
  const factById = Object.fromEntries(P.ledger.map((f) => [f.id, f]));
  let log = "";
  if (!turns.length && !busy) {
    log = '<div style="margin:auto;max-width:460px;text-align:center;display:flex;flex-direction:column;gap:14px;align-items:center;padding:30px 10px">' +
      '<div class="eyebrow">Interview</div><h2 style="font-size:22px">빈 곳을 대화로 채웁니다</h2>' +
      '<p class="muted">Claude가 지금까지의 프로필을 읽고, 가장 비어 있거나 서로 어긋나 보이는 곳부터 한 번에 하나씩 묻습니다. 답에서 드러난 사실은 자동으로 프로필에 쌓이고, 원하지 않으면 바로 지울 수 있어요.</p>' +
      (S.ui.ivErr ? '<p class="banner" style="text-align:left">' + esc(S.ui.ivErr) + "</p>" : "") + (aiAvailable() ? '<button class="btn accent" data-act="ivStart">' + I.chat + (S.ui.ivErr ? "다시 시작" : "인터뷰 시작") + "</button>" : '<p class="banner">' + esc(S.aiOff ? aiErrMsg({ code: S.aiOff }) : "이 화면에서는 Claude 연결을 쓸 수 없어요. Claude 앱에서 열어 주세요.") + "</p>") + "</div>";
  } else {
    log = turns.map((t, ti) => {
      if (t.role === "user" && t.meta) return '<div class="muted" style="align-self:center;font-size:11.5px">— 다른 질문 요청 —</div>';
      if (t.role === "user") return '<div class="msg u"><span class="who">나 · ' + fmtTime(t.at) + '</span><div class="bub">' + esc(t.content) + "</div></div>";
      const fx = (t.facts || []).map((id) => factById[id]).filter(Boolean);
      const add = [t.added && t.added.wants ? "원하는 것 +" + t.added.wants : "", t.added && t.added.events ? "연대기 +" + t.added.events : ""].filter(Boolean).join(" · ");
      return '<div class="msg a"><span class="who">CLAUDE · ' + fmtTime(t.at) + '</span><div class="bub">' + esc(t.content) + "</div>" +
        (fx.length || add ? '<div class="facts">' + fx.map((f) => '<span class="fact-chip"><b>' + esc(CAT_BY[f.cat].name) + "</b>" + esc(entryText(f)) + '<button data-act="factDel" data-id="' + f.id + '" aria-label="이 사실 지우기" title="지우기">×</button></span>').join("") + (add ? '<span class="tag ai">' + add + "</span>" : "") + "</div>" : "") + "</div>";
    }).join("");
    if (busy) log += '<div class="msg a"><span class="who">CLAUDE</span><div class="bub typing"><span class="spinner"></span><span id="ivElapsed">답을 생각하는 중</span></div></div>';
    if (S.ui.ivErr) log += '<div class="banner" style="align-self:stretch;align-items:center"><span style="flex:1">' + esc(S.ui.ivErr) + '</span><button class="btn sm" data-act="ivRetry">다시 보내기</button></div>';
  }
  const lastUser = turns.length && turns[turns.length - 1].role === "user";
  const inputDisabled = busy || !aiAvailable() || !turns.length;
  const chat = '<section class="sheet chat lift"><div class="chat-log" id="chatLog">' + log + '</div><div class="chat-in"><div class="row"><textarea class="input" id="ivInput" rows="2" placeholder="' + (turns.length ? "생각나는 대로 답해 주세요. Enter로 보내고 Shift+Enter로 줄을 바꿔요." : "먼저 인터뷰를 시작해 주세요.") + '" ' + (inputDisabled ? "disabled" : "") + '>' + esc(S.ui.ivDraft || "") + '</textarea><button class="btn primary" data-act="ivSend" ' + (inputDisabled ? "disabled" : "") + ' aria-label="보내기">' + I.send + '</button></div><div class="row" style="justify-content:space-between"><span class="muted" style="font-size:11.5px">' + (lastUser && !busy ? "마지막 메시지에 아직 답이 없어요." : "대화는 나만 볼 수 있게 저장돼요.") + '</span><span class="row" style="gap:6px">' + (turns.length ? '<button class="btn sm ghost" data-act="ivNewTopic">주제 바꿔 새 질문</button><button class="btn sm ghost" data-act="ivClear">대화 비우기</button>' : "") + "</span></div></div></section>";

  const gaps = gapList(P).slice(0, 6);
  const sessionFacts = P.ledger.filter((f) => f.src === "interview");
  const side = '<aside class="stack"><section class="sheet side-card"><h4>인터뷰 초점</h4><div class="topics">' + TOPICS.map(([k, l]) => '<button class="chip ' + ((S.CHAT.topic || "auto") === k ? "on" : "") + '" data-act="ivTopic" data-v="' + k + '">' + l + "</button>").join("") + '</div><p class="muted" style="font-size:11.5px;margin-top:8px">초점을 바꾸면 다음 질문부터 반영돼요.</p></section>' +
    '<section class="sheet side-card"><h4>가장 비어 있는 곳</h4>' + gaps.map((g) => '<div class="gap-row"><span>' + esc(g.name) + '</span><span class="b"><i style="width:' + g.p + "%;background:" + (g.p < 30 ? "var(--signal)" : "var(--accent)") + '"></i></span><span class="v">' + g.p + "%</span></div>").join("") + "</section>" +
    '<section class="sheet side-card"><h4>인터뷰로 알게 된 것 <span class="mono muted" style="font-size:11px">' + sessionFacts.length + '</span></h4><ul class="list-plain">' + (sessionFacts.slice(-6).reverse().map((f) => '<li style="padding:7px 0;font-size:12.5px"><span class="tag">' + esc(CAT_BY[f.cat].name) + "</span><span>" + esc(entryText(f)) + "</span></li>").join("") || '<li class="muted" style="font-size:12.5px">아직 없어요.</li>') + "</ul></section></aside>";

  return '<div class="page-head"><div><div class="eyebrow">Interview · 대화</div><h1>AI 인터뷰</h1><p class="lede">탐구가 윤곽을 그린다면 인터뷰는 세부를 채웁니다. 비어 있거나 어긋나 보이는 곳부터 하나씩 묻고, 답에서 드러난 사실은 Records에 들어가요.</p></div></div><div class="iv">' + chat + side + "</div>";
}
function fmtTime(iso) { if (!iso) return ""; const d = new Date(iso); return d.getMonth() + 1 + "/" + d.getDate() + " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes()); }
function afterInterview() {
  const lg = $("#chatLog"); if (lg) lg.scrollTop = lg.scrollHeight;
  const inp = $("#ivInput"); if (inp && !inp.disabled && S.ui.focusIv) { inp.focus(); S.ui.focusIv = false; }
}
let ivTimer = null;
function ivBusy(on) {
  S.ui.busy.iv = on; clearInterval(ivTimer);
  if (on) { const t0 = Date.now(); ivTimer = setInterval(() => { const el = $("#ivElapsed"); if (el) el.textContent = "답을 생각하는 중 · " + Math.round((Date.now() - t0) / 1000) + "초"; }, 1000); }
}
async function ivRun(opening) {
  S.ui.ivErr = null; ivBusy(true); render();
  try {
    const r = await aiInterviewTurn(opening);
    const P = S.P, ids = [];
    (Array.isArray(r.facts) ? r.facts : []).forEach((f) => {
      if (!f || !f.text) return;
      const cat = CAT_BY[f.cat] ? f.cat : AREA_TO_CAT[f.area] || "etc";
      if (P.ledger.some((x) => x.value === f.text)) return;
      ids.push(addEntry({ cat, label: String(f.label || ""), value: String(f.text), src: "interview" }).id);
    });
    let nw = 0, ne = 0;
    (Array.isArray(r.wants) ? r.wants : []).forEach((w) => { if (!w || !w.text || !WT_BY[w.type]) return; P.wants.items.push({ id: uid("w"), type: w.type, text: String(w.text), horizon: HZ_BY[w.horizon] ? w.horizon : "someday", prio: 2, status: "idea", why: "", src: "AI 인터뷰" }); nw++; });
    (Array.isArray(r.events) ? r.events : []).forEach((e) => { if (!e || !e.label || !/^\d{4}(-\d{2})?$/.test(String(e.year || ""))) return; P.timeline.events.push({ id: uid("e"), lane: LANE_BY[e.lane] && e.lane !== "plan" ? e.lane : "me", label: String(e.label), s: String(e.year), e: null, kind: "milestone", est: false, src: "AI 인터뷰", note: "" }); ne++; });
    S.CHAT.turns.push({ role: "assistant", content: String(r.reply), at: nowISO(), facts: ids, added: { wants: nw, events: ne } });
    if (S.CHAT.turns.length > 120) S.CHAT.turns = S.CHAT.turns.slice(-120);
    const ivN = P.ledger.filter((f) => f.src === "interview").length;
    if (ids.length && Math.floor(ivN / 5) > Math.floor((ivN - ids.length) / 5)) bumpRev("AI 인터뷰 · 사실 " + ivN + "개");
    markDirty("chat", "profile");
    S.ui.focusIv = true;
  } catch (e) {
    S.ui.ivErr = aiErrMsg(e);
  }
  ivBusy(false); render();
}
