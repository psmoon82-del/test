/* ============================================================ HOME · 종합 현황판 */
function titleBlock(cells) {
  return '<div class="tblock">' + cells.map(([k, v]) => "<div><b>" + esc(k) + "</b><span>" + v + "</span></div>").join("") + "</div>";
}
function hullNo(P) { return "LD-" + (P.basics.birthYear || "0000"); }

function viewHome() {
  const P = S.P, pct = overall(P), na = nextAction(P);
  const b = P.basics, name = b.nick || b.name || "나";
  const doneN = CH.filter((c) => P.done[c.id]).length;
  const ivFacts = P.facts.filter((f) => f.src === "interview").length;
  const wantDoing = P.wants.items.filter((w) => w.status === "doing").length;
  const pr = S.AI.portrait;

  let banners = "";
  if (S.mode !== "cloud") banners += '<div class="banner" style="margin-bottom:14px"><b>미리보기 모드</b><span>이 화면에서는 저장소에 연결되지 않아 입력한 내용이 저장되지 않아요. Claude 앱에서 열면 저장돼요.</span></div>';
  if (S.firstRun && S.seeded && !P.dismissSeedNote) banners += '<div class="banner info" style="margin-bottom:14px;align-items:center"><span style="flex:1"><b>기존 기록으로 미리 채워 두었어요.</b> 엑셀 메모 18개 시트와 지금까지의 대화에서 좋아하는 것 ' + allLoveItems(P).length + "개, 마음속 주제 " + P.thoughts.items.length + "개, 원하는 것 " + P.wants.items.length + "개, 기록 " + S.LOG.items.length + '건을 옮겼어요. 추정한 연도에는 <span class="tag est">추정</span> 표시가 있어요. 여정을 따라가며 확인하고 고쳐 주세요.</span><button class="btn sm ghost" data-act="dismissSeed">닫기</button></div>';

  // progress trend
  const pl = P.progressLog.map((x) => ({ t: new Date(x.d + "T12:00:00"), y: x.p }));
  const trend = pl.length >= 2 ? lineSVG(pl, { h: 150, aria: "공정률 추이" }) :
    '<div class="empty" style="padding:26px 8px">오늘부터 매일의 공정률이 기록돼요.<br>내일 다시 열면 추이선이 그려집니다.</div>';

  // stage track
  const stagesAll = CH.map((c) => ({ id: c.id, code: c.code, stage: c.stage, name: c.name, st: chState(P, c.id), go: "openCh" }))
    .concat([{ id: "interview", code: "09", stage: "시운전", name: "AI 인터뷰", st: ivFacts >= 5 ? "done" : ivFacts ? "doing" : "todo", go: "interview" },
      { id: "portrait", code: "10", stage: "인도", name: "자기 초상", st: pr ? "done" : "todo", go: "portrait" }]);
  const nextIdx = stagesAll.findIndex((x) => x.st !== "done");
  const doneRun = stagesAll.findIndex((x) => x.st !== "done");
  const fillPct = ((doneRun === -1 ? stagesAll.length - 1 : Math.max(0, doneRun - 0.5)) / (stagesAll.length - 1)) * (100 - 100 / 11);
  const stages = '<div class="stages" role="list">' + '<span class="fill" style="width:' + (doneRun <= 0 ? 0 : fillPct) + '%"></span>' + stagesAll.map((x, i) =>
    '<a role="listitem" href="#" class="stg ' + x.st + (i === nextIdx ? " next" : "") + '" data-act="' + (x.go === "openCh" ? "openCh" : "go") + '" data-id="' + x.id + '" data-view="' + x.go + '"><span class="dia"></span><span class="c">' + x.code + '</span><span class="n">' + esc(x.stage) + '</span><span class="s">' + esc(x.name) + "</span></a>").join("") + "</div>";

  const recent = S.LOG.items.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.at).localeCompare(String(a.at))).slice(0, 5);
  const recFacts = P.facts.slice().sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 5);

  return '<div class="page-head"><div><div class="eyebrow">Dock status · 종합 현황판</div><h1>' + esc(name) + '의 라이프 독</h1><p class="lede">나를 짓고, 점검하고, 고쳐 쓰는 곳. 여정으로 뼈대를 세우고, 인터뷰와 기록으로 계속 보수합니다.</p></div>' +
    titleBlock([["HULL NO.", esc(hullNo(P))], ["OWNER", esc(b.name || "-")], ["REV", revStr()], ["UPDATED", fmtDot(P.updatedAt)], ["CHAPTERS", doneN + "/9"], ["SCALE", "1 : 1"]]) + "</div>" +
    banners +
    '<section class="sheet dock-hero lift"><div class="l">' +
      '<div class="eyebrow">자기 이해 공정률</div>' +
      '<div class="hero-num"><div class="n">' + pct + '<small>%</small></div><div class="cap">9개 챕터 · 시운전 인터뷰 · 초상과 지도를 합친 진척도</div></div>' +
      '<div class="meter"><i style="width:' + pct + '%"></i></div>' +
      (pr ? '<div><div class="eyebrow" style="margin-bottom:4px">현재 초상 ' + '<span class="mono">REV.' + pad2(pr.rev || 0) + '</span></div><div class="archetype">' + esc(pr.archetype) + '</div><div class="archetype-sub">' + esc(pr.headline || "") + "</div></div>"
        : '<div><div class="eyebrow" style="margin-bottom:4px">현재 초상</div><div class="archetype" style="color:var(--ink-3)">아직 그려지지 않았어요</div><div class="archetype-sub">여정을 마치면 Claude가 당신을 한 장의 초상으로 정리합니다.</div></div>') +
      '<div class="next-card"><div><div class="eyebrow" style="color:var(--accent)">다음 작업</div><div class="t">' + esc(na.label) + '</div><div class="d">' + esc(na.desc) + '</div></div><button class="btn accent" data-act="' + (na.kind === "ch" ? "openCh" : "go") + '" data-id="' + (na.ch ? na.ch.id : "") + '" data-view="' + na.kind + '">' + (na.kind === "ch" ? "열기" : "이동") + I.arrow + "</button></div>" +
    '</div><div class="r"><div class="row" style="justify-content:space-between"><div class="eyebrow">공정률 추이</div><span class="mono muted" style="font-size:11px">' + pl.length + "일 기록</span></div>" + trend +
      '<div class="stack" style="gap:6px;margin-top:auto"><div class="eyebrow">개정 이력</div>' + (P.revLog.length ? P.revLog.slice(-3).reverse().map((r) => '<div class="row" style="gap:8px;font-size:12.5px;flex-wrap:nowrap"><span class="rev-tri">' + pad2(r.rev) + '</span><span style="flex:1">' + esc(r.note) + '</span><span class="mono muted" style="font-size:10.5px">' + fmtDot(r.at) + "</span></div>").join("") : '<div class="muted" style="font-size:12.5px">챕터를 마치거나 초상을 그리면 REV가 올라가요.</div>') + "</div>" +
    "</div></section>" +
    '<section class="sheet kpis">' +
      kpi("완료 챕터", doneN + " / 9", "진행 중 " + CH.filter((c) => chState(P, c.id) === "doing").length) +
      kpi("알게 된 사실", P.facts.length, "인터뷰에서 " + ivFacts) +
      kpi("원하는 것", P.wants.items.length, "진행 중 " + wantDoing) +
      kpi("정비 일지", S.LOG.items.length, "최근 " + fmtYM(recent[0]?.date || "")) +
    "</section>" +
    '<section class="sheet" style="margin-top:14px;padding:14px 16px 10px"><div class="row" style="justify-content:space-between"><div class="eyebrow">건조 공정 · 11 stages</div><span class="muted" style="font-size:12px">◆ 완료 · ◈ 진행 · ◇ 대기</span></div>' + stages + "</section>" +
    '<div class="row" style="justify-content:space-between;margin:26px 0 10px"><h3 style="font-size:16px">도면</h3><span class="muted" style="font-size:12px">쌓인 데이터로 자동으로 그려지는 네 장의 도면</span></div>' +
    '<div class="dwg-cards">' +
      dwgCard("portrait", "LD-01", "자기 초상", pr ? "REV." + pad2(pr.rev || 0) : "미작성", miniPortrait(P)) +
      dwgCard("map", "LD-02", "살아있는 지도", S.AI.map ? "주제 " + S.AI.map.themes.length : "노드 " + mapNodeCount(P), miniMap(P)) +
      dwgCard("gantt", "LD-03", "인생 공정표", P.timeline.events.length + "개 이정표", miniGantt(P)) +
      dwgCard("metrics", "LD-04", "지표", "휠·성격·가치", miniRadar(P)) +
    "</div>" +
    '<div class="grid2" style="margin-top:26px">' +
      '<section class="sheet pad"><div class="row" style="justify-content:space-between;margin-bottom:6px"><h3 style="font-size:15px">최근 정비 일지</h3><a href="#log" data-act="go" data-view="log" style="font-size:12.5px">전체 보기</a></div><ul class="list-plain">' +
        (recent.length ? recent.map((r) => '<li><span class="ltype" style="min-width:52px"><i class="dot" style="background:' + (RT_BY[r.type]?.color || "var(--ink-3)") + '"></i>' + esc(RT_BY[r.type]?.name || "") + '</span><span style="flex:1">' + esc(cut(r.text, 90)) + '</span><span class="mono muted" style="font-size:11px">' + esc(fmtYM(r.date)) + "</span></li>").join("") : '<li class="muted">아직 기록이 없어요.</li>') +
      '</ul></section><section class="sheet pad"><div class="row" style="justify-content:space-between;margin-bottom:6px"><h3 style="font-size:15px">최근에 알게 된 것</h3><a href="#interview" data-act="go" data-view="interview" style="font-size:12.5px">인터뷰로 더 채우기</a></div><ul class="list-plain">' +
        (recFacts.length ? recFacts.map((f) => '<li><span class="tag" style="min-width:64px;justify-content:center">' + esc(AREAS[f.area] || f.area) + '</span><span style="flex:1">' + esc(f.text) + "</span></li>").join("") : '<li class="muted">아직 없어요.</li>') +
      "</ul></section></div>";
}
function kpi(l, v, d) { return '<div class="kpi"><div class="l">' + esc(l) + '</div><div class="v">' + esc(v) + '</div><div class="d">' + esc(d) + "</div></div>"; }
function dwgCard(view, no, name, meta, preview) {
  return '<a href="#' + view + '" class="sheet dwg-card" data-act="go" data-view="' + view + '"><div class="pv">' + preview + '</div><div class="meta"><div><div class="mono muted" style="font-size:10.5px">' + no + "</div><b>" + esc(name) + '</b></div><span class="tag">' + esc(meta) + "</span></div></a>";
}
function miniPortrait(P) {
  const pr = S.AI.portrait;
  if (!pr) return placeholderSVG("초상 미작성");
  return '<div style="padding:14px 18px;text-align:left;width:100%"><div class="mono muted" style="font-size:9.5px;letter-spacing:.14em">' + esc(hullNo(P)) + '</div><div style="font-family:var(--f-serif);font-size:22px;font-weight:700;line-height:1.25;margin:6px 0">' + esc(pr.archetype) + '</div><div style="font-size:11.5px;color:var(--ink-2);line-height:1.5">' + esc(cut(pr.headline, 60)) + "</div></div>";
}
function miniMap(P) {
  const counts = { values: valueScores(P).filter((v) => v.n).length ? 5 : 0, loves: allLoveItems(P).length, energy: energyLists(P).c.length, thoughts: P.thoughts.items.length, wants: P.wants.items.length, life: 4, traits: ipipScores(P).O.n ? 5 : 0 };
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
