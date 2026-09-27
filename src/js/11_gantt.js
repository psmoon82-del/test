/* ============================================================ III LIFE TIMELINE */
function wantYear(w) { const h = HZ_BY[w.horizon]; if (!h || h[2] == null) return null; return new Date().getFullYear() + h[2]; }
function ganttRows(P, compact) {
  const rows = [];
  ["me", "family", "work", "home"].forEach((ln) => {
    const evs = P.timeline.events.filter((e) => e.lane === ln && e.s).sort((a, b) => ym2num(a.s) - ym2num(b.s));
    if (!evs.length) return;
    rows.push({ t: "lane", lane: ln });
    evs.forEach((e, i) => rows.push({ t: "ev", ev: e, code: LANE_BY[ln].code.replace(".0", "") + "." + (i + 1) }));
  });
  let ws = P.wants.items.filter((w) => wantYear(w) && w.status !== "done");
  ws.sort((a, b) => wantYear(a) - wantYear(b) || (b.prio || 0) - (a.prio || 0));
  if (compact) ws = ws.filter((w) => (w.prio || 0) >= 2).slice(0, 8);
  else if (!S.ui.ganttAllWants) ws = ws.filter((w) => (w.prio || 0) >= 2);
  if (ws.length) {
    rows.push({ t: "lane", lane: "plan" });
    ws.forEach((w, i) => rows.push({ t: "want", w, code: "5." + (i + 1) }));
  }
  return rows;
}
function ganttRange(P, key) {
  const now = nowYear(); const evYears = P.timeline.events.map((e) => ym2num(e.s)).filter((v) => v);
  const by = P.basics.birthYear || (evYears.length ? Math.floor(Math.min(...evYears)) : Math.floor(now) - 40);
  if (key === "past") return [Math.floor(now) - 22, Math.floor(now) + 3];
  if (key === "next") return [Math.floor(now) - 2, Math.floor(now) + 23];
  return [by, by + 100];
}
function ganttSVG(P, o) {
  o = o || {}; const compact = !!o.compact;
  const [x0, x1] = ganttRange(P, compact ? "all" : S.ui.ganttRange);
  const rows = ganttRows(P, compact);
  if (!rows.length) return '<div class="empty">이정표가 아직 없어요.</div>';
  const LW = compact ? 190 : 250, PW = compact ? 620 : 900, W = LW + PW + 24, RH = compact ? 22 : 27, HH = 46;
  const H = HH + rows.length * RH + 10;
  const X = (v) => LW + ((clamp(v, x0, x1) - x0) / (x1 - x0)) * PW;
  const span = x1 - x0, step = span > 60 ? 10 : 5;
  const by = P.basics.birthYear;
  let g = "";
  // lane backgrounds
  rows.forEach((r, i) => { if (r.t === "lane") g += '<rect x="0" y="' + (HH + i * RH) + '" width="' + W + '" height="' + RH + '" ' + st({ fill: "var(--sheet-2)" }) + "/>"; });
  // grid + header
  for (let y = Math.ceil(x0 / step) * step; y <= x1; y += step) {
    const x = X(y);
    g += '<line x1="' + x + '" x2="' + x + '" y1="' + (HH - 6) + '" y2="' + (H - 6) + '" ' + st({ stroke: "var(--rule-2)" }) + "/>";
    g += '<text x="' + x + '" y="16" text-anchor="middle" class="tick" ' + st({ fill: "var(--ink-2)" }) + ">" + y + "</text>";
    if (by) g += '<text x="' + x + '" y="32" text-anchor="middle" class="tick">' + (y - by) + "세</text>";
  }
  if (!compact && step === 5) for (let y = Math.ceil(x0); y <= x1; y++) if (y % 5) g += '<line x1="' + X(y) + '" x2="' + X(y) + '" y1="' + (HH - 3) + '" y2="' + HH + '" ' + st({ stroke: "var(--rule)" }) + "/>";
  g += '<line x1="0" x2="' + W + '" y1="' + HH + '" y2="' + HH + '" ' + st({ stroke: "var(--rule)" }) + "/>";
  g += '<text x="10" y="16" class="tick">WBS</text><text x="46" y="16" class="tick">항목</text>' + (by ? '<text x="10" y="32" class="tick">나이(만)</text>' : "");
  const now = nowYear();
  rows.forEach((r, i) => {
    const y = HH + i * RH, cy = y + RH / 2;
    if (r.t === "lane") {
      const L = LANE_BY[r.lane];
      g += '<text x="10" y="' + (cy + 4) + '" class="tick" ' + st({ fill: "var(--ink)", "font-weight": "600" }) + ">" + L.code + '</text><text x="46" y="' + (cy + 4) + '" ' + st({ fill: "var(--ink)", "font-size": "12.5px", "font-weight": "700" }) + ">" + esc(L.name) + "</text>";
      return;
    }
    g += '<line x1="0" x2="' + W + '" y1="' + (y + RH) + '" y2="' + (y + RH) + '" ' + st({ stroke: "var(--rule-2)" }) + "/>";
    if (r.t === "ev") {
      const e = r.ev, a = ym2num(e.s), b2 = ym2num(e.e), lab = cut(e.label, compact ? 14 : 22);
      const tip = e.label + " · " + fmtYM(e.s) + (e.e ? " ~ " + fmtYM(e.e) : "") + (e.est ? " (추정)" : "") + (e.note ? " · " + e.note : "");
      g += '<g data-act="evEdit" data-id="' + e.id + '" style="cursor:pointer"><rect x="0" y="' + y + '" width="' + W + '" height="' + RH + '" fill="transparent"/>';
      g += '<text x="10" y="' + (cy + 4) + '" class="tick">' + r.code + '</text><text x="46" y="' + (cy + 4) + '" ' + st({ fill: e.est ? "var(--ink-3)" : "var(--ink)", "font-size": "12px" }) + ">" + esc(lab) + (e.est ? " ·추정" : "") + "</text>";
      if (a != null && a <= x1 && (b2 || a) >= x0) {
        if (b2) {
          const fut = a > now; const xa = X(a), xb = Math.max(X(b2), xa + 3);
          g += '<rect x="' + xa.toFixed(1) + '" y="' + (cy - 6) + '" width="' + (xb - xa).toFixed(1) + '" height="12" rx="3" ' + st(fut ? { fill: "var(--accent-2)", stroke: "var(--accent)", "stroke-width": "1.2" } : { fill: "var(--accent)", opacity: e.est ? ".45" : "1" }) + "><title>" + esc(tip) + "</title></rect>";
          if (!fut && b2 > now && a < now) g += '<rect x="' + X(now).toFixed(1) + '" y="' + (cy - 6) + '" width="' + (xb - X(now)).toFixed(1) + '" height="12" ' + st({ fill: "var(--accent-2)", stroke: "var(--accent)", "stroke-width": "1.2" }) + "/>";
        } else {
          const x = X(a), fut = a > now;
          g += '<rect x="' + (x - 5).toFixed(1) + '" y="' + (cy - 5) + '" width="10" height="10" transform="rotate(45 ' + x.toFixed(1) + " " + cy + ')" ' + st(fut ? { fill: "var(--sheet)", stroke: "var(--signal)", "stroke-width": "1.6" } : { fill: e.est ? "var(--ink-4)" : "var(--ink)", stroke: "var(--sheet)", "stroke-width": "1.5" }) + "><title>" + esc(tip) + "</title></rect>";
        }
      }
      g += "</g>";
    } else if (r.t === "want") {
      const w = r.w, yv = wantYear(w), x = X(yv + 0.5), lab = cut(w.text, compact ? 14 : 24);
      const tip = w.text + " · " + WT_BY[w.type].name + " · " + (HZ_BY[w.horizon]?.[1] || "") + " (" + yv + ") · ★" + (w.prio || 1) + " · " + (WS_BY[w.status] || "");
      g += '<text x="10" y="' + (cy + 4) + '" class="tick">' + r.code + '</text><text x="46" y="' + (cy + 4) + '" ' + st({ fill: "var(--ink)", "font-size": "12px" }) + ">" + esc(lab) + "</text>";
      const xs = X(now);
      if (w.status === "doing" || w.status === "plan") g += '<line x1="' + xs + '" x2="' + x + '" y1="' + cy + '" y2="' + cy + '" ' + st({ stroke: "var(--c-wants)", "stroke-width": "2", "stroke-opacity": ".5" }) + "/>";
      const filled = w.status === "doing";
      g += '<rect x="' + (x - 5).toFixed(1) + '" y="' + (cy - 5) + '" width="10" height="10" transform="rotate(45 ' + x.toFixed(1) + " " + cy + ')" ' + st({ fill: filled ? "var(--c-wants)" : "var(--sheet)", stroke: "var(--c-wants)", "stroke-width": "1.8" }) + "><title>" + esc(tip) + "</title></rect>";
    }
  });
  if (now >= x0 && now <= x1) {
    const x = X(now);
    g += '<line x1="' + x + '" x2="' + x + '" y1="' + (HH - 2) + '" y2="' + (H - 6) + '" ' + st({ stroke: "var(--signal)", "stroke-width": "1.6" }) + "/>";
    const lab = "오늘 " + curYM().replace("-", ".") + (by ? " · " + (new Date().getFullYear() - by) + "세" : "");
    const lw = lab.length * 6.4 + 12;
    g += '<rect x="' + (x - lw / 2) + '" y="' + (HH - 12) + '" width="' + lw + '" height="15" rx="3" ' + st({ fill: "var(--signal)" }) + '/><text x="' + x + '" y="' + (HH - 1.5) + '" text-anchor="middle" ' + st({ fill: "#fff", "font-size": "10px", "font-weight": "600", "font-family": "var(--f-mono)" }) + ">" + esc(lab) + "</text>";
  }
  return '<div class="gantt-shell"><div class="gantt-scroll"><svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '" style="min-width:' + W + 'px;display:block" role="img" aria-label="연표">' + g + "</svg></div></div>";
}

function viewGantt() {
  const P = S.P, rng = S.ui.ganttRange;
  const undated = P.timeline.events.filter((e) => !e.s);
  const ed = S.ui.editEvent ? P.timeline.events.find((e) => e.id === S.ui.editEvent) : null;
  let edit = "";
  if (ed) {
    const i = P.timeline.events.indexOf(ed);
    edit = '<section class="sheet pad" style="margin-bottom:14px;border-color:var(--accent)"><div class="row" style="justify-content:space-between;margin-bottom:10px"><b>이정표 편집</b><span class="row" style="gap:6px"><button class="btn sm ghost" data-act="evDel" data-i="' + i + '">' + I.trash + '삭제</button><button class="btn sm primary" data-act="evEditClose">완료</button></span></div><div class="g-edit">' +
      '<div class="field"><label>구분</label><select class="input" data-bind="P.timeline.events.' + i + '.lane" data-rerender="1">' + LANES.filter((l) => l.id !== "plan").map((l) => '<option value="' + l.id + '"' + (ed.lane === l.id ? " selected" : "") + ">" + l.name + "</option>").join("") + '</select></div>' +
      '<div class="field" style="grid-column:span 2"><label>이름</label><input class="input" data-bind="P.timeline.events.' + i + '.label" data-rerender="1" value="' + esc(ed.label) + '"></div>' +
      '<div class="field"><label>시작 (YYYY-MM)</label><input class="input mono" data-bind="P.timeline.events.' + i + '.s" data-ym="1" data-rerender="1" value="' + esc(ed.s || "") + '"></div>' +
      '<div class="field"><label>끝 (기간이면)</label><input class="input mono" data-bind="P.timeline.events.' + i + '.e" data-ym="1" data-rerender="1" value="' + esc(ed.e || "") + '"></div>' +
      '<div class="field"><label>상태</label>' + (ed.est ? '<button class="btn" data-act="evOk" data-i="' + i + '">추정 → 확정</button>' : '<span class="tag" style="padding:8px">확정</span>') + "</div>" +
      '<div class="field" style="grid-column:1/-1"><label>메모</label><input class="input" data-bind="P.timeline.events.' + i + '.note" value="' + esc(ed.note || "") + '"></div></div></section>';
  }
  return drawingHead("gantt", "태어난 해부터 100세까지를 하나의 연표에. 지나온 기간은 막대, 이정표는 ◆, 앞으로의 계획은 빈 막대와 ◇로 그려요. 행을 누르면 편집할 수 있어요.") +
    '<div class="dwg-bar"><div class="row" style="gap:6px">' + [["all", "전 생애"], ["past", "지난 20년"], ["next", "앞으로 20년"]].map(([k, l]) => '<button class="chip ' + (rng === k ? "on" : "") + '" data-act="ganttRange" data-v="' + k + '">' + l + "</button>").join("") + '</div><div class="gantt-legend" style="margin-left:auto"><span><svg width="22" height="10"><rect width="22" height="10" rx="3" style="fill:var(--accent)"/></svg>지나온 기간</span><span><svg width="22" height="10"><rect x=".6" y=".6" width="20.8" height="8.8" rx="3" style="fill:var(--accent-2);stroke:var(--accent)"/></svg>앞으로</span><span><svg width="12" height="12"><rect x="2" y="2" width="8" height="8" transform="rotate(45 6 6)" style="fill:var(--ink)"/></svg>이정표</span><span><svg width="12" height="12"><rect x="2" y="2" width="8" height="8" transform="rotate(45 6 6)" style="fill:var(--sheet);stroke:var(--c-wants);stroke-width:1.8"/></svg>원하는 것</span><span><svg width="12" height="12"><rect x="2" y="2" width="8" height="8" transform="rotate(45 6 6)" style="fill:var(--ink-4)"/></svg>추정</span></div><button class="btn sm ghost" data-act="ganttWants">' + (S.ui.ganttAllWants ? "중요한 것만" : "원하는 것 모두") + '</button><button class="btn sm" data-act="evNew">' + I.plus + "이정표 추가</button></div>" +
    edit + ganttSVG(P) +
    (undated.length ? '<div class="banner" style="margin-top:12px">연도가 없어 표시되지 않은 이정표: ' + undated.map((e) => '<button class="chip" data-act="evEdit" data-id="' + e.id + '">' + esc(e.label) + "</button>").join(" ") + "</div>" : "") +
    '<details class="tbl"><summary>표로 보기</summary><table><thead><tr><th>구분</th><th>항목</th><th>시작</th><th>끝</th><th>상태</th></tr></thead><tbody>' + P.timeline.events.slice().sort((a, b) => (ym2num(a.s) ?? 9999) - (ym2num(b.s) ?? 9999)).map((e) => "<tr><td>" + esc(LANE_BY[e.lane]?.name) + "</td><td>" + esc(e.label) + "</td><td>" + esc(fmtYM(e.s)) + "</td><td>" + esc(e.e ? fmtYM(e.e) : "") + "</td><td>" + (e.est ? "추정" : "확정") + "</td></tr>").join("") + "</tbody></table></details>" +
    '<div class="dwg-foot">' + titleBlock([["제목", "연표"], ["판", revStr()], ["날짜", fmtDot(nowISO())], ["항목", String(P.timeline.events.length) + " + " + P.wants.items.filter((w) => wantYear(w)).length], ["축척", ({ all: "1Y=9px", past: "1Y=36px", next: "1Y=36px" })[rng]]]) + "</div>";
}
