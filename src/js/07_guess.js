/* ============================================================ GUESS · AI 맞히기
   Claude writes five new multiple-choice questions and predicts my answer to each before I answer.
   Hits show how well the records describe me; misses point at what the records lack or where I surprise.
   Every answer is also a new fact in Records. */
const GUESS_N = 5, GUESS_DEP = "상황에 따라";
const guessRounds = () => S.PLAY.guess || (S.PLAY.guess = []);
const guessCur = () => { const r = guessRounds()[guessRounds().length - 1]; return r && !r.done ? r : null; };
function guessRate(rs) { const xs = rs.flatMap((r) => r.items.filter((x) => x.ans != null)); return xs.length ? Math.round((xs.filter((x) => x.hit).length / xs.length) * 100) : null; }
async function aiGuessRound() {
  const P = S.P, past = guessRounds().flatMap((r) => r.items);
  const misses = past.filter((x) => x.ans != null && !x.hit).slice(-8).map((x) => "- " + x.q + " → 예측 " + guessOpt(x, x.pred) + ", 실제 " + guessOpt(x, x.ans));
  const prompt = "당신은 한 사람을 오래 지켜본 친구처럼 그의 선택을 예측합니다. 아래 프로필을 읽고, 프로필에 아직 답이 없는 새 질문 " + GUESS_N + "개를 만든 뒤 각 질문에 이 사람이 무엇을 고를지 예측하세요.\n" + STYLE_RULES +
    "\n\n[프로필]\n" + digest(P, { full: true, facts: 60, log: 8 }) +
    (past.length ? "\n\n[이미 낸 문제 — 비슷한 문제 금지]\n" + past.slice(-40).map((x) => "- " + x.q).join("\n") : "") +
    (misses.length ? "\n\n[지난번에 틀린 예측 — 이 사람을 다시 보는 데 참고]\n" + misses.join("\n") : "") +
    "\n\n규칙:\n- 일상의 선택(쉬는 법, 돈 쓰는 법, 일하는 방식, 사람, 취향, 건강 습관 등)에서, 서로 다른 분류로 고르게.\n- 기록에 답이 그대로 있는 질문은 피하고, 기록을 근거로 추론해야 맞힐 수 있는 질문으로.\n- 선택지는 2~4개, 각 20자 이내. '" + GUESS_DEP + "'는 앱이 붙이니 넣지 말 것.\n- pred는 예측한 선택지 번호(0부터). '" + GUESS_DEP + "'로 예측하면 선택지 개수와 같은 번호.\n- conf는 확신(50~95), why는 근거가 된 기록을 짚는 한 문장." +
    '\n\nJSON 하나로만 답하세요: {"items": [{"q": "질문", "opts": ["선택지", "선택지"], "cat": "' + CAT_IDS.join("|") + '", "pred": 0, "conf": 70, "why": "근거 한 문장"}]}';
  const r = await aiJSON(prompt, { modelTier: "complex" });
  const items = (r && Array.isArray(r.items) ? r.items : []).filter((x) => x && x.q && Array.isArray(x.opts) && x.opts.length >= 2).slice(0, GUESS_N).map((x) => {
    const opts = x.opts.slice(0, 4).map((o) => cut(o, 40)).filter((o) => o && o !== GUESS_DEP);
    const pred = Number.isInteger(+x.pred) && +x.pred >= 0 && +x.pred <= opts.length ? +x.pred : 0;
    return { q: cut(x.q, 160), opts, cat: CAT_BY[x.cat] ? x.cat : "etc", pred, conf: clamp(+x.conf || 60, 50, 95), why: cut(x.why, 200), ans: null, hit: null };
  });
  if (items.length < 2) throw { code: "invalid_json" };
  guessRounds().push({ id: uid("g"), at: nowISO(), items, done: false });
  if (guessRounds().length > 40) S.PLAY.guess = guessRounds().slice(-40);
  S.ui.gIdx = 0; markDirty();
}
const guessOpt = (x, k) => (k === x.opts.length ? GUESS_DEP : x.opts[k] || "");
function guessAnswer(k) {
  const r = guessCur(); if (!r) return;
  const x = r.items[S.ui.gIdx || 0]; if (!x || x.ans != null) return;
  x.ans = k; x.hit = k === x.pred;
  const e = addEntry({ cat: x.cat, label: cut(x.q, 40), value: guessOpt(x, k), src: "guess" }); x.entry = e.id;
  markDirty(); render();
}
function guessNext() {
  const r = guessCur(); if (!r) return;
  if ((S.ui.gIdx || 0) >= r.items.length - 1) { r.done = true; r.hit = r.items.filter((x) => x.hit).length; bumpRev("AI 맞히기 " + r.hit + "/" + r.items.length); markDirty(); }
  else S.ui.gIdx = (S.ui.gIdx || 0) + 1;
  render();
}
function viewGuess() {
  const rs = guessRounds(), cur = guessCur(), busy = S.ui.busy.guess, done = rs.filter((r) => r.done), rate = guessRate(rs);
  let main;
  if (cur) {
    const i = Math.min(S.ui.gIdx || 0, cur.items.length - 1), x = cur.items[i], ans = x.ans != null;
    main = '<section class="sheet pad gq"><div class="row" style="justify-content:space-between"><span class="eyebrow">문제 ' + (i + 1) + " / " + cur.items.length + '</span><span class="tag">' + esc(CAT_BY[x.cat].name) + "</span></div>" +
      '<h2 class="gq-q">' + esc(x.q) + '</h2><div class="gq-opts">' + x.opts.concat([GUESS_DEP]).map((o, k) => '<button class="' + (ans && k === x.ans ? "on" : "") + (ans && k === x.pred ? " pred" : "") + '" data-act="gAns" data-v="' + k + '"' + (ans ? " disabled" : "") + ">" + esc(o) + "</button>").join("") + "</div>" +
      (ans ? '<div class="gq-rv ' + (x.hit ? "hit" : "miss") + '"><b>' + (x.hit ? "맞혔어요" : "틀렸어요") + "</b><span>Claude의 예측: " + esc(guessOpt(x, x.pred)) + " (확신 " + x.conf + "%)</span><p>" + esc(x.why) + "</p></div>" +
        '<div class="row" style="justify-content:space-between"><span class="muted" style="font-size:12px">내 답은 Records ' + esc(CAT_BY[x.cat].name) + '에 들어갔어요.</span><button class="btn primary" data-act="gNext">' + (i >= cur.items.length - 1 ? "결과 보기" : "다음 문제") + I.arrow + "</button></div>"
        : '<p class="muted" style="font-size:12.5px">Claude는 이미 답을 예측해 두었어요. 고르면 공개돼요.</p>') + "</section>";
  } else {
    const last = done[done.length - 1];
    main = (last ? '<section class="sheet pad"><div class="eyebrow">지난 라운드 · ' + esc(fmtDot(last.at)) + '</div><h2 style="font-family:var(--f-serif);font-size:24px;margin:4px 0 10px">' + last.hit + " / " + last.items.length + ' 맞힘</h2><ul class="list-plain">' +
      last.items.map((x) => '<li><span class="g-mark ' + (x.hit ? "hit" : "miss") + '">' + (x.hit ? "○" : "×") + '</span><span style="flex:1">' + esc(x.q) + '<br><span class="muted" style="font-size:12px">내 답 ' + esc(guessOpt(x, x.ans)) + (x.hit ? "" : " · 예측 " + esc(guessOpt(x, x.pred))) + "</span></span></li>").join("") + "</ul></section>" : "") +
      '<div class="row" style="margin-top:14px">' + (busy ? '<span class="typing"><span class="spinner"></span>Claude가 문제를 만들고 답을 예측하는 중이에요. 30초~1분 걸려요.</span>' : aiAvailable() ? '<button class="btn accent" data-act="gNew">' + I.spark + "새 문제 " + GUESS_N + "개</button>" : '<span class="muted">' + esc(S.aiOff ? aiErrMsg({ code: S.aiOff }) : "이 화면에서는 Claude 연결을 쓸 수 없어요.") + "</span>") + "</div>" +
      (S.ui.gErr ? '<p class="banner" style="margin-top:10px">' + esc(S.ui.gErr) + "</p>" : "");
  }
  const pts = done.map((r) => ({ t: new Date(r.at), y: Math.round((r.hit / r.items.length) * 100) }));
  const side = '<aside class="stack"><section class="sheet pad"><h3>적중률</h3><div class="big-n">' + (rate == null ? "–" : rate + "<small>%</small>") + '</div><p class="muted" style="font-size:12px">라운드 ' + done.length + "번 · 문제 " + rs.reduce((k, r) => k + r.items.filter((x) => x.ans != null).length, 0) + "개</p>" +
    (pts.length >= 2 ? lineSVG(pts, { h: 150, aria: "라운드별 적중률" }) : '<p class="muted" style="font-size:12px;margin-top:8px">라운드가 두 번 이상 쌓이면 추이가 보여요.</p>') + "</section>" +
    '<section class="sheet pad"><h3 style="margin-bottom:6px">이렇게 봐요</h3><ul class="list-plain" style="font-size:12.5px"><li>적중률이 오르면 기록이 나를 잘 설명하고 있다는 뜻이에요.</li><li>틀린 문제는 기록이 부족하거나 내가 예상 밖인 곳이에요. 다음 라운드에서 Claude가 참고해요.</li><li>답할 때마다 Records에 사실이 하나씩 쌓여요.</li></ul></section></aside>';
  return '<div class="page-head"><div><div class="eyebrow">Guess · AI 맞히기</div><h1>AI 맞히기</h1><p class="lede">Claude가 기록만 보고 내 선택을 먼저 예측해 두고, 내가 답하면 공개해요. 얼마나 맞히는지가 곧 기록이 나를 얼마나 잘 담고 있는지예요.</p></div></div>' +
    '<div class="dec-grid"><div>' + main + "</div>" + side + "</div>";
}
