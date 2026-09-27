/* ============================================================ DECISIONS · 결정 일지
   A decision journal (Kahneman; Farnam Street's template): write down the decision, the options, why,
   what you expect and how sure you are, then look back on a set date. The review separates the quality
   of the decision from the luck of the outcome (Annie Duke's four quadrants). */
const DEC_DUE = [["1m", "1개월 뒤", 1], ["3m", "3개월 뒤", 3], ["6m", "6개월 뒤", 6], ["12m", "1년 뒤", 12]];
const DEC_CONF = [50, 60, 70, 80, 90];
const DEC_MET = [["yes", "기대대로"], ["part", "일부만"], ["no", "빗나감"]];
const DEC_Q = {
  gg: ["좋은 결정 · 좋은 결과", "실력으로 볼 수 있어요"],
  gb: ["좋은 결정 · 나쁜 결과", "운이 나빴던 쪽. 결정 방식은 지켜도 돼요"],
  bg: ["아쉬운 결정 · 좋은 결과", "운이 좋았던 쪽. 같은 방식을 믿기는 어려워요"],
  bb: ["아쉬운 결정 · 나쁜 결과", "배울 점이 가장 많은 칸"],
};
function addMonths(ymd, m) { const d = new Date((ymd || localDate()) + "T12:00:00"); d.setMonth(d.getMonth() + m); return localDate(d); }
const decItems = () => S.P.decisions.items;
function decDue(d) { return d.status !== "done" && d.due && d.due <= localDate(); }
function decQuad(d) { return d.quality && d.outcome ? (d.quality === "good" ? "g" : "b") + (d.outcome === "good" ? "g" : "b") : null; }
/* calibration: how sure I was vs how often it went as expected */
function decStats(P) {
  const done = P.decisions.items.filter((d) => d.status === "done" && d.met);
  const conf = done.length ? Math.round(avg(done.map((d) => d.conf || 70))) : null;
  const met = done.length ? Math.round((sum(done.map((d) => (d.met === "yes" ? 1 : d.met === "part" ? 0.5 : 0))) / done.length) * 100) : null;
  const quad = { gg: 0, gb: 0, bg: 0, bb: 0 };
  P.decisions.items.forEach((d) => { const q = decQuad(d); if (q) quad[q]++; });
  return { n: done.length, conf, met, quad };
}
function decCard(d) {
  const i = decItems().indexOf(d), open = S.ui.decOpen === d.id, due = decDue(d), q = decQuad(d);
  const head = '<button class="dec-h" data-act="decOpen" data-id="' + d.id + '"><span class="dec-t">' + esc(d.title) + '</span><span class="dec-m">' +
    (d.area && CAT_BY[d.area] ? '<span class="tag">' + esc(CAT_BY[d.area].name) + "</span>" : "") + '<span class="mono">' + esc(fmtYM(d.date)) + "</span>" +
    (d.status === "done" ? '<span class="tag">' + (q ? esc(DEC_Q[q][0]) : "돌아봄") + "</span>" : due ? '<span class="tag est">돌아볼 때</span>' : '<span class="mono muted">다시 볼 날 ' + esc(fmtYM(d.due)) + "</span>") + "</span></button>";
  if (!open) return '<div class="dec' + (due ? " due" : "") + '">' + head + "</div>";
  const b = (k) => 'data-bind="P.decisions.items.' + i + "." + k + '"';
  const ta = (k, label, ph, rows) => '<div class="field"><label>' + label + '</label><textarea class="input" rows="' + (rows || 2) + '" ' + b(k) + ' placeholder="' + esc(ph || "") + '">' + esc(d[k] || "") + "</textarea></div>";
  const seg = (k, opts) => '<span class="mini-seg">' + opts.map(([v, l]) => '<button class="' + (d[k] === v ? "on" : "") + '" data-act="decSet" data-i="' + i + '" data-k="' + k + '" data-v="' + v + '">' + l + "</button>").join("") + "</span>";
  const review = '<div class="dec-rv"><div class="eyebrow">돌아보기</div>' + ta("result", "실제로 어떻게 됐나요?", "일어난 일을 사실대로") +
    '<div class="row" style="gap:14px"><span class="flabel">기대와 비교하면</span>' + seg("met", DEC_MET) + "</div>" +
    '<div class="row" style="gap:14px"><span class="flabel">결정 자체는</span>' + seg("quality", [["good", "그때 정보로는 좋은 결정"], ["bad", "아쉬운 결정"]]) + "</div>" +
    '<div class="row" style="gap:14px"><span class="flabel">결과는</span>' + seg("outcome", [["good", "좋았다"], ["bad", "나빴다"]]) + "</div>" +
    (q ? '<p class="qhint"><b>' + esc(DEC_Q[q][0]) + "</b><span>" + esc(DEC_Q[q][1]) + "</span></p>" : "") +
    ta("lesson", "다음에 비슷한 결정을 한다면", "바꿀 것, 지킬 것") +
    '<div class="row">' + (d.status === "done" ? '<span class="muted" style="font-size:12px">' + esc(fmtDot(d.reviewedAt)) + " 돌아봄</span>" : '<button class="btn primary sm" data-act="decDone" data-id="' + d.id + '">돌아보기 완료</button><button class="btn sm ghost" data-act="decLater" data-id="' + d.id + '">한 달 뒤에 다시</button>') + "</div></div>";
  return '<div class="dec on' + (due ? " due" : "") + '">' + head + '<div class="dec-body">' +
    '<div class="grid2"><div class="field"><label>결정</label><input class="input" ' + b("title") + ' data-rerender="1" value="' + esc(d.title) + '"></div><div class="field"><label>다시 볼 날</label><input class="input mono" ' + b("due") + ' data-rerender="1" value="' + esc(d.due || "") + '" placeholder="YYYY-MM-DD"></div></div>' +
    ta("situation", "상황", "왜 결정해야 했나") + ta("options", "고려한 선택지", "한 줄에 하나씩") + ta("why", "고른 것과 이유") + ta("expect", "기대하는 결과", "언제까지 무엇이 어떻게 되면 잘된 것인가") +
    '<div class="row" style="gap:14px"><span class="flabel">그때의 확신</span><span class="mini-seg">' + DEC_CONF.map((v) => '<button class="' + (d.conf === v ? "on" : "") + '" data-act="decSet" data-i="' + i + '" data-k="conf" data-v="' + v + '">' + v + "%</button>").join("") + "</span></div>" +
    (d.status === "done" || due || S.ui.decReview === d.id ? review : '<div class="row"><button class="btn sm" data-act="decReview" data-id="' + d.id + '">지금 돌아보기</button></div>') +
    '<div class="row" style="justify-content:flex-end">' + (S.ui.confirmDel === d.id ? '<button class="btn sm signal" data-act="decDel" data-id="' + d.id + '">삭제</button><button class="btn sm ghost" data-act="recDelCancel">취소</button>' : '<button class="btn sm ghost" data-act="recDelAsk" data-id="' + d.id + '">' + I.trash + "삭제</button>") + "</div></div></div>";
}
function viewDecide() {
  const P = S.P, xs = decItems().slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const due = xs.filter(decDue), open = xs.filter((d) => d.status !== "done" && !decDue(d)), done = xs.filter((d) => d.status === "done");
  const st = decStats(P);
  const form = '<section class="sheet pad dec-new"><h3>새 결정 적기</h3><div class="grid2"><div class="field"><label for="decTitle">결정</label><input class="input" id="decTitle" placeholder="예: 이직 제안을 거절한다"></div>' +
    '<div class="field"><label for="decArea">분야</label><select class="input" id="decArea"><option value="">선택 안 함</option>' + LEDGER_CATS.filter((c) => c.id !== "etc").map((c) => '<option value="' + c.id + '">' + c.name + "</option>").join("") + "</select></div></div>" +
    '<div class="field"><label for="decWhy">고른 것과 이유</label><textarea class="input" id="decWhy" rows="2" placeholder="무엇을 골랐고 왜"></textarea></div>' +
    '<div class="field"><label for="decExpect">기대하는 결과</label><textarea class="input" id="decExpect" rows="2" placeholder="언제까지 무엇이 어떻게 되면 잘된 것인가"></textarea></div>' +
    '<details><summary class="muted" style="font-size:12.5px;cursor:pointer">상황과 다른 선택지도 적기</summary><div class="stack" style="gap:10px;margin-top:10px"><div class="field"><label for="decSit">상황</label><textarea class="input" id="decSit" rows="2"></textarea></div><div class="field"><label for="decOpts">고려한 선택지</label><textarea class="input" id="decOpts" rows="2" placeholder="한 줄에 하나씩"></textarea></div></div></details>' +
    '<div class="row" style="gap:14px"><span class="flabel">확신</span><span class="mini-seg" id="decConf">' + DEC_CONF.map((v) => '<button class="' + ((S.ui.decConf || 70) === v ? "on" : "") + '" data-act="decConf" data-v="' + v + '">' + v + "%</button>").join("") + '</span><span class="flabel">다시 볼 날</span><select class="input" id="decDue" style="width:auto">' + DEC_DUE.map(([v, l]) => '<option value="' + v + '"' + (v === "3m" ? " selected" : "") + ">" + l + "</option>").join("") + "</select>" +
    '<span style="flex:1"></span><button class="btn primary" data-act="decAdd">' + I.plus + "적기</button></div></section>";
  const statBox = st.n ? '<section class="sheet pad"><h3 style="margin-bottom:8px">돌아본 결정 ' + st.n + '개</h3><p style="font-size:13.5px">확신 평균 <b>' + st.conf + '%</b> · 기대대로 된 비율 <b>' + st.met + '%</b></p><p class="muted" style="font-size:12px;margin-bottom:10px">' + (st.conf - st.met >= 15 ? "확신이 결과보다 높은 편이에요. 결정할 때 한 번 더 따져 볼 여지가 있어요." : st.met - st.conf >= 15 ? "생각보다 잘 풀리는 편이에요. 확신을 조금 더 가져도 돼요." : "확신과 결과가 비슷하게 맞아요.") + "</p>" +
    '<div class="dec-quad">' + ["gg", "gb", "bg", "bb"].map((k) => '<div><b>' + st.quad[k] + "</b><span>" + esc(DEC_Q[k][0]) + "</span></div>").join("") + "</div></section>" : "";
  const list = (t, arr) => arr.length ? '<h2 class="sec-h" style="margin:22px 0 8px">' + t + ' <span class="mono muted" style="font-size:12px">' + arr.length + "</span></h2>" + arr.map(decCard).join("") : "";
  return '<div class="page-head"><div><div class="eyebrow">Decisions · 결정 일지</div><h1>결정 일지</h1><p class="lede">결정할 때 이유와 기대, 확신을 적어 두고 정한 날에 돌아봐요. 결정이 좋았는지와 결과가 좋았는지를 나눠 보면 운과 실력이 구분돼요.</p></div></div>' +
    (due.length ? '<div class="banner" style="margin-bottom:14px"><span>돌아볼 때가 된 결정이 <b>' + due.length + "개</b> 있어요.</span></div>" : "") +
    '<div class="dec-grid"><div>' + form + list("돌아볼 때", due) + list("진행 중", open) + list("돌아본 결정", done) + (xs.length ? "" : '<p class="empty">아직 적은 결정이 없어요. 요즘 고민 중인 결정 하나로 시작해 보세요.</p>') + "</div>" +
    '<aside class="stack">' + statBox + '<section class="sheet pad"><h3 style="margin-bottom:6px">이렇게 써요</h3><ul class="list-plain" style="font-size:12.5px"><li>결과를 알기 전에 적는 게 핵심이에요. 나중에 적으면 기억이 결과에 맞춰 바뀌어요.</li><li>기대는 확인할 수 있게 적어요. "잘되면 좋겠다" 대신 "6개월 안에 연봉 10% 이상".</li><li>다시 볼 날이 되면 개요와 이 화면에 알려 드려요.</li></ul></section></aside></div>';
}
function decAdd() {
  const t = $("#decTitle"), title = t && t.value.trim(); if (!title) { t && t.focus(); toast("결정을 한 줄로 적어 주세요."); return; }
  const today = localDate(), dm = (DEC_DUE.find((x) => x[0] === $("#decDue").value) || DEC_DUE[1])[2];
  decItems().push({ id: uid("d"), title, date: today, area: $("#decArea").value || null, situation: $("#decSit").value.trim(), options: $("#decOpts").value.trim(), why: $("#decWhy").value.trim(), expect: $("#decExpect").value.trim(), conf: S.ui.decConf || 70, due: addMonths(today, dm), status: "open", result: "", met: null, quality: null, outcome: null, lesson: "", at: nowISO() });
  S.ui.decConf = 70; markDirty(); render(); toast("결정을 적었어요. " + addMonths(today, dm) + "에 돌아볼게요.");
}
