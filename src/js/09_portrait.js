/* ============================================================ MAPS common + I PORTRAIT */
const DWGS = [["portrait", "I", "자기 초상"], ["map", "II", "관계 지도"], ["gantt", "III", "인생 연표"], ["metrics", "IV", "지표"]];
function drawingHead(active, lede) {
  const d = DWGS.find((x) => x[0] === active);
  return '<div class="page-head"><div><div class="eyebrow">Plate ' + d[1] + " · 지도" + "</div><h1>" + d[2] + '</h1><p class="lede">' + lede + "</p></div></div>" +
    '<nav class="dwg-tabs" aria-label="지도">' + DWGS.map(([v, no, n]) => '<a href="#' + v + '" class="' + (v === active ? "on" : "") + '" data-act="go" data-view="' + v + '"><span class="mono">' + no + "</span>" + n + "</a>").join("") + "</nav>";
}
function drawingFoot(no, title, rev, date, drawn) {
  return '<div class="dwg-foot">' + titleBlock([["도판", no], ["제목", esc(title)], ["판", rev], ["날짜", date], ["작성", esc(drawn)]]) + "</div>";
}
function sinceCount(iso) {
  if (!iso) return 0; const t = String(iso);
  const P = S.P;
  return P.ledger.filter((f) => String(f.at) > t).length + S.LOG.items.filter((r) => String(r.at) > t).length + P.wants.items.filter((w) => w.src === "AI 인터뷰").length * 0;
}

function viewPortrait() {
  const P = S.P, pr = S.AI.portrait, busy = S.ui.busy.portrait, pct = overall(P);
  const b = P.basics;
  const tr = ipipScores(P), vs = valueScores(P).filter((v) => v.n), el = energyLists(P), ws = wheelStats(P);
  const hasTr = TRAIT_ORDER.some((k) => tr[k].n);
  const topWants = P.wants.items.slice().sort((a, c) => (c.prio || 0) - (a.prio || 0) || (HZ_BY[a.horizon]?.[2] || 99) - (HZ_BY[c.horizon]?.[2] || 99)).slice(0, 5);

  let bar = '<div class="dwg-bar">';
  if (busy) bar += '<span class="typing"><span class="spinner"></span>Claude가 프로필 전체를 읽고 초상을 그리는 중이에요. 1~2분 걸릴 수 있어요.</span>';
  else if (aiAvailable()) bar += '<button class="btn ' + (pr ? "" : "accent") + '" data-act="drawPortrait">' + I.spark + (pr ? "다시 그리기" : "초상 그리기") + "</button>";
  else bar += '<span class="muted" style="font-size:12.5px">' + esc(S.aiOff ? aiErrMsg({ code: S.aiOff }) : "Claude 연결이 있는 화면에서 초상을 그릴 수 있어요.") + "</span>";
  const since = pr ? sinceCount(pr.at) : 0;
  if (pr && since) bar += '<span class="tag est">초상 이후 새로 쌓인 기록·사실 ' + since + "개</span>";
  bar += '<span class="muted" style="font-size:12px;margin-left:auto">지도 완성도 ' + pct + "% · 채울수록 정확해져요</span></div>";

  const headName = '<div class="pt-name">' + esc(b.name || "이름 없음") + (b.birthYear ? " · " + b.birthYear : "") + (b.region ? " · " + esc(b.region) : "") + (b.job ? " · " + esc(b.job) : "") + "</div>";
  const head = pr ? '<div class="pt-head">' + headName + '<div class="pt-arche">' + esc(pr.archetype) + '</div><div class="pt-line">' + esc(pr.headline || "") + "</div></div>"
    : '<div class="pt-head">' + headName + '<div class="pt-arche" style="color:var(--ink-4)">아직 이름 붙지 않은 초상</div><div class="pt-line">지금까지 쌓인 응답으로 뼈대만 그렸어요. "초상 그리기"를 누르면 Claude가 전체를 읽고 한 문장과 이름을 붙입니다.</div></div>';
  const sec = (t, body) => '<section class="pt-sec"><h5>' + t + "</h5>" + body + "</section>";
  const list = (xs, cls) => '<ul class="pt-list ' + (cls || "") + '">' + xs.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>";

  let left = "";
  if (pr) {
    left += sec("ESSENCE · 본질", '<p class="pt-essence">' + esc(pr.essence || "") + "</p>");
    if ((pr.strengths || []).length) left += sec("STRENGTHS · 강점", list(pr.strengths));
    if ((pr.shadows || []).length) left += sec("WATCH · 주의할 패턴", list(pr.shadows, "shadow"));
    if ((pr.drives || []).length) left += sec("DRIVES · 나를 움직이는 것", '<div class="pt-tags">' + pr.drives.map((x) => "<span>" + esc(x) + "</span>").join("") + "</div>");
    if (pr.nowFocus) left += sec("NOW · 지금 돌봐야 할 것", '<p style="font-size:15px;line-height:1.7">' + esc(pr.nowFocus) + "</p>");
    if (pr.question) left += '<div class="pt-q" style="margin-top:8px">' + esc(pr.question) + "</div>";
    if (pr.gaps) left += '<p class="muted" style="font-size:12px">근거가 약한 부분 · ' + esc(pr.gaps) + "</p>";
  } else {
    left += sec("ESSENCE · 본질", '<p class="muted">초상을 그리면 성격·가치·에너지·원하는 것이 어떻게 맞물리는지 서너 문장으로 정리돼요.</p>');
    const facts = P.ledger.filter((f) => f.cat === "mind").slice(0, 4).map(entryText);
    if (facts.length) left += sec("SELF-NOTES · 스스로 적은 나", list(facts));
    const heavy = P.tree.nodes.filter((x) => x.status === "heavy").map((x) => x.label);
    if (heavy.length) left += sec("CARGO · 마음을 차지하는 주제", '<div class="pt-tags">' + heavy.map((x) => "<span>" + esc(x) + "</span>").join("") + "</div>");
  }
  let right = "";
  right += sec("TRAITS · 성격", hasTr ? traitRows(tr, false) : '<p class="muted" style="font-size:13px">CH.02를 마치면 채워져요.</p>');
  right += sec("VALUES · 가치 순위", vs.length ? '<div class="vrank">' + vs.slice(0, 5).map((v, i) => '<div class="vrow' + (i < 3 ? " top" : "") + '"><span class="i">' + pad2(i + 1) + '</span><span class="nm">' + VAL_BY[v.id].name + '</span><span class="b"><i style="width:' + v.score * 100 + '%"></i></span><span class="v">' + v.wins + "/" + v.n + "</span></div>").join("") + "</div>"
    : P.prior && P.prior.valuesTop3 ? '<div class="pt-tags">' + P.prior.valuesTop3.map((id) => "<span>" + VAL_BY[id]?.name + "</span>").join("") + '</div><p class="muted" style="font-size:12px">직접 고른 Top 3 · CH.03을 마치면 순위가 생겨요</p>' : '<p class="muted" style="font-size:13px">CH.03을 마치면 채워져요.</p>');
  right += sec("ENERGY · 충전과 방전", el.c.length || el.d.length ? '<div class="pt-ener"><div><b><i class="dot" style="background:var(--c-energy)"></i>충전</b>' + (el.c.slice(0, 5).map((a) => esc(a.t)).join("<br>") || "-") + '</div><div><b><i class="dot" style="background:var(--crit)"></i>방전</b>' + (el.d.slice(0, 5).map((a) => esc(a.t)).join("<br>") || "-") + "</div></div>" : '<p class="muted" style="font-size:13px">CH.04를 마치면 채워져요.</p>');
  const dna = pr && (pr.tasteDNA || []).length ? pr.tasteDNA : [];
  right += sec("TASTE · 취향", (dna.length ? '<div class="pt-tags" style="margin-bottom:8px">' + dna.map((x) => '<span style="background:var(--sheet);border-color:var(--ink-4);font-weight:600">' + esc(x) + "</span>").join("") + "</div>" : "") + '<div class="pt-tags">' + allLoveItems(P).filter((i) => i.why).slice(0, 10).map((i) => "<span>" + esc(i.name) + "</span>").join("") + "</div>");
  right += sec("BALANCE · 지금의 균형", ws.some((w) => w.sat != null) ? radarSVG(ws.map((w) => ({ label: w.name })), [{ name: "만족도", color: "var(--c-values)", vals: ws.map((w) => w.sat) }], { size: 250, pad: 40, fs: 11 }) : '<p class="muted" style="font-size:13px">CH.01을 마치면 채워져요.</p>');
  right += sec("HEADING · 원하는 것", '<ul class="pt-list">' + topWants.map((w) => "<li><span><b>" + esc(w.text) + '</b> <span class="muted" style="font-size:12px">' + WT_BY[w.type].en + " · " + (HZ_BY[w.horizon]?.[1] || "") + "</span></span></li>").join("") + "</ul>");

  return drawingHead("portrait", "한 사람을 한 장으로. 응답과 기록 전체를 Claude가 읽고 이름과 문장을 붙입니다. 아래의 수치와 목록은 당신의 응답에서 바로 계산돼요.") + bar +
    '<article class="drawing"><div class="pt">' + head + '<div class="stack" style="gap:22px">' + left + '</div><div class="stack" style="gap:22px">' + right + "</div></div>" +
    drawingFoot("I", "자기 초상", pr ? (pr.rev || 0) + "판" : "—", pr ? fmtDot(pr.at) : fmtDot(nowISO()), pr ? "Claude" : "자동 계산") + "</article>";
}
