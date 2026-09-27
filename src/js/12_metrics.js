/* ============================================================ IV METRICS */
function viewMetrics() {
  const P = S.P, pct = overall(P);
  const doneN = CH.filter((c) => P.done[c.id]).length;
  const ivF = P.ledger.filter((f) => f.src === "interview").length;
  // chapter progress (EM style: actual vs 100)
  const chRows = CH.map((c) => { const p = P.done[c.id] ? 100 : chProgress(P, c.id); const s = chState(P, c.id); return '<div class="gap-row" style="grid-template-columns:130px minmax(0,1fr) 70px;padding:5px 0"><span style="font-size:12.5px"><span class="mono muted" style="font-size:10.5px">' + c.code + "</span> " + esc(c.name) + '</span><span class="b" style="height:10px"><i style="width:' + p + "%;background:" + (s === "done" ? "var(--good)" : "var(--accent)") + '"></i></span><span class="v"><span class="state ' + s + '" style="font-size:10.5px;padding:0 6px 0 4px">' + (s === "done" ? "완료" : p + "%") + "</span></span></div>"; }).join("");
  const chTbl = '<details class="tbl"><summary>표로 보기</summary><table><thead><tr><th>챕터</th><th>진도</th><th>상태</th></tr></thead><tbody>' + CH.map((c) => "<tr><td>" + c.code + " " + esc(c.name) + "</td><td>" + (P.done[c.id] ? 100 : chProgress(P, c.id)) + "%</td><td>" + ({ done: "완료", doing: "진행", todo: "대기" })[chState(P, c.id)] + "</td></tr>").join("") + "</tbody></table></details>";

  const ws = wheelStats(P);
  const tr = ipipScores(P); const vs = valueScores(P);
  const el = energyLists(P); const dt = discTally(P);
  const totA = el.c.length + el.n.length + el.d.length;
  const stack = totA ? '<div style="display:flex;height:14px;border-radius:0 4px 4px 0;overflow:hidden;gap:2px;margin:6px 0 8px">' + [["c", "var(--c-energy)"], ["n", "var(--ink-4)"], ["d", "var(--crit)"]].map(([k, c]) => el[k].length ? '<i title="' + ({ c: "충전", n: "보통", d: "방전" })[k] + " " + el[k].length + '" style="flex:' + el[k].length + ";background:" + c + '"></i>' : "").join("") + '</div><div class="legend"><span><i class="sq" style="background:var(--c-energy)"></i>충전 ' + el.c.length + '</span><span><i class="sq" style="background:var(--ink-4)"></i>보통 ' + el.n.length + '</span><span><i class="sq" style="background:var(--crit)"></i>방전 ' + el.d.length + "</span></div>" : '<div class="empty">CH.04를 채우면 보여요.</div>';

  // wants heatmap
  const W = P.wants.items, hz = HORIZONS.map((x) => x[0]);
  const cell = (t, z) => W.filter((w) => w.type === t && w.horizon === z).length;
  const max = Math.max(1, ...WANT_TYPES.flatMap((t) => hz.map((z) => cell(t.id, z))));
  const hm = '<div class="hm" style="grid-template-columns:96px repeat(' + hz.length + ',1fr)"><div></div>' + HORIZONS.map((x) => '<div class="hd">' + x[1] + "</div>").join("") + WANT_TYPES.map((t) => '<div class="rh">' + t.name + "</div>" + hz.map((z) => { const n = cell(t.id, z); return '<div class="cell" title="' + t.name + " · " + HZ_BY[z][1] + " " + n + '" style="background:' + (n ? "color-mix(in srgb, var(--c-wants) " + Math.round(18 + (n / max) * 70) + "%, var(--sheet))" : "var(--sheet-2)") + ";color:" + (n / max > 0.6 ? "#fff" : "var(--ink)") + '">' + (n || "") + "</div>"; }).join("")).join("") + '</div><div class="legend" style="margin-top:8px"><span>옅음 → 짙음 = 항목 수 (최대 ' + max + ")</span></div>";

  // progress trend
  const pl = P.progressLog.map((x) => ({ t: new Date(x.d + "T12:00:00"), y: x.p }));
  // records per year-month
  const byM = {}; S.LOG.items.forEach((r) => { const k = String(r.date || "").slice(0, 4) || "?"; byM[k] = byM[k] || {}; byM[k][r.type] = (byM[k][r.type] || 0) + 1; });
  const years = Object.keys(byM).sort();
  const maxY = Math.max(1, ...years.map((y) => sum(Object.values(byM[y]))));
  const recBars = years.length ? '<div class="stack" style="gap:6px">' + years.map((y) => { const tot = sum(Object.values(byM[y])); return '<div class="gap-row" style="grid-template-columns:44px minmax(0,1fr) 30px"><span class="mono" style="font-size:11.5px">' + y + '</span><span style="display:flex;height:12px;gap:2px;width:' + (tot / maxY) * 100 + '%">' + REC_TYPES.map((t) => byM[y][t.id] ? '<i title="' + t.name + " " + byM[y][t.id] + '" style="flex:' + byM[y][t.id] + ";background:" + t.color + ';border-radius:0 3px 3px 0"></i>' : "").join("") + '</span><span class="v">' + tot + "</span></div>"; }).join("") + '</div><div class="legend" style="margin-top:10px">' + REC_TYPES.map((t) => '<span><i class="sq" style="background:' + t.color + '"></i>' + t.name + "</span>").join("") + "</div>" : '<div class="empty">기록이 없어요.</div>';

  const revs = P.revLog.slice().reverse().slice(0, 8);

  return drawingHead("metrics", "숫자로 보는 나. 모든 수치는 탐구의 응답에서 바로 계산돼요. 각 카드 아래의 '표로 보기'에서 원래 값을 확인할 수 있어요.") +
    '<div class="mx">' +
      '<section class="sheet mcard c3 stat"><div class="l">지도 완성도</div><div class="v" style="font-size:44px">' + pct + '%</div><div class="d">탐구·원장·인터뷰를 합친 진척도</div></section>' +
      '<section class="sheet mcard c3 stat"><div class="l">완료 챕터</div><div class="v">' + doneN + ' / 9</div><div class="d">진행 중 ' + CH.filter((c) => chState(P, c.id) === "doing").length + "</div></section>" +
      '<section class="sheet mcard c3 stat"><div class="l">원장 항목</div><div class="v">' + P.ledger.length + '</div><div class="d">인터뷰에서 ' + ivF + " · 기록에서 " + P.ledger.filter((f) => f.src === "record").length + "</div></section>" +
      '<section class="sheet mcard c3 stat"><div class="l">개정 이력</div><div class="v">' + revStr() + '</div><div class="d">최근 ' + (P.revLog.length ? fmtDot(P.revLog[P.revLog.length - 1].at) : "없음") + "</div></section>" +
      '<section class="sheet mcard c6"><h4>챕터별 진도</h4><div class="sub">계획 100% 대비 실적 · 완료는 초록</div>' + chRows + chTbl + "</section>" +
      '<section class="sheet mcard c6"><h4>라이프 휠 · 만족도와 중요도의 차이</h4><div class="sub">차이가 큰 순서로 정렬</div>' + wheelDumbbell(ws) + '<details class="tbl"><summary>표로 보기</summary><table><thead><tr><th>영역</th><th>만족(0~10)</th><th>중요(1~5)</th><th>우선순위</th></tr></thead><tbody>' + ws.map((w) => "<tr><td>" + w.name + "</td><td>" + (w.sat ?? "–") + "</td><td>" + (w.imp ?? "–") + "</td><td>" + (w.gap ?? "–") + "</td></tr>").join("") + "</tbody></table></details></section>" +
      '<section class="sheet mcard c4"><h4>성격 5요인</h4><div class="sub">Mini-IPIP · 1~5 · 가운데 선 = 3</div>' + (TRAIT_ORDER.some((k) => tr[k].n) ? traitRows(tr, false) : '<div class="empty">CH.02를 채우면 보여요.</div>') + '<details class="tbl"><summary>표로 보기</summary><table><thead><tr><th>요인</th><th>점수</th><th>수준</th><th>응답</th></tr></thead><tbody>' + TRAIT_ORDER.map((k) => "<tr><td>" + TRAITS[k].name + "</td><td>" + (tr[k].score == null ? "–" : tr[k].score.toFixed(2)) + "</td><td>" + (tr[k].score == null ? "–" : LVL_KO[lvl(tr[k].score)]) + "</td><td>" + tr[k].n + "/4</td></tr>").join("") + "</tbody></table></details></section>" +
      '<section class="sheet mcard c4"><h4>가치 순위</h4><div class="sub">딜레마 ' + Object.keys(P.values.picks).length + "/" + DILEMMAS.length + "개 · 이긴 횟수/등장 횟수</div>" + (vs.some((v) => v.n) ? valueRows(vs) : '<div class="empty">CH.03을 채우면 보여요.</div>') + "</section>" +
      '<section class="sheet mcard c4"><h4>에너지 · 일하는 방식</h4><div class="sub">활동 ' + totA + "/" + ACTS.length + "개 응답</div>" + stack + '<div style="margin-top:14px">' + quadSVG(dt, 220) + "</div></section>" +
      '<section class="sheet mcard c6"><h4>원하는 것 · 종류 × 시기</h4><div class="sub">' + W.length + "개 · 진행 중 " + W.filter((w) => w.status === "doing").length + " · 이룸 " + W.filter((w) => w.status === "done").length + "</div>" + hm + "</section>" +
      '<section class="sheet mcard c6"><h4>완성도 추이</h4><div class="sub">하루 한 점, 그날의 마지막 값</div>' + (pl.length >= 2 ? lineSVG(pl, { h: 180 }) : '<div class="empty">이틀 이상 기록되면 추이선이 그려져요. 오늘 ' + pct + "%</div>") + "</section>" +
      '<section class="sheet mcard c6"><h4>기록 · 연도별</h4><div class="sub">기록 ' + S.LOG.items.length + "건</div>" + recBars + "</section>" +
      '<section class="sheet mcard c6"><h4>개정 이력</h4><div class="sub">챕터 완료, 초상·지도 갱신, 인터뷰 누적 시 올라가요</div><ul class="list-plain">' + (revs.map((r) => '<li><span class="rev-tri">' + pad2(r.rev) + '</span><span style="flex:1">' + esc(r.note) + '</span><span class="mono muted" style="font-size:11px">' + fmtDot(r.at) + "</span></li>").join("") || '<li class="muted">아직 개정 이력이 없어요.</li>') + "</ul></section>" +
    "</div>" +
    '<div class="dwg-foot">' + titleBlock([["도판", "IV"], ["제목", "지표"], ["판", revStr()], ["날짜", fmtDot(nowISO())], ["출처", "응답 원값"]]) + "</div>";
}
