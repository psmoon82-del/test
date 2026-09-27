/* ============================================================ OVERVIEW · 개요 */
/* plate caption: a quiet legend row under each map */
function titleBlock(cells) {
  return '<dl class="tblock">' + cells.map(([k, v]) => "<div><dt>" + esc(k) + "</dt><dd>" + v + "</dd></div>").join("") + "</dl>";
}

/* coverage chart: one ring sector per ledger category, contour lines filled by how much is recorded */
function coverageSVG(P) {
  const cats = LEDGER_CATS.filter((c) => c.id !== "etc");
  const W = 300, c0 = W / 2, R1 = 58, R2 = 132, n = cats.length, gap = 0.035;
  const arc = (r0, r1, a0, a1) => { const p = (r, a) => (c0 + Math.cos(a) * r).toFixed(1) + " " + (c0 + Math.sin(a) * r).toFixed(1); const lg = a1 - a0 > Math.PI ? 1 : 0; return "M" + p(r0, a0) + " L" + p(r1, a0) + " A" + r1 + " " + r1 + " 0 " + lg + " 1 " + p(r1, a1) + " L" + p(r0, a1) + " A" + r0 + " " + r0 + " 0 " + lg + " 0 " + p(r0, a0) + "Z"; };
  let g = "";
  [0.25, 0.5, 0.75, 1].forEach((f) => { g += '<circle cx="' + c0 + '" cy="' + c0 + '" r="' + (R1 + (R2 - R1) * f).toFixed(1) + '" style="fill:none;stroke:var(--rule);stroke-width:1"/>'; });
  cats.forEach((c, i) => {
    const a0 = -Math.PI / 2 + (i / n) * Math.PI * 2 + gap, a1 = -Math.PI / 2 + ((i + 1) / n) * Math.PI * 2 - gap;
    const cnt = catCount(P, c.id), lv = cnt ? Math.min(1, 0.25 + Math.log2(1 + cnt) / 6) : 0;
    g += '<path d="' + arc(R1, R2, a0, a1) + '" style="fill:var(--sheet-2);stroke:none"/>';
    if (lv) g += '<path d="' + arc(R1, R1 + (R2 - R1) * lv, a0, a1) + '" style="fill:var(--accent);fill-opacity:' + (0.35 + lv * 0.55).toFixed(2) + '"><title>' + esc(c.name + " " + cnt + "개") + "</title></path>";
    const am = (a0 + a1) / 2, lx = c0 + Math.cos(am) * (R2 + 12), ly = c0 + Math.sin(am) * (R2 + 12);
    g += '<text x="' + lx.toFixed(1) + '" y="' + (ly + 3.5).toFixed(1) + '" text-anchor="' + (Math.abs(Math.cos(am)) < 0.3 ? "middle" : Math.cos(am) > 0 ? "start" : "end") + '" class="cov-l' + (cnt ? "" : " empty") + '">' + esc(c.name.split("·")[0]) + "</text>";
  });
  const pct = overall(P);
  g += '<text x="' + c0 + '" y="' + (c0 + 6) + '" text-anchor="middle" class="cov-n">' + pct + '</text><text x="' + c0 + '" y="' + (c0 + 24) + '" text-anchor="middle" class="cov-u">% 완성</text>';
  return '<svg viewBox="-40 -14 ' + (W + 80) + " " + (W + 28) + '" width="100%" style="max-width:380px;display:block;margin:0 auto" role="img" aria-label="Records 분류별 기록량과 완성도 ' + pct + '%">' + g + "</svg>";
}

function nudgeCard() {
  const N = S.NUDGE; if (!N || !Array.isArray(N.questions)) return "";
  const open = N.questions.map((q, i) => ({ q, i })).filter((o) => !o.q.done && !o.q.skip);
  if (!open.length) return "";
  return '<section class="sheet pad nudge"><div class="row" style="justify-content:space-between"><div><div class="eyebrow">This week · 이번 주 질문</div><h3>' + open.length + '개만 답해 주세요</h3></div><span class="mono muted" style="font-size:11px">' + esc(fmtDot(N.at)) + "</span></div>" +
    open.map(({ q, i }) => '<div class="nq"><div class="nq-q"><span class="tag">' + esc(CAT_BY[q.cat]?.name || "기타") + "</span> " + esc(q.q) + "</div>" + (q.hint ? '<div class="muted" style="font-size:12px">' + esc(q.hint) + "</div>" : "") +
      '<div class="row" style="flex-wrap:nowrap;align-items:flex-end"><textarea class="input" id="nq_' + i + '" rows="2" placeholder="짧게 적어도 충분해요"></textarea><span class="stack" style="gap:4px"><button class="btn primary sm" data-act="nudgeAnswer" data-i="' + i + '">저장</button><button class="btn ghost sm" data-act="nudgeSkip" data-i="' + i + '">건너뛰기</button></span></div></div>').join("") + "</section>";
}

function viewHome() {
  const P = S.P, pct = overall(P), na = nextAction(P);
  const b = P.basics, name = b.nick || b.name || "나";
  const doneN = CH.filter((c) => P.done[c.id]).length;
  const pr = S.AI.portrait;
  const stale = P.ledger.filter(isStale).length;

  let banners = "";
  if (S.mode === "local") banners += '<div class="banner" style="margin-bottom:14px"><b>이 브라우저에만 저장돼요</b><span>claude.ai 밖에서 열려 Claude 저장소에 연결되지 않았어요. 다른 기기에서는 보이지 않아요.</span></div>';
  else if (S.mode !== "cloud") banners += '<div class="banner" style="margin-bottom:14px"><b>저장되지 않아요</b><span>이 화면에서는 저장소에 연결되지 않았어요. 연결 상태를 확인해 주세요.</span></div>';
  if (P.meta.migration && !P.meta.migration.reviewed) banners += '<div class="banner info" style="margin-bottom:14px;align-items:center"><span style="flex:1"><b>새 구조로 옮겼어요.</b> 예전에 알게 된 사실 ' + P.meta.migration.facts + "개를 Records로, 마음속 주제를 생각 나무(" + P.meta.migration.nodes + '개 가지·주제)로 옮겼어요. 분류가 맞는지 한 번 확인해 주세요.</span><button class="btn sm primary" data-act="go" data-view="review">확인하기</button></div>';
  const tm = P.meta.treeMove;
  if (tm && !tm.reviewed && !(P.meta.migration && !P.meta.migration.reviewed)) banners += '<div class="banner info" style="margin-bottom:14px;align-items:center"><span style="flex:1"><b>생각 나무를 표준 가지로 정리했어요.</b> 주제 ' + tm.moves.length + '개를 라이프 휠 여덟 영역과 "의미·나 자신" 아래로 옮겼어요. 주제·메모·연관어는 그대로예요.</span><button class="btn sm primary" data-act="go" data-view="review">확인하기</button></div>';
  if (S.firstRun && S.seeded && !P.dismissSeedNote) banners += '<div class="banner info" style="margin-bottom:14px;align-items:center"><span style="flex:1"><b>기존 기록으로 미리 채워 두었어요.</b> 좋아하는 것 ' + allLoveItems(P).length + "개, 생각 나무 " + P.tree.nodes.length + "개, 원하는 것 " + P.wants.items.length + "개, 기록 " + S.LOG.items.length + '건을 옮겼어요. 추정한 연도에는 <span class="tag est">추정</span> 표시가 있어요.</span><button class="btn sm ghost" data-act="dismissSeed">닫기</button></div>';

  const recent = S.LOG.items.slice().sort((a, c) => String(c.date).localeCompare(String(a.date)) || String(c.at).localeCompare(String(a.at))).slice(0, 4);
  const recFacts = P.ledger.slice().sort((a, c) => String(c.at).localeCompare(String(a.at))).slice(0, 5);
  const chRows = CH.map((c) => { const st = chState(P, c.id), p = P.done[c.id] ? 100 : chProgress(P, c.id);
    return '<button class="chrow ' + st + '" data-act="openCh" data-id="' + c.id + '"><span class="mono">' + c.code + '</span><span class="nm">' + esc(c.name) + '</span><span class="bar"><i style="width:' + p + '%"></i></span><span class="mono v">' + (st === "done" ? "완료" : p + "%") + "</span></button>"; }).join("");

  return '<div class="page-head"><div><div class="eyebrow">Atlas</div><h1>' + esc(name) + '</h1><p class="lede">나에 대한 모든 것을 분류해 쌓고, 필요할 때 용도별로 꺼내 쓰는 곳. 채울수록 AI가 나를 더 정확히 도와요.</p></div>' +
    titleBlock([["판", revStr()], ["고친 날", fmtDot(P.updatedAt)], ["Records", P.ledger.length + "항목"], ["탐구", doneN + "/9장"]]) + "</div>" +
    banners +
    '<section class="hero sheet"><div class="hero-l">' + coverageSVG(P) + '<p class="muted" style="font-size:12px;text-align:center">둘레 칸은 Records 분류, 칠해진 깊이는 기록한 양이에요.</p></div>' +
      '<div class="hero-r"><div class="next-card"><div><div class="eyebrow" style="color:var(--accent)">다음에 할 일</div><div class="t">' + esc(na.label) + '</div><div class="d">' + esc(na.desc) + '</div></div><button class="btn accent" data-act="' + (na.kind === "ch" ? "openCh" : "go") + '" data-id="' + (na.ch ? na.ch.id : "") + '" data-view="' + na.kind + '">' + (na.kind === "ch" ? "열기" : "이동") + I.arrow + "</button></div>" +
      (pr ? '<div class="arche-box"><div class="eyebrow">지금의 초상 · ' + ((pr.rev || 0)) + '판</div><div class="archetype">' + esc(pr.archetype) + '</div><div class="archetype-sub">' + esc(pr.headline || "") + "</div></div>" : "") +
      '<div class="quick"><button class="btn" data-act="go" data-view="ledger">' + I.ledger + 'Records에 적기</button><button class="btn" data-act="go" data-view="log">' + I.log + '기록 남기기</button><button class="btn" data-act="go" data-view="export">' + I.pack + "Pack 꺼내기</button></div>" +
      (stale ? '<p class="stale-note">1년 넘게 확인하지 않은 항목이 <b>' + stale + '개</b> 있어요. <button class="link" data-act="go" data-view="ledger">Records에서 확인</button></p>' : "") +
    "</div></section>" +
    nudgeCard() +
    '<div class="row" style="justify-content:space-between;margin:28px 0 10px"><h2 class="sec-h">Records</h2><a href="#ledger" data-go="ledger" style="font-size:12.5px">전체 보기</a></div>' +
    '<div class="cat-grid">' + LEDGER_CATS.filter((c) => c.id !== "etc").map((c) => { const t = countText(P, c.id), st = P.ledger.filter((e) => e.cat === c.id && isStale(e)).length;
      return '<button class="cat-card' + (t ? "" : " empty") + '" data-act="ledOpen" data-id="' + c.id + '"><b>' + esc(c.name) + '</b><span class="d">' + esc(c.d) + '</span><span class="n">' + (t ? esc(t) : "비어 있음") + (st ? ' · <i class="stale-dot"></i>확인 ' + st : "") + "</span></button>"; }).join("") + "</div>" +
    '<div class="grid2" style="margin-top:28px"><section class="sheet pad"><div class="row" style="justify-content:space-between;margin-bottom:8px"><h3>탐구</h3><span class="muted" style="font-size:12px">고르기 위주의 9개 장</span></div><div class="chrows">' + chRows + "</div></section>" +
    '<section class="sheet pad"><div class="row" style="justify-content:space-between;margin-bottom:8px"><h3>최근에 알게 된 것</h3><a href="#interview" data-go="interview" style="font-size:12.5px">인터뷰로 더 채우기</a></div><ul class="list-plain">' +
      (recFacts.length ? recFacts.map((f) => '<li><span class="tag" style="min-width:72px;justify-content:center">' + esc(CAT_BY[f.cat].name) + '</span><span style="flex:1">' + esc(entryText(f)) + "</span></li>").join("") : '<li class="muted">아직 없어요.</li>') + "</ul></section></div>" +
    '<div class="row" style="justify-content:space-between;margin:28px 0 10px"><h2 class="sec-h">한눈에 보기</h2><span class="muted" style="font-size:12px">쌓인 기록으로 자동으로 그려져요</span></div>' +
    '<div class="dwg-cards">' +
      dwgCard("portrait", "Portrait", "자화상", pr ? (pr.rev || 0) + "판" : "미작성", miniPortrait(P)) +
      dwgCard("map", "Network", "Network", S.AI.map ? "주제 " + S.AI.map.themes.length : "노드 " + mapNodeCount(P), miniMap(P)) +
      dwgCard("gantt", "Timeline", "연표", P.timeline.events.length + "개 이정표", miniGantt(P)) +
      dwgCard("metrics", "Metrics", "지표", "휠·성격·가치", miniRadar(P)) +
    "</div>" +
    '<section class="sheet pad" style="margin-top:28px"><div class="row" style="justify-content:space-between;margin-bottom:6px"><h3>최근 기록</h3><a href="#log" data-go="log" style="font-size:12.5px">전체 보기</a></div><ul class="list-plain">' +
      (recent.length ? recent.map((r) => '<li><span class="ltype" style="min-width:52px"><i class="dot" style="background:' + (RT_BY[r.type]?.color || "var(--ink-3)") + '"></i>' + esc(RT_BY[r.type]?.name || "") + '</span><span style="flex:1">' + esc(cut(r.text, 90)) + '</span><span class="mono muted" style="font-size:11px">' + esc(fmtYM(r.date)) + "</span></li>").join("") : '<li class="muted">아직 기록이 없어요.</li>') + "</ul></section>" +
    '<details class="diag diag-home"><summary>연결 상태</summary><div class="diag-body">' + diagHTML() + "</div></details>";
}

/* ---------------- migration review ---------------- */
function treeMoveSection(P) {
  const tm = P.meta.treeMove; if (!tm) return "";
  const roots = P.tree.nodes.filter((n) => !n.parent);
  const rows = tm.moves.map((mv) => ({ mv, i: P.tree.nodes.findIndex((n) => n.id === mv.id) })).filter((o) => o.i > -1);
  const byArea = TREE_AREAS.map((a) => ({ a, xs: rows.filter((o) => P.tree.nodes[o.i].parent === "area_" + a.id) })).filter((x) => x.xs.length);
  const other = rows.filter((o) => !String(P.tree.nodes[o.i].parent || "").startsWith("area_"));
  const row = ({ mv, i }) => { const n = P.tree.nodes[i]; const kids = treeChildren(P, n.id).length;
    return '<div class="rv-row"><select class="input" data-bind="P.tree.nodes.' + i + '.parent" data-rerender="1" aria-label="가지">' + roots.map((r) => '<option value="' + r.id + '"' + (r.id === n.parent ? " selected" : "") + ">" + esc(r.label) + "</option>").join("") + '</select><span class="rv-t">' + esc(n.label) + '<span class="src">예전 묶음: ' + esc(mv.from) + (kids ? " · 하위 " + kids + "개 함께 이동" : "") + "</span></span><span></span></div>"; };
  return '<h2 class="sec-h" style="margin:26px 0 6px">생각 나무</h2><p class="muted" style="font-size:12.5px;margin-bottom:10px">예전 다섯 묶음(돈·일·미래 등)은 앱이 임의로 만든 것이라 없애고, 주제를 라이프 휠 여덟 영역과 "의미·나 자신" 아래로 옮겼어요. 가지를 바꾸면 하위 연관어도 함께 옮겨져요.</p>' +
    byArea.map(({ a, xs }) => '<section class="led-sec"><header><h2>' + esc(a.name) + '</h2><span class="muted">' + xs.length + "개</span></header>" + xs.map(row).join("") + "</section>").join("") +
    (other.length ? '<section class="led-sec"><header><h2>다른 가지</h2></header>' + other.map(row).join("") + "</section>" : "");
}
function viewReview() {
  const P = S.P, m = P.meta.migration;
  const rows = P.ledger.map((e, i) => ({ e, i })).filter((o) => o.e.mig);
  const byCat = LEDGER_CATS.map((c) => ({ c, xs: rows.filter((o) => o.e.cat === c.id) })).filter((x) => x.xs.length);
  return '<div class="page-head"><div><div class="eyebrow">Review · 옮긴 내용 확인</div><h1>옮긴 내용 확인</h1><p class="lede">자동으로 분류해 옮긴 항목이에요. 분류가 틀린 것은 바꾸고, 필요 없는 것은 지워 주세요. 예전 데이터는 따로 보관돼 있어요.</p></div></div>' +
    (rows.length ? '<section class="sheet pad" style="margin-bottom:18px"><div class="eyebrow">Records</div><div class="big-n">' + rows.length + '<small>항목</small></div><p class="muted" style="font-size:12.5px">' + byCat.map((x) => x.c.name + " " + x.xs.length).join(" · ") + "</p></section>" : "") +
    (rows.length ? '<h2 class="sec-h" style="margin:8px 0 6px">Records</h2>' : "") + byCat.map(({ c, xs }) => '<section class="led-sec"><header><h2>' + esc(c.name) + '</h2><span class="muted">' + xs.length + "개</span></header>" + xs.map(({ e, i }) =>
      '<div class="rv-row"><select class="input" data-bind="P.ledger.' + i + '.cat" data-rerender="1" aria-label="분류">' + LEDGER_CATS.map((x) => '<option value="' + x.id + '"' + (x.id === e.cat ? " selected" : "") + ">" + x.name + "</option>").join("") + '</select><span class="rv-t">' + esc(e.value) + '<span class="src">' + esc(srcLabel(e.src)) + '</span></span><button class="btn sm ghost" data-act="entryDel" data-id="' + e.id + '" aria-label="지우기">' + I.trash + "</button></div>").join("") + "</section>").join("") +
    treeMoveSection(P) +
    '<div class="row" style="justify-content:flex-end;margin-top:18px">' + ((!m || m.reviewed) && (!P.meta.treeMove || P.meta.treeMove.reviewed) ? '<span class="muted">확인을 마쳤어요.</span>' : '<button class="btn primary" data-act="reviewDone">모두 확인했어요</button>') + "</div>";
}
function kpi(l, v, d) { return '<div class="kpi"><div class="l">' + esc(l) + '</div><div class="v">' + esc(v) + '</div><div class="d">' + esc(d) + "</div></div>"; }
function dwgCard(view, no, name, meta, preview) {
  return '<a href="#' + view + '" class="sheet dwg-card" data-act="go" data-view="' + view + '"><div class="pv">' + preview + '</div><div class="meta"><div>' + (no !== name ? '<div class="mono muted" style="font-size:10.5px">' + no + "</div>" : "") + "<b>" + esc(name) + '</b></div><span class="tag">' + esc(meta) + "</span></div></a>";
}
function miniPortrait(P) {
  const pr = S.AI.portrait;
  if (!pr) return placeholderSVG("초상 미작성");
  return '<div style="padding:14px 18px;text-align:left;width:100%"><div class="mono muted" style="font-size:9.5px;letter-spacing:.14em">' + '자화상' + '</div><div style="font-family:var(--f-serif);font-size:22px;font-weight:700;line-height:1.25;margin:6px 0">' + esc(pr.archetype) + '</div><div style="font-size:11.5px;color:var(--ink-2);line-height:1.5">' + esc(cut(pr.headline, 60)) + "</div></div>";
}
function miniMap(P) {
  const counts = { values: valueScores(P).filter((v) => v.n).length ? 5 : 0, loves: allLoveItems(P).length, energy: energyLists(P).c.length, thoughts: P.tree.nodes.length, wants: P.wants.items.length, life: 4, traits: ipipScores(P).O.n ? 5 : 0 };
  const W = 200, H = 130, cx = 100, cy = 65; let g = "";
  DOMAINS.forEach((d, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / DOMAINS.length; const x = cx + Math.cos(a) * 44, y = cy + Math.sin(a) * 42;
    g += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" ' + st({ stroke: "var(--rule)" }) + "/>";
    const n = Math.min(8, Math.ceil((counts[d.id] || 0) / 4));
    for (let k = 0; k < n; k++) { const b = a + (k - (n - 1) / 2) * 0.28; const x2 = cx + Math.cos(b) * 62, y2 = cy + Math.sin(b) * 56; g += '<line x1="' + x.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" ' + st({ stroke: "var(--rule)" }) + '/><circle cx="' + x2.toFixed(1) + '" cy="' + y2.toFixed(1) + '" r="2.4" ' + st({ fill: d.color }) + "/>"; }
    g += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="5" ' + st({ fill: d.color, stroke: "var(--sheet-2)", "stroke-width": "2" }) + "/>";
  });
  g += '<circle cx="' + cx + '" cy="' + cy + '" r="7" ' + st({ fill: "var(--ink)" }) + "/>";
  return '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '">' + g + "</svg>";
}
function mapNodeCount(P) { return buildGraph(P).nodes.length; }
function miniGantt(P) {
  const ev = P.timeline.events.filter((e) => e.s);
  const by = P.basics.birthYear || 1980; const x0 = by, x1 = by + 100, W = 200, H = 120;
  const X = (v) => 10 + ((v - x0) / (x1 - x0)) * (W - 20);
  let g = ""; const lanes = LANES.slice(0, 4);
  lanes.forEach((l, i) => {
    const y = 18 + i * 22;
    g += '<line x1="10" x2="' + (W - 10) + '" y1="' + (y + 5) + '" y2="' + (y + 5) + '" ' + st({ stroke: "var(--rule-2)" }) + "/>";
    ev.filter((e) => e.lane === l.id).forEach((e) => {
      const a = ym2num(e.s), bb = ym2num(e.e);
      if (bb) g += '<rect x="' + X(a).toFixed(1) + '" y="' + y + '" width="' + Math.max(2, X(bb) - X(a)).toFixed(1) + '" height="10" rx="2" ' + st({ fill: "var(--accent)", opacity: e.est ? ".45" : ".9" }) + "/>";
      else g += '<rect x="' + (X(a) - 3).toFixed(1) + '" y="' + (y + 2) + '" width="6" height="6" transform="rotate(45 ' + X(a).toFixed(1) + " " + (y + 5) + ')" ' + st({ fill: "var(--ink)" }) + "/>";
    });
  });
  const t = X(nowYear());
  g += '<line x1="' + t.toFixed(1) + '" x2="' + t.toFixed(1) + '" y1="8" y2="' + (H - 12) + '" ' + st({ stroke: "var(--signal)", "stroke-width": "1.5" }) + "/>";
  return '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '">' + g + "</svg>";
}
