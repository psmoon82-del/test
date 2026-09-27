/* ============================================================ JOURNEY · 안내된 여정 */
function curCh() {
  if (!S.ui.ch || !CH_BY[S.ui.ch]) { const n = CH.find((c) => !S.P.done[c.id]); S.ui.ch = (n || CH[0]).id; }
  return CH_BY[S.ui.ch];
}
function srcTag(src) { return src ? '<span class="tag seed" title="출처">' + esc(src) + "</span>" : ""; }
function hint(label, text) { return text ? '<div class="qhint"><b>' + esc(label) + "</b><span>" + esc(text) + "</span></div>" : ""; }

/* ---------------- steps per chapter ---------------- */
const STEPS = {
  basics: () => [{ label: "제원", html: stepBasics, ok: () => true }],
  wheel: () => [0, 1, 2, 3].map((k) => ({ label: WHEEL.slice(k * 2, k * 2 + 2).map((w) => w.name).join("·"), html: () => stepWheel(k), ok: () => WHEEL.slice(k * 2, k * 2 + 2).every((w) => { const a = S.P.wheel.areas[w.id]; return a && a.sat != null && a.imp != null; }) })),
  ipip: () => [0, 1, 2, 3, 4].map((k) => ({ label: k * 4 + 1 + "–" + (k * 4 + 4), html: () => stepIpip(k), ok: () => IPIP.slice(k * 4, k * 4 + 4).every((x) => S.P.ipip.answers[x.n] != null) })),
  values: () => DILEMMAS.map((d, i) => ({ label: "", html: () => stepDilemma(i), ok: () => !!S.P.values.picks[i] })),
  energy: () => [
    { label: "활동 1", html: () => stepActs(0), ok: () => ACTS.slice(0, 10).every((a) => S.P.energy.acts[a.id]) },
    { label: "활동 2", html: () => stepActs(1), ok: () => ACTS.slice(10).every((a) => S.P.energy.acts[a.id]) },
    { label: "몰입", html: stepFlow, ok: () => true },
    { label: "리듬", html: stepChrono, ok: () => CHRONO.every((q) => S.P.energy.chrono[q.id] != null) },
    { label: "일하는 방식", html: stepDisc, ok: () => DISC_PAIRS.every((_, i) => S.P.energy.disc[i]) },
  ],
  loves: () => [{ label: "탐색", html: stepLoves, ok: () => true }],
  thoughts: () => [{ label: "재검토", html: stepThoughts, ok: () => true }],
  wants: () => [{ label: "목적지", html: stepWants, ok: () => true }],
  timeline: () => [{ label: "이정표", html: stepTimeline, ok: () => true }],
};

function viewJourney() {
  const P = S.P, ch = curCh(), steps = STEPS[ch.id]();
  if (S.ui.step > steps.length) S.ui.step = steps.length;
  const onResult = S.ui.step === steps.length;
  const idx = '<nav class="jr-index sheet" aria-label="챕터 목록"><ol>' + CH.map((c) => {
    const stt = chState(P, c.id), pr = P.done[c.id] ? 100 : chProgress(P, c.id);
    return '<li class="' + stt + '"><a href="#journey" class="' + (c.id === ch.id ? "on" : "") + '" data-act="openCh" data-id="' + c.id + '"><span class="dia"></span><span class="t">' + c.code + " " + esc(c.name) + "<small>" + esc(c.stage) + '</small></span><span class="p">' + (stt === "done" ? "완료" : pr + "%") + "</span></a></li>";
  }).join("") + "</ol></nav>";

  const pr = P.done[ch.id] ? 100 : chProgress(P, ch.id);
  const head = '<div class="ch-head"><div class="code">CH.' + ch.code + " · " + esc(ch.stage) + '</div><h2>' + esc(ch.title) + '</h2><p class="why">' + esc(ch.why) + '</p><div class="meta"><span class="tag">' + esc(ch.frame) + '</span><span class="tag">약 ' + ch.mins + '분</span><span class="state ' + chState(P, ch.id) + '">' + ({ done: "완료", doing: "진행 " + pr + "%", todo: "대기" })[chState(P, ch.id)] + "</span>" + (P.done[ch.id] && P.chapterAt[ch.id] ? '<span class="tag">완료 ' + fmtDot(P.chapterAt[ch.id]) + "</span>" : "") + "</div></div>";
  const body = '<div class="ch-body">' + (onResult ? chapterResult(ch.id) : steps[S.ui.step].html()) + "</div>";
  const cur = steps[S.ui.step];
  const canNext = onResult || !cur || cur.ok();
  const dots = steps.map((s, i) => '<i class="' + (i < S.ui.step ? "on" : i === S.ui.step ? "cur" : "") + '" title="' + esc(s.label) + '"></i>').join("") + '<i class="' + (onResult ? "cur" : "") + '" title="결과"></i>';
  const stepLabel = onResult ? "결과" : (steps.length > 1 ? (S.ui.step + 1) + " / " + steps.length + (cur.label ? " · " + esc(cur.label) : "") : esc(cur.label));
  let foot = '<div class="ch-foot"><div class="steps">' + dots + '<span class="mono muted" style="font-size:11px;margin-left:6px">' + stepLabel + "</span></div>";
  if (S.ui.step > 0) foot += '<button class="btn ghost" data-act="stepPrev">' + I.back + "이전</button>";
  if (!onResult) foot += '<button class="btn primary" data-act="stepNext" ' + (canNext ? "" : "disabled") + ">" + (S.ui.step === steps.length - 1 ? "결과 보기" : "다음") + I.arrow + "</button>";
  else {
    if (!P.done[ch.id]) foot += '<button class="btn signal" data-act="chDone">챕터 완료</button>';
    const ni = CH.findIndex((c) => c.id === ch.id);
    if (ni < CH.length - 1) foot += '<button class="btn ' + (P.done[ch.id] ? "primary" : "") + '" data-act="openCh" data-id="' + CH[ni + 1].id + '">다음 챕터 · ' + esc(CH[ni + 1].name) + I.arrow + "</button>";
    else foot += '<button class="btn ' + (P.done[ch.id] ? "primary" : "") + '" data-act="go" data-view="interview">시운전(AI 인터뷰)으로' + I.arrow + "</button>";
  }
  foot += "</div>";
  const needHint = !onResult && cur && !canNext ? '<p class="muted" style="font-size:12px;text-align:right;margin-top:8px">모든 문항에 답하면 다음으로 넘어갈 수 있어요.</p>' : "";

  return '<div class="page-head"><div><div class="eyebrow">Journey · 설계와 건조</div><h1>안내된 여정</h1><p class="lede">아홉 개의 챕터를 차례로 지나며 나라는 배의 뼈대를 세웁니다. 순서를 건너뛰어도 괜찮아요. 모든 답은 바로 저장돼요.</p></div></div>' +
    '<div class="jr">' + idx + '<section class="sheet lift" id="chSheet">' + head + body + foot + "</section></div>" + needHint;
}

/* ---------------- CH00 basics ---------------- */
function stepBasics() {
  const b = S.P.basics;
  const f = (k, label, ph, type) => '<div class="field"><label for="b_' + k + '">' + label + '</label><input class="input" id="b_' + k + '" ' + (type === "num" ? 'inputmode="numeric" data-type="num"' : "") + ' data-bind="P.basics.' + k + '" value="' + esc(b[k] ?? "") + '" placeholder="' + esc(ph || "") + '"></div>';
  const t = (k, label, ph) => '<div class="field"><label for="b_' + k + '">' + label + '</label><textarea class="input" id="b_' + k + '" rows="3" data-bind="P.basics.' + k + '" placeholder="' + esc(ph || "") + '">' + esc(b[k] || "") + "</textarea></div>";
  return '<div class="stack">' +
    (b.seeded && !b.confirmed ? '<div class="banner info">기존 메모에서 채운 내용이에요. 출생년도와 자녀 나이는 메모 속 나이 기록으로 추정했어요. 틀린 곳을 고치고 아래 버튼을 눌러 주세요.</div>' : "") +
    '<div class="grid2">' + f("name", "이름") + f("nick", "불리고 싶은 호칭 (선택)", "예: 성문") + f("birthYear", "출생년도" + (b.birthEst ? ' <span class="tag est">추정</span>' : ""), "예: 1982", "num") + f("region", "사는 곳") + "</div>" +
    f("job", "하는 일", "회사, 직무, 직책") + t("family", "가족", "함께 사는 사람, 가까운 가족") + t("career", "일의 이력 (선택)", "어떤 일을 해 왔는지") + t("intro", "나를 한 문장으로 소개한다면 (선택)", "지금 떠오르는 대로") +
    '<div class="row"><button class="btn ' + (b.confirmed ? "" : "primary") + '" data-act="basicsConfirm">' + (b.confirmed ? "확인 완료 ✓" : "이 내용이 맞아요") + "</button>" + (b.confirmed ? '<span class="muted" style="font-size:12.5px">언제든 다시 고칠 수 있어요.</span>' : "") + "</div></div>";
}

/* ---------------- CH01 wheel ---------------- */
function stepWheel(k) {
  const P = S.P; const hints = (P.hints && P.hints.wheel) || {};
  return '<p class="muted" style="margin-bottom:6px">두 가지를 따로 매겨 주세요. <b style="color:var(--ink)">만족도</b>는 지금 이 영역이 얼마나 채워져 있다고 느끼는지(0~10), <b style="color:var(--ink)">중요도</b>는 나에게 이 영역이 얼마나 중요한지(1~5)예요.</p>' +
    WHEEL.slice(k * 2, k * 2 + 2).map((w) => {
      const a = P.wheel.areas[w.id] || {};
      const sat = '<div class="scale-row"><span class="flabel">만족도</span><div class="scale" role="group" aria-label="' + w.name + ' 만족도">' + Array.from({ length: 11 }, (_, v) => '<button class="' + (a.sat === v ? "on" : "") + '" data-act="wheelSat" data-a="' + w.id + '" data-v="' + v + '">' + v + "</button>").join("") + '</div><div class="scale-cap"><span>전혀 채워지지 않음</span><span>충분히 채워짐</span></div></div>';
      const imp = '<div class="scale-row"><span class="flabel">중요도</span><div class="scale imp" role="group" aria-label="' + w.name + ' 중요도">' + [1, 2, 3, 4, 5].map((v) => '<button class="' + (a.imp === v ? "on" : "") + '" data-act="wheelImp" data-a="' + w.id + '" data-v="' + v + '">' + v + "</button>").join("") + '</div><div class="scale-cap" style="max-width:190px"><span>덜 중요</span><span>매우 중요</span></div></div>';
      return '<div class="wa"><div class="nm">' + w.name + "<small>" + w.sub + '</small></div><div class="stack" style="gap:12px">' + hint("참고", hints[w.id]) + sat + imp +
        '<div class="field"><label for="wn_' + w.id + '">그렇게 매긴 이유 (선택)</label><textarea class="input" rows="2" id="wn_' + w.id + '" data-bind="P.wheel.areas.' + w.id + '.note" placeholder="한 줄이면 충분해요">' + esc(a.note || "") + "</textarea></div></div></div>";
    }).join("");
}

/* ---------------- CH02 ipip ---------------- */
function stepIpip(k) {
  return '<p class="muted" style="margin-bottom:4px">평소의 나를 떠올리며 답해 주세요. 되고 싶은 모습이 아니라 지금의 모습 그대로요.</p>' +
    IPIP.slice(k * 4, k * 4 + 4).map((x) => {
      const v = S.P.ipip.answers[x.n];
      return '<div class="lk"><div class="q"><small>' + pad2(x.n) + "</small>" + esc(x.q) + '</div><div class="opts" role="group">' + LIKERT.map((l, i) => '<button class="' + (v === i + 1 ? "on" : "") + '" data-act="ipip" data-n="' + x.n + '" data-v="' + (i + 1) + '">' + l + "</button>").join("") + "</div></div>";
    }).join("");
}

/* ---------------- CH03 values ---------------- */
function stepDilemma(i) {
  const d = DILEMMAS[i], p = S.P.values.picks[i];
  const prior = S.P.prior && S.P.prior.valuesTop3 && i === 0 ? '<div class="qhint"><b>참고</b><span>지난번에 10개 가치 중 직접 고른 Top 3는 ' + S.P.prior.valuesTop3.map((id) => VAL_BY[id]?.name).join(" · ") + "였어요. 이번엔 고르는 대신 선택으로 드러나는 순위를 봅니다. 결과에서 둘을 비교해요.</span></div>" : "";
  return '<div class="dl">' + prior + '<div class="sc">DILEMMA ' + pad2(i + 1) + " / " + DILEMMAS.length + '</div><div class="q">' + esc(d.q) + '</div><div class="opts">' +
    [["a", d.a], ["b", d.b]].map(([k, o]) => '<button class="opt ' + (p === k ? "on" : "") + '" data-act="dilemma" data-i="' + i + '" data-v="' + k + '"><span class="k">' + k.toUpperCase() + '</span><span class="t">' + esc(o[1]) + "</span></button>").join("") +
    '</div><p class="muted" style="font-size:12.5px">둘 다 끌려도 굳이 하나를 고르면? 고르면 다음 문제로 넘어가요.</p></div>';
}

/* ---------------- CH04 energy ---------------- */
function stepActs(part) {
  const list = part === 0 ? ACTS.slice(0, 10) : ACTS.slice(10);
  return '<p class="muted" style="margin-bottom:12px">이 활동을 하고 나면 보통 어떤가요? <b style="color:var(--c-energy)">충전</b>은 하고 나면 힘이 나는 것, <b style="color:var(--crit)">방전</b>은 잘하더라도 진이 빠지는 것.</p><div class="acts">' +
    list.map((a) => { const v = S.P.energy.acts[a.id]; return '<div class="act ' + (v || "") + '"><span class="nm">' + esc(a.t) + '</span><span class="seg">' + [["c", "충전"], ["n", "보통"], ["d", "방전"]].map(([k, l]) => '<button class="' + k + (v === k ? " on" : "") + '" data-act="act" data-a="' + a.id + '" data-v="' + k + '">' + l + "</button>").join("") + "</span></div>"; }).join("") + "</div>";
}
function stepFlow() {
  const e = S.P.energy, h = (S.P.hints && S.P.hints.energy) || {};
  const ta = (k, label, ph) => '<div class="field"><label for="fl_' + k + '">' + label + '</label><textarea class="input" rows="3" id="fl_' + k + '" data-bind="P.energy.' + k + '" placeholder="' + esc(ph) + '">' + esc(e[k] || "") + "</textarea></div>";
  return '<div class="stack">' + hint("참고", h.flowRecent) +
    ta("flowRecent", "최근에 시간 가는 줄 몰랐던 순간", "언제, 무엇을 하고 있었나요? 작은 것도 괜찮아요") +
    ta("flowLast", "없다면, 마지막으로 그랬던 때는 언제였나요?", "몇 년 전이어도 좋아요") +
    ta("flowChild", "어릴 때 가장 빠져 있던 것", "누가 시키지 않아도 하던 것") + "</div>";
}
function stepChrono() {
  const c = S.P.energy.chrono, h = (S.P.hints && S.P.hints.energy) || {};
  return '<div class="stack">' + hint("참고", h.chrono) + CHRONO.map((q) => '<div class="field"><span class="flabel" style="font-size:14px;color:var(--ink)">' + esc(q.q) + '</span><div class="seg3" role="group">' + q.o.map(([l, v]) => '<button class="' + (c[q.id] === v ? "on" : "") + '" data-act="chrono" data-q="' + q.id + '" data-v="' + v + '">' + l + "</button>").join("") + "</div></div>").join("") + "</div>";
}
function stepDisc() {
  const d = S.P.energy.disc;
  const migrated = Object.keys(d).length && S.P.prior && S.P.prior.valuesTop3 ? '<div class="qhint" style="margin-bottom:14px"><b>이어받음</b><span>지난 버전에서 답한 8문항을 그대로 가져왔어요. 바꾸고 싶은 답만 다시 눌러 주세요.</span></div>' : "";
  return migrated + '<p class="muted" style="margin-bottom:12px">두 문장 중 일할 때의 나에 더 가까운 쪽을 고르세요.</p>' + DISC_PAIRS.map((p, i) => '<div class="pair">' + [["a", p.a], ["b", p.b]].map(([k, o]) => '<button class="' + (d[i] === k ? "on" : "") + '" data-act="disc" data-i="' + i + '" data-v="' + k + '">' + esc(o[1]) + "</button>").join("") + "</div>").join("");
}

/* ---------------- CH05 loves (drill-down) ---------------- */
function stepLoves() {
  const P = S.P, cat = S.ui.lovesCat;
  if (!cat) {
    return '<p class="muted" style="margin-bottom:14px">큰 분류를 골라 들어가세요. 들어간 분류는 <span class="tag">확인함</span>으로 표시돼요.</p><div class="tiles">' + LOVE_CATS.map((c, i) => {
      const x = P.loves.cats[c.id]; const n = x.items.length;
      return '<button class="tile" data-act="loveCat" data-id="' + c.id + '"><span class="bar" style="background:var(--c-loves);opacity:' + (n ? 1 : 0.25) + '"></span><span class="ic">' + pad2(i + 1) + '</span><span class="nm">' + c.name + '</span><span class="ds">' + c.d + '</span><span class="ct ' + (n ? "has" : "") + '">항목 ' + n + " · 세부 " + x.subs.length + (P.loves.seen[c.id] ? " · 확인함" : "") + "</span></button>";
    }).join("") + "</div>";
  }
  const C = LOVE_CATS.find((c) => c.id === cat), x = P.loves.cats[cat];
  const subs = Array.from(new Set(C.subs.concat(x.subs)));
  const items = x.items.map((it, i) => '<div class="it love"><input class="input" style="font-weight:600" aria-label="이름" data-bind="P.loves.cats.' + cat + ".items." + i + '.name" value="' + esc(it.name) + '"><input class="input why" aria-label="좋아하는 이유" data-bind="P.loves.cats.' + cat + ".items." + i + '.why" value="' + esc(it.why || "") + '" placeholder="왜 좋은가요? 맛, 분위기, 추억, 누구와…"><div class="ops">' + srcTag(it.src) + '<button class="btn sm ghost" data-act="loveDel" data-i="' + i + '" aria-label="삭제">' + I.trash + "</button></div></div>").join("");
  return '<div class="crumbs"><button data-act="loveCat" data-id="">좋아하는 것</button><span class="sep">›</span><b style="color:var(--ink)">' + C.name + "</b></div>" +
    '<div class="stack"><div><div class="flabel" style="margin-bottom:8px">중분류 · 끌리는 것을 모두 켜 주세요</div><div class="row" style="gap:6px">' + subs.map((s) => '<button class="chip ' + (x.subs.includes(s) ? "on" : "") + '" data-act="loveSub" data-v="' + esc(s) + '">' + esc(s) + "</button>").join("") +
    '<span class="row" style="gap:6px"><input class="input" id="newSub" placeholder="직접 추가" style="width:130px;padding:5px 9px;font-size:12.5px"><button class="btn sm" data-act="loveSubAdd">추가</button></span></div></div>' +
    '<div><div class="flabel" style="margin-bottom:8px">소분류 · 구체적으로 좋아하는 것과 그 이유</div><div class="items">' + (items || '<div class="empty">아직 없어요. 아래에서 추가해 보세요.</div>') + "</div></div>" +
    '<div class="adder"><input class="input" id="newLoveName" placeholder="좋아하는 것 (예: 진주냉면)"><input class="input" id="newLoveWhy" placeholder="이유 (선택)"><button class="btn primary" data-act="loveAdd">' + I.plus + "추가</button></div>" +
    '<div class="row" style="justify-content:space-between;margin-top:6px"><button class="btn ghost" data-act="loveCat" data-id="">' + I.back + "분류 목록</button>" + nextCatBtn(cat) + "</div></div>";
}
function nextCatBtn(cat) { const i = LOVE_CATS.findIndex((c) => c.id === cat); const n = LOVE_CATS[i + 1]; return n ? '<button class="btn" data-act="loveCat" data-id="' + n.id + '">다음 분류 · ' + n.name + I.arrow + "</button>" : ""; }

/* ---------------- CH06 thoughts (drill-down) ---------------- */
function stepThoughts() {
  const P = S.P, g = S.ui.thGroup, itId = S.ui.thItem, items = P.thoughts.items;
  if (itId) {
    const it = items.find((x) => x.id === itId); if (!it) { S.ui.thItem = null; return stepThoughts(); }
    const G = THOUGHT_GROUPS.find((x) => x.id === it.group); const sibs = items.filter((x) => x.group === it.group); const k = sibs.indexOf(it);
    const idx = items.indexOf(it);
    return '<div class="crumbs"><button data-act="thGroup" data-id="">마음속 주제</button><span class="sep">›</span><button data-act="thGroup" data-id="' + it.group + '">' + esc(G ? G.name : "") + '</button><span class="sep">›</span><b style="color:var(--ink)">' + esc(it.label) + "</b></div>" +
      '<div class="stack">' +
      (it.memo || (it.links || []).length ? '<div class="memo"><span class="yr">예전 메모' + (it.src ? " · " + esc(it.src) : "") + "</span>" + (it.memo ? esc(it.memo) : '<span class="muted" style="font-family:var(--f-sans);font-size:13px">연관어만 적혀 있어요</span>') + ((it.links || []).length ? '<div class="row" style="gap:5px;margin-top:10px">' + it.links.map((l) => '<span class="tag">' + esc(l) + "</span>").join("") + "</div>" : "") + "</div>" : "") +
      '<div class="field"><span class="flabel">지금 이 주제는</span><div class="seg3" role="group">' + TH_STATUS.map(([v, l]) => '<button class="' + (it.status === v ? "on" : "") + '" data-act="thStatus" data-v="' + v + '">' + l + "</button>").join("") + "</div></div>" +
      '<div class="field"><span class="flabel">마음을 차지하는 비중</span><div class="mini-seg">' + [[1, "가볍게"], [2, "자주"], [3, "크게"]].map(([v, l]) => '<button class="' + (it.weight === v ? "on" : "") + '" data-act="thWeight" data-v="' + v + '">' + l + "</button>").join("") + "</div></div>" +
      '<div class="field"><label for="thNow">지금의 생각</label><textarea class="input" id="thNow" rows="4" data-bind="P.thoughts.items.' + idx + '.now" placeholder="예전과 무엇이 같고 무엇이 달라졌나요?">' + esc(it.now || "") + "</textarea></div>" +
      '<div class="row" style="justify-content:space-between">' + (k > 0 ? '<button class="btn ghost" data-act="thItem" data-id="' + sibs[k - 1].id + '">' + I.back + esc(sibs[k - 1].label) + "</button>" : "<span></span>") + (k < sibs.length - 1 ? '<button class="btn" data-act="thItem" data-id="' + sibs[k + 1].id + '">' + esc(sibs[k + 1].label) + I.arrow + "</button>" : '<button class="btn" data-act="thGroup" data-id="">다른 그룹 보기' + I.arrow + "</button>") + "</div></div>";
  }
  if (!g) {
    return '<p class="muted" style="margin-bottom:14px">예전에 적어 둔 생각의 뿌리들이에요. 그룹에 들어가 하나씩 지금의 눈으로 다시 봐 주세요.</p><div class="tiles">' + THOUGHT_GROUPS.map((G, i) => {
      const xs = items.filter((x) => x.group === G.id); const rv = xs.filter((x) => x.status).length; const hv = xs.filter((x) => x.status === "heavy").length;
      return '<button class="tile" data-act="thGroup" data-id="' + G.id + '"><span class="bar" style="background:var(--c-thoughts);opacity:' + (xs.length ? 1 : 0.25) + '"></span><span class="ic">' + pad2(i + 1) + '</span><span class="nm">' + G.name + '</span><span class="ds">' + (xs.slice(0, 5).map((x) => esc(x.label)).join(" · ") || G.d) + '</span><span class="ct ' + (rv ? "has" : "") + '">주제 ' + xs.length + " · 검토 " + rv + (hv ? " · 무거움 " + hv : "") + "</span></button>";
    }).join("") + "</div>";
  }
  const G = THOUGHT_GROUPS.find((x) => x.id === g); const xs = items.filter((x) => x.group === g);
  return '<div class="crumbs"><button data-act="thGroup" data-id="">마음속 주제</button><span class="sep">›</span><b style="color:var(--ink)">' + G.name + "</b></div>" +
    '<div class="items">' + (xs.length ? xs.map((x) => '<button class="it" style="text-align:left;cursor:pointer" data-act="thItem" data-id="' + x.id + '"><span class="n">' + esc(x.label) + '</span><span>' + (x.status ? '<span class="tag' + (x.status === "heavy" ? " est" : "") + '">' + (TH_STATUS.find((s) => s[0] === x.status) || [0, ""])[1] + "</span>" : '<span class="tag">미검토</span>') + '</span><span class="w">' + esc(x.now ? "지금: " + cut(x.now, 80) : x.memo ? cut(x.memo, 80) : (x.links || []).join(" · ")) + "</span></button>").join("") : '<div class="empty">아직 주제가 없어요.</div>') + "</div>" +
    '<div class="adder" style="grid-template-columns:minmax(0,1fr) auto;margin-top:12px"><input class="input" id="newTh" placeholder="이 그룹에 새 주제 추가 (예: 몰입)"><button class="btn primary" data-act="thAdd">' + I.plus + "추가</button></div>";
}

/* ---------------- CH07 wants (drill-down) ---------------- */
function stepWants() {
  const P = S.P, t = S.ui.wantType, items = P.wants.items;
  if (!t) {
    return '<p class="muted" style="margin-bottom:14px">다섯 종류의 목적지예요. 들어가서 시기·중요도·상태를 확인해 주세요. 확인한 항목이 공정표의 미래 구간이 됩니다.</p><div class="tiles">' + WANT_TYPES.map((T) => {
      const xs = items.filter((w) => w.type === T.id); const rv = xs.filter((w) => w.rv).length;
      return '<button class="tile" data-act="wantType" data-id="' + T.id + '"><span class="bar" style="background:var(--c-wants);opacity:' + (xs.length ? 1 : 0.25) + '"></span><span class="ic" style="font-size:9px">' + T.en + '</span><span class="nm">' + T.name + '</span><span class="ds">' + (xs.sort((a, b) => (b.prio || 0) - (a.prio || 0)).slice(0, 3).map((w) => esc(cut(w.text, 18))).join(" · ") || T.d) + '</span><span class="ct ' + (rv ? "has" : "") + '">' + xs.length + "개 · 확인 " + rv + "</span></button>";
    }).join("") + "</div>";
  }
  const T = WT_BY[t];
  const xs = items.map((w, i) => ({ w, i })).filter((o) => o.w.type === t).sort((a, b) => (b.w.prio || 0) - (a.w.prio || 0));
  return '<div class="crumbs"><button data-act="wantType" data-id="">원하는 것</button><span class="sep">›</span><b style="color:var(--ink)">' + T.name + ' <span class="mono muted" style="font-size:11px">' + T.en + "</span></b></div>" +
    '<div class="items">' + (xs.length ? xs.map(({ w, i }) =>
      '<div class="want"><div><div class="n">' + esc(w.text) + (w.rv ? ' <span class="tag" style="margin-left:4px">확인</span>' : "") + '</div><input class="input" style="margin-top:6px;font-size:12.5px;padding:5px 9px" data-bind="P.wants.items.' + i + '.why" data-mark="rv:' + i + '" value="' + esc(w.why || "") + '" placeholder="왜 원하나요? (선택)"></div><div class="ops">' + srcTag(w.src) + '<button class="btn sm ghost" data-act="wantDel" data-i="' + i + '" aria-label="삭제">' + I.trash + "</button></div>" +
      '<div class="ctl"><span><span class="lab">시기</span><span class="mini-seg">' + HORIZONS.map(([v, l]) => '<button class="' + (w.horizon === v ? "on" : "") + '" data-act="wantSet" data-i="' + i + '" data-k="horizon" data-v="' + v + '">' + l + "</button>").join("") + '</span></span><span><span class="lab">중요도</span><span class="stars">' + [1, 2, 3].map((v) => '<button class="' + ((w.prio || 0) >= v ? "on" : "") + '" data-act="wantSet" data-i="' + i + '" data-k="prio" data-v="' + v + '" aria-label="중요도 ' + v + '">★</button>').join("") + '</span></span><span><span class="lab">상태</span><span class="mini-seg">' + W_STATUS.map(([v, l]) => '<button class="' + (w.status === v ? "on" : "") + '" data-act="wantSet" data-i="' + i + '" data-k="status" data-v="' + v + '">' + l + "</button>").join("") + "</span></span></div></div>").join("") : '<div class="empty">아직 없어요.</div>') + "</div>" +
    '<div class="adder" style="grid-template-columns:minmax(0,1fr) auto auto;margin-top:12px"><input class="input" id="newWant" placeholder="새 ' + T.name + ' 추가"><select class="input" id="newWantHz" style="width:auto">' + HORIZONS.map(([v, l]) => '<option value="' + v + '"' + (v === "3y" ? " selected" : "") + ">" + l + "</option>").join("") + '</select><button class="btn primary" data-act="wantAdd">' + I.plus + "추가</button></div>" +
    '<div class="row" style="justify-content:space-between;margin-top:12px"><button class="btn ghost" data-act="wantType" data-id="">' + I.back + '종류 목록</button><button class="btn" data-act="wantConfirmAll">이 목록 모두 확인</button></div>';
}

/* ---------------- CH08 timeline ---------------- */
function stepTimeline() {
  const P = S.P, ev = P.timeline.events;
  const order = ev.map((e, i) => ({ e, i })).sort((a, b) => (ym2num(a.e.s) ?? 9999) - (ym2num(b.e.s) ?? 9999));
  const missing = order.filter((o) => !o.e.s);
  const row = ({ e, i }) => '<div class="it" style="grid-template-columns:90px minmax(0,1fr) 108px 108px auto;align-items:center">' +
    '<select class="input" data-bind="P.timeline.events.' + i + '.lane" data-rerender="1" aria-label="구분">' + LANES.filter((l) => l.id !== "plan").map((l) => '<option value="' + l.id + '"' + (e.lane === l.id ? " selected" : "") + ">" + l.name + "</option>").join("") + "</select>" +
    '<input class="input" data-bind="P.timeline.events.' + i + '.label" value="' + esc(e.label) + '" aria-label="이름">' +
    '<input class="input mono" data-bind="P.timeline.events.' + i + '.s" data-ym="1" data-rerender="1" value="' + esc(e.s || "") + '" placeholder="YYYY-MM" aria-label="시작">' +
    '<input class="input mono" data-bind="P.timeline.events.' + i + '.e" data-ym="1" data-rerender="1" value="' + esc(e.e || "") + '" placeholder="끝 (기간이면)" aria-label="끝">' +
    '<div class="ops">' + (e.est ? '<button class="btn sm" data-act="evOk" data-i="' + i + '" title="추정을 확정으로">맞아요</button>' : '<span class="tag" style="background:transparent">확정</span>') + '<button class="btn sm ghost" data-act="evDel" data-i="' + i + '" aria-label="삭제">' + I.trash + "</button></div>" +
    (e.est || e.note || e.src ? '<div class="w">' + (e.est ? '<span class="tag est">추정</span> ' : "") + esc(e.note || "") + (e.src ? ' <span class="src">· ' + esc(e.src) + "</span>" : "") + "</div>" : "") + "</div>";
  return '<p class="muted" style="margin-bottom:12px">연도는 <span class="mono">2017</span> 또는 <span class="mono">2017-05</span>처럼 적어 주세요. 끝을 적으면 기간(막대), 비우면 이정표(◆)가 됩니다. 원하는 것(CH.07)의 시기는 자동으로 미래 구간에 들어가요.</p>' +
    (missing.length ? '<div class="banner" style="margin-bottom:12px">연도가 비어 있는 이정표가 ' + missing.length + '개 있어요: ' + missing.map((o) => "<b>" + esc(o.e.label) + "</b>").join(", ") + "</div>" : "") +
    '<div style="overflow-x:auto"><div class="items" style="min-width:640px">' + order.map(row).join("") + "</div></div>" +
    '<div class="adder" style="grid-template-columns:90px minmax(0,1fr) 108px 108px auto;margin-top:12px;overflow-x:auto"><select class="input" id="evLane">' + LANES.filter((l) => l.id !== "plan").map((l) => '<option value="' + l.id + '">' + l.name + "</option>").join("") + '</select><input class="input" id="evLabel" placeholder="새 이정표 (예: 입사)"><input class="input mono" id="evS" placeholder="YYYY-MM"><input class="input mono" id="evE" placeholder="끝 (선택)"><button class="btn primary" data-act="evAdd">' + I.plus + "추가</button></div>";
}

/* ---------------- results ---------------- */
function insightBox(id) {
  const ins = S.AI.insights[id], busy = S.ui.busy["ins_" + id];
  let inner;
  if (busy) inner = '<div class="typing"><span class="spinner"></span>Claude가 이 챕터를 읽고 있어요. 30초~1분 정도 걸려요.</div>';
  else if (ins) inner = '<div class="body">' + esc(ins.insight) + "</div>" + (ins.question ? '<div class="q">' + esc(ins.question) + "</div>" : "") + '<div class="row" style="justify-content:space-between"><span class="mono muted" style="font-size:10.5px">' + fmtDot(ins.at) + " · REV." + pad2(ins.rev || 0) + "</span>" + (aiAvailable() ? '<button class="btn sm ghost" data-act="insight" data-id="' + id + '">다시 해석</button>' : "") + "</div>";
  else if (aiAvailable()) inner = '<p style="font-size:13.5px;color:var(--ink-2)">이 결과를 다른 챕터와 메모에 비추어 해석하고, 스스로 던져 볼 질문을 하나 만들어 드려요.</p><div><button class="btn accent" data-act="insight" data-id="' + id + '">' + I.spark + "Claude의 해석 받기</button></div>";
  else inner = '<p class="muted" style="font-size:13px">' + (S.aiOff ? esc(aiErrMsg({ code: S.aiOff })) : "이 화면에서는 Claude 연결을 쓸 수 없어요. Claude 앱에서 열면 해석을 받을 수 있어요.") + "</p>";
  return '<div class="insight"><div class="h">' + I.spark.replace("<svg", '<svg width="15" height="15"') + "Claude의 해석</div>" + inner + "</div>";
}
function chapterResult(id) {
  const P = S.P; let h = "";
  switch (id) {
    case "basics": {
      const b = P.basics, age = b.birthYear ? new Date().getFullYear() - b.birthYear : null;
      const rows = [["이름", b.name, "NAME"], ["호칭", b.nick, "CALL SIGN"], ["출생년도", b.birthYear ? b.birthYear + (age ? " (만 " + (age - 1) + "~" + age + "세)" : "") + (b.birthEst ? " · 추정" : "") : "", "BUILT"], ["사는 곳", b.region, "PORT"], ["하는 일", b.job, "CLASS"], ["가족", b.family, "CREW"], ["일의 이력", b.career, "SERVICE"], ["한 문장 소개", b.intro, "REMARKS"]];
      h = '<div class="res-grid"><div><div class="eyebrow" style="margin-bottom:10px">Principal particulars · 제원표</div><table style="width:100%;border-collapse:collapse;font-size:13.5px">' + rows.map(([k, v, e]) => '<tr><td style="padding:9px 10px 9px 0;border-bottom:1px solid var(--rule-2);width:120px;vertical-align:top"><div style="font-weight:600">' + k + '</div><div class="mono muted" style="font-size:9.5px;letter-spacing:.1em">' + e + '</div></td><td style="padding:9px 0;border-bottom:1px solid var(--rule-2)">' + (v ? esc(v) : '<span class="muted">—</span>') + "</td></tr>").join("") + "</table></div>" +
        '<div class="stack"><div class="qhint"><b>다음</b><span>이제 ' + (P.basics.confirmed ? "" : "위 내용을 확인하고 ") + '지금의 상태를 점검합니다. CH.01은 삶의 여덟 영역을 두 번씩 매기는 5분짜리 점검이에요.</span></div>' + (b.confirmed ? "" : '<button class="btn primary" data-act="basicsConfirm">이 내용이 맞아요</button>') + "</div></div>";
      break;
    }
    case "wheel": {
      const ws = wheelStats(P);
      const focus = ws.filter((w) => w.gap != null && w.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 3);
      const strong = ws.filter((w) => w.sat != null && w.sat >= 7).sort((a, b) => b.sat - a.sat).slice(0, 3);
      h = '<div class="res-grid"><div>' + radarSVG(ws.map((w) => ({ label: w.name, sub: w.sat != null ? w.sat + "/10" : "" })), [{ name: "중요도×2", color: "var(--c-loves)", vals: ws.map((w) => (w.imp != null ? w.imp * 2 : null)) }, { name: "만족도", color: "var(--c-values)", vals: ws.map((w) => w.sat) }], { size: 340, aria: "라이프 휠" }) +
        '<div class="legend" style="justify-content:center"><span><i class="ln" style="background:var(--c-values)"></i>만족도</span><span><i class="ln" style="background:var(--c-loves)"></i>중요도(×2)</span></div></div>' +
        '<div class="stack"><div><div class="col-h"><i class="dot" style="background:var(--signal)"></i>지금 손봐야 할 곳</div>' + (focus.length ? '<ol style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px">' + focus.map((w) => "<li><b>" + w.name + "</b> — 중요도 " + w.imp + "/5인데 만족도는 " + w.sat + "/10" + (w.note ? '<div class="muted" style="font-size:12.5px">' + esc(w.note) + "</div>" : "") + "</li>").join("") + "</ol>" : '<p class="muted">중요도보다 만족도가 낮은 영역이 없어요.</p>') + "</div>" +
        (strong.length ? '<div><div class="col-h"><i class="dot" style="background:var(--good)"></i>잘 채워진 곳</div><p style="font-size:13.5px">' + strong.map((w) => w.name + " " + w.sat).join(" · ") + "</p></div>" : "") +
        insightBox("wheel") + "</div></div>" + '<div style="margin-top:20px">' + wheelDumbbell(ws) + "</div>";
      break;
    }
    case "ipip": {
      const tr = ipipScores(P);
      h = '<div class="res-grid"><div><div class="eyebrow" style="margin-bottom:6px">5요인 점수 (1~5, 가운데 선 = 3)</div>' + traitRows(tr, true) + '<p class="muted" style="font-size:11.5px;margin-top:10px">Mini-IPIP 20문항 간이 척도예요. 진단이 아니라 자기 탐색을 위한 참고 자료입니다.</p></div><div class="stack">' + comboNotes(tr) + insightBox("ipip") + "</div></div>";
      break;
    }
    case "values": {
      const vs = valueScores(P); const top = vs.filter((v) => v.n).slice(0, 3); const prior = (P.prior && P.prior.valuesTop3) || [];
      const same = top.filter((v) => prior.includes(v.id)).map((v) => VAL_BY[v.id].name);
      h = '<div class="res-grid"><div><div class="eyebrow" style="margin-bottom:10px">선택으로 드러난 가치 순위 (이긴 횟수 / 등장 횟수)</div>' + valueRows(vs) + '</div><div class="stack">' +
        '<div class="grid3" style="grid-template-columns:repeat(3,1fr)">' + top.map((v, i) => '<div class="sheet" style="padding:12px"><div class="mono muted" style="font-size:10.5px">TOP ' + (i + 1) + '</div><div style="font-weight:700;font-size:16px;margin:2px 0">' + VAL_BY[v.id].name + '</div><div style="font-size:12px;color:var(--ink-2)">' + VAL_BY[v.id].d + "</div></div>").join("") + "</div>" +
        (prior.length ? '<div class="qhint"><b>비교</b><span>직접 고른 Top 3: ' + prior.map((id) => VAL_BY[id]?.name).join(" · ") + ". 선택으로 드러난 Top 3: " + top.map((v) => VAL_BY[v.id].name).join(" · ") + ". " + (same.length ? "겹치는 것: " + same.join(", ") + "." : "겹치는 게 없어요. 머리로 중요하다고 여기는 것과 실제로 고르는 것이 다를 수 있어요.") + "</span></div>" : "") +
        insightBox("values") + "</div></div>";
      break;
    }
    case "energy": {
      const el = energyLists(P), dt = discTally(P), cr = chrono(P);
      h = '<div class="res-grid"><div class="stack"><div class="cols2"><div><div class="col-h"><i class="dot" style="background:var(--c-energy)"></i>충전 ' + el.c.length + '</div><ul class="list-plain">' + (el.c.map((a) => "<li>" + esc(a.t) + "</li>").join("") || '<li class="muted">없음</li>') + '</ul></div><div><div class="col-h"><i class="dot" style="background:var(--crit)"></i>방전 ' + el.d.length + '</div><ul class="list-plain">' + (el.d.map((a) => "<li>" + esc(a.t) + "</li>").join("") || '<li class="muted">없음</li>') + "</ul></div></div>" +
        (P.energy.flowRecent || P.energy.flowLast || P.energy.flowChild ? '<div><div class="col-h">몰입의 흔적</div><div style="font-size:13.5px;display:flex;flex-direction:column;gap:6px">' + [["최근", P.energy.flowRecent], ["마지막", P.energy.flowLast], ["어릴 때", P.energy.flowChild]].filter((x) => x[1]).map((x) => '<div><span class="tag">' + x[0] + "</span> " + esc(x[1]) + "</div>").join("") + "</div></div>" : "") +
        "</div><div class=\"stack\">" + quadSVG(dt, 260) + '<div style="font-size:13.5px">' + (dt.n ? "<b>" + dt.top.map((k) => k + " " + DISC[k].name).join(" · ") + "</b> — " + dt.top.map((k) => DISC[k].d).join(" ") : "") + (cr ? '<div style="margin-top:6px"><span class="tag">하루 리듬</span> <b>' + cr.label + "</b></div>" : "") + "</div>" + insightBox("energy") + "</div></div>";
      break;
    }
    case "loves": {
      h = '<div class="res-grid"><div class="stack">' + LOVE_CATS.map((c) => { const x = P.loves.cats[c.id]; return x.items.length || x.subs.length ? '<div><div class="col-h"><i class="dot" style="background:var(--c-loves)"></i>' + c.name + '</div><div class="pt-tags">' + x.items.map((i) => '<span title="' + esc(i.why || "") + '">' + esc(i.name) + "</span>").join("") + x.subs.filter((s) => !x.items.some((i) => i.name.includes(s))).map((s) => '<span style="background:transparent;color:var(--ink-3)">' + esc(s) + "</span>").join("") + "</div></div>" : ""; }).join("") +
        '</div><div class="stack"><div><div class="col-h">좋아하는 이유들</div><ul class="list-plain">' + (allLoveItems(P).filter((i) => i.why).slice(0, 10).map((i) => "<li><b style=\"min-width:110px\">" + esc(i.name) + "</b><span class=\"muted\">" + esc(cut(i.why, 70)) + "</span></li>").join("") || '<li class="muted">이유를 적으면 여기에 모여요.</li>') + "</ul></div>" + insightBox("loves") + "</div></div>";
      break;
    }
    case "thoughts": {
      const it = P.thoughts.items; const col = (k, name, color) => { const xs = it.filter((x) => x.status === k).sort((a, b) => (b.weight || 0) - (a.weight || 0)); return '<div><div class="col-h"><i class="dot" style="background:' + color + '"></i>' + name + " " + xs.length + '</div><div class="pt-tags">' + (xs.map((x) => "<span>" + esc(x.label) + (x.weight ? " " + "●".repeat(x.weight) : "") + "</span>").join("") || '<span class="muted" style="border:0;background:none">없음</span>') + "</div></div>"; };
      const un = it.filter((x) => !x.status).length;
      h = '<div class="res-grid"><div class="stack">' + col("heavy", "여전히 무겁다", "var(--signal)") + col("changed", "생각이 바뀌었다", "var(--c-values)") + col("dropped", "내려놓았다", "var(--ink-4)") + (un ? '<p class="muted" style="font-size:12.5px">아직 검토하지 않은 주제 ' + un + "개</p>" : "") + '</div><div class="stack">' + insightBox("thoughts") + "</div></div>";
      break;
    }
    case "wants": {
      const W = P.wants.items; const hz = HORIZONS.map((x) => x[0]);
      const cell = (t, z) => W.filter((w) => w.type === t && w.horizon === z).length;
      const max = Math.max(1, ...WANT_TYPES.flatMap((t) => hz.map((z) => cell(t.id, z))));
      const grid = '<div class="hm" style="grid-template-columns:110px repeat(' + hz.length + ',1fr)"><div></div>' + HORIZONS.map((x) => '<div class="hd">' + x[1] + "</div>").join("") + WANT_TYPES.map((t) => '<div class="rh">' + t.name + "</div>" + hz.map((z) => { const n = cell(t.id, z); return '<div class="cell" style="background:' + (n ? "color-mix(in srgb, var(--c-wants) " + Math.round(18 + (n / max) * 70) + "%, var(--sheet))" : "var(--sheet-2)") + ";color:" + (n / max > 0.6 ? "#fff" : "var(--ink)") + '" title="' + t.name + " · " + (HZ_BY[z][1]) + " " + n + '개">' + (n || "") + "</div>"; }).join("")).join("") + "</div>";
      const top = W.slice().sort((a, b) => (b.prio || 0) - (a.prio || 0) || (HZ_BY[a.horizon]?.[2] || 99) - (HZ_BY[b.horizon]?.[2] || 99)).slice(0, 7);
      h = '<div class="res-grid"><div class="stack"><div class="eyebrow">종류 × 시기</div>' + grid + '</div><div class="stack"><div><div class="col-h">가장 중요한 것</div><ul class="list-plain">' + top.map((w) => '<li><span class="tag" style="min-width:48px;justify-content:center">' + WT_BY[w.type].en + '</span><span style="flex:1">' + esc(w.text) + '</span><span class="mono muted" style="font-size:11px">' + (HZ_BY[w.horizon]?.[1] || "") + " ★" + (w.prio || 1) + "</span></li>").join("") + "</ul></div>" + insightBox("wants") + "</div></div>";
      break;
    }
    case "timeline": {
      h = '<div class="stack">' + ganttSVG(P, { compact: true }) + '<div class="row" style="justify-content:space-between"><span class="muted" style="font-size:12.5px">전체 공정표는 도면 LD-03에서 확대·편집할 수 있어요.</span><button class="btn" data-act="go" data-view="gantt">인생 공정표 열기' + I.arrow + "</button></div>" + insightBox("timeline") + "</div>";
      break;
    }
  }
  return '<div class="result">' + h + "</div>";
}
function comboNotes(tr) {
  const L = {}; TRAIT_ORDER.forEach((k) => (L[k] = lvl(tr[k].score)));
  const notes = [];
  if (L.C === "hi" && L.N === "lo") notes.push("계획대로 해내면서 흔들림도 적은 조합. 맡기면 끝까지 가는 사람으로 보이기 쉬워요.");
  if (L.C === "hi" && L.N === "hi") notes.push("기준이 높고 걱정도 많은 조합. 완성도를 끌어올리지만 스스로를 소진시키기 쉬워요.");
  if (L.O === "hi" && L.C === "lo") notes.push("아이디어는 많고 마무리는 힘든 조합. 떠오른 것을 붙잡아 둘 구조가 도움이 돼요.");
  if (L.O === "hi" && L.C === "hi") notes.push("상상한 것을 실제로 만들어 내는 조합. 설계자형에 가까워요.");
  if (L.E === "lo" && L.A === "hi") notes.push("조용하지만 사람을 세심하게 살피는 조합. 소수와의 깊은 관계에서 힘을 얻어요.");
  if (L.E === "hi" && L.A === "lo") notes.push("앞에 나서서 밀어붙이는 조합. 추진력은 크지만 주변의 감정을 놓칠 수 있어요.");
  if (L.E === "lo" && L.O === "hi") notes.push("혼자 깊이 파고드는 탐구자 조합. 회의보다 생각할 시간이 필요해요.");
  if (!notes.length) notes.push("어느 한쪽으로 크게 치우치지 않은 편이에요. 상황에 맞춰 모드를 바꾸는 유연함이 강점일 수 있어요.");
  return '<div><div class="col-h">조합으로 보면</div><ul class="list-plain">' + notes.map((n) => "<li>" + esc(n) + "</li>").join("") + "</ul></div>";
}
