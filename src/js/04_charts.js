/* ============================================================ SVG chart helpers (themed via inline style + CSS vars) */
const st = (o) => 'style="' + Object.entries(o).map(([k, v]) => k + ":" + v).join(";") + '"';

/* radar: axes=[{label}], series=[{name,color,vals:[0..max|null]}] */
function radarSVG(axes, series, o) {
  o = Object.assign({ size: 320, max: 10, rings: [0.25, 0.5, 0.75, 1], labels: true, pad: 58 }, o || {});
  const W = o.size, cx = W / 2, cy = W / 2, R = W / 2 - o.pad, n = axes.length;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i, f) => [cx + Math.cos(ang(i)) * R * f, cy + Math.sin(ang(i)) * R * f];
  let g = "";
  o.rings.forEach((f) => { g += '<polygon points="' + axes.map((_, i) => pt(i, f).map((v) => v.toFixed(1)).join(",")).join(" ") + '" ' + st({ fill: "none", stroke: "var(--rule)", "stroke-width": "1" }) + "/>"; });
  axes.forEach((_, i) => { const [x, y] = pt(i, 1); g += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" ' + st({ stroke: "var(--rule)", "stroke-width": "1" }) + "/>"; });
  series.forEach((s) => {
    const pts = s.vals.map((v, i) => pt(i, clamp((v ?? 0) / o.max, 0, 1)));
    g += '<polygon points="' + pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ") + '" ' + st({ fill: s.color, "fill-opacity": ".10", stroke: s.color, "stroke-width": "2", "stroke-linejoin": "round" }) + "/>";
    pts.forEach((p, i) => {
      const has = s.vals[i] != null;
      g += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (o.dot || 4) + '" ' + st({ fill: has ? s.color : "var(--sheet)", stroke: has ? "var(--sheet)" : s.color, "stroke-width": "2" }) + "><title>" + esc(axes[i].label + " · " + s.name + " " + (has ? s.vals[i] : "미응답")) + "</title></circle>";
    });
  });
  if (o.labels) axes.forEach((a, i) => {
    const [x, y] = pt(i, 1); const dx = Math.cos(ang(i)), dy = Math.sin(ang(i));
    const tx = x + dx * 20, ty = y + dy * 18 + 4;
    const anchor = Math.abs(dx) < 0.25 ? "middle" : dx > 0 ? "start" : "end";
    g += '<text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" text-anchor="' + anchor + '" ' + st({ fill: "var(--ink-2)", "font-size": (o.fs || 12) + "px", "font-weight": "600" }) + ">" + esc(a.label) + "</text>";
    if (a.sub) g += '<text x="' + tx.toFixed(1) + '" y="' + (ty + 14).toFixed(1) + '" text-anchor="' + anchor + '" class="tick">' + esc(a.sub) + "</text>";
  });
  return '<svg viewBox="0 0 ' + W + " " + W + '" width="100%" style="max-width:' + W + 'px;display:block;margin:0 auto" role="img" aria-label="' + esc(o.aria || "레이더 차트") + '">' + g + "</svg>";
}

/* line (single series over time). pts=[{t:Date|num, y}] */
function lineSVG(pts, o) {
  o = Object.assign({ w: 560, h: 170, ymax: 100, color: "var(--accent)", yTicks: [0, 50, 100], suffix: "%" }, o || {});
  const L = 34, Rr = 44, T = 12, B = 24, W = o.w, H = o.h;
  if (!pts.length) return "";
  const xs = pts.map((p) => +p.t); let x0 = Math.min(...xs), x1 = Math.max(...xs);
  if (x1 === x0) { x0 -= 86400000 * 3; x1 += 86400000 * 3; }
  const X = (t) => L + ((+t - x0) / (x1 - x0)) * (W - L - Rr), Y = (v) => T + (1 - v / o.ymax) * (H - T - B);
  let g = "";
  o.yTicks.forEach((v) => { g += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" ' + st({ stroke: "var(--rule-2)", "stroke-width": "1" }) + '/><text x="' + (L - 6) + '" y="' + (Y(v) + 3) + '" text-anchor="end" class="tick">' + v + "</text>"; });
  const d = pts.map((p, i) => (i ? "L" : "M") + X(p.t).toFixed(1) + " " + Y(p.y).toFixed(1)).join(" ");
  g += '<path d="' + d + " L" + X(pts[pts.length - 1].t).toFixed(1) + " " + Y(0) + " L" + X(pts[0].t).toFixed(1) + " " + Y(0) + ' Z" ' + st({ fill: o.color, "fill-opacity": ".10" }) + "/>";
  g += '<path d="' + d + '" ' + st({ fill: "none", stroke: o.color, "stroke-width": "2", "stroke-linejoin": "round", "stroke-linecap": "round" }) + "/>";
  const last = pts[pts.length - 1];
  g += '<circle cx="' + X(last.t) + '" cy="' + Y(last.y) + '" r="4.5" ' + st({ fill: o.color, stroke: "var(--sheet)", "stroke-width": "2" }) + "/>";
  g += '<text x="' + (X(last.t) + 8) + '" y="' + (Y(last.y) + 4) + '" ' + st({ fill: "var(--ink)", "font-size": "12px", "font-weight": "600" }) + ">" + last.y + o.suffix + "</text>";
  const fd = (t) => { const dd = new Date(t); return dd.getMonth() + 1 + "." + dd.getDate(); };
  g += '<text x="' + L + '" y="' + (H - 6) + '" class="tick">' + fd(x0) + '</text><text x="' + (W - Rr) + '" y="' + (H - 6) + '" text-anchor="end" class="tick">' + fd(x1) + "</text>";
  pts.forEach((p) => { g += '<circle cx="' + X(p.t) + '" cy="' + Y(p.y) + '" r="10" fill="transparent"><title>' + esc(fd(p.t) + " · " + p.y + o.suffix) + "</title></circle>"; });
  return '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" role="img" aria-label="' + esc(o.aria || "추이") + '">' + g + "</svg>";
}

/* DISC quadrant */
function quadSVG(dt, size) {
  size = size || 260; const p = 30, R = (size - p * 2) / 2, c = size / 2;
  let g = '<rect x="' + p + '" y="' + p + '" width="' + (size - 2 * p) + '" height="' + (size - 2 * p) + '" ' + st({ fill: "var(--sheet-2)", stroke: "var(--rule)" }) + "/>";
  g += '<line x1="' + c + '" y1="' + p + '" x2="' + c + '" y2="' + (size - p) + '" ' + st({ stroke: "var(--rule)" }) + '/><line x1="' + p + '" y1="' + c + '" x2="' + (size - p) + '" y2="' + c + '" ' + st({ stroke: "var(--rule)" }) + "/>";
  const q = [["C", "신중형", p + 8, p + 18, "start"], ["D", "주도형", size - p - 8, p + 18, "end"], ["S", "안정형", p + 8, size - p - 10, "start"], ["I", "사교형", size - p - 8, size - p - 10, "end"]];
  q.forEach(([k, n, x, y, a]) => { const on = dt.top.includes(k); g += '<text x="' + x + '" y="' + y + '" text-anchor="' + a + '" ' + st({ fill: on ? "var(--ink)" : "var(--ink-3)", "font-size": "11.5px", "font-weight": on ? "700" : "500" }) + ">" + k + " " + n + (dt.n ? " " + dt.t[k] : "") + "</text>"; });
  g += '<text x="' + c + '" y="' + (p - 10) + '" text-anchor="middle" class="tick">과제 중심</text><text x="' + c + '" y="' + (size - p + 18) + '" text-anchor="middle" class="tick">사람 중심</text>';
  g += '<text x="' + (p - 4) + '" y="' + (c + 3) + '" text-anchor="end" class="tick">신중</text>';
  g += '<text x="' + (size - p + 4) + '" y="' + (c + 3) + '" text-anchor="start" class="tick">속도</text>';
  if (dt.n) {
    const x = c + dt.x * R * 0.92, y = c - dt.y * R * 0.92;
    g += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="14" ' + st({ fill: "var(--c-energy)", "fill-opacity": ".15" }) + "/>";
    g += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="6" ' + st({ fill: "var(--c-energy)", stroke: "var(--sheet)", "stroke-width": "2" }) + "><title>나의 위치 (" + dt.n + "문항)</title></circle>";
  }
  return '<svg viewBox="0 0 ' + size + " " + size + '" width="100%" style="max-width:' + size + 'px;display:block;margin:0 auto" role="img" aria-label="업무 스타일 사분면">' + g + "</svg>";
}

/* trait bars (Big Five) as HTML */
function traitRows(tr, withDesc) {
  return TRAIT_ORDER.map((k) => {
    const T = TRAITS[k], s = tr[k].score, L2 = lvl(s);
    const pct = s == null ? 0 : ((s - 1) / 4) * 100;
    return '<div class="trait"><div class="nm">' + T.name + "<small>" + T.lo + " ↔ " + T.hi + '</small></div><div class="track"><span class="mid"></span><i ' + st({ width: pct + "%", background: "var(--c-traits)", opacity: s == null ? ".25" : "1" }) + '></i></div><div class="v">' + (s == null ? "–" : s.toFixed(1)) + "</div>" +
      (withDesc && s != null ? '<div class="trait-desc"><b>' + LVL_KO[L2] + "</b> · " + T.d[L2] + "</div>" : "") + "</div>";
  }).join("");
}

/* wheel dumbbell (satisfaction vs importance×2), sorted by gap */
function wheelDumbbell(ws) {
  const rows = ws.filter((w) => w.sat != null && w.imp != null).sort((a, b) => b.gap - a.gap);
  if (!rows.length) return '<div class="empty">라이프 휠을 채우면 영역별 차이가 보여요.</div>';
  const W = 560, rowH = 30, L = 70, Rr = 40, T = 22;
  const H = T + rows.length * rowH + 16;
  const X = (v) => L + (v / 10) * (W - L - Rr);
  let g = "";
  [0, 5, 10].forEach((v) => { g += '<line x1="' + X(v) + '" x2="' + X(v) + '" y1="' + (T - 6) + '" y2="' + (H - 12) + '" ' + st({ stroke: "var(--rule-2)" }) + '/><text x="' + X(v) + '" y="' + (T - 10) + '" text-anchor="middle" class="tick">' + v + "</text>"; });
  rows.forEach((w, i) => {
    const y = T + i * rowH + rowH / 2; const a = X(w.sat), b = X(w.imp * 2);
    g += '<text x="' + (L - 10) + '" y="' + (y + 4) + '" text-anchor="end" ' + st({ fill: "var(--ink)", "font-size": "12.5px", "font-weight": i < 3 && w.gap > 0 ? "700" : "500" }) + ">" + esc(w.name) + "</text>";
    g += '<line x1="' + Math.min(a, b) + '" x2="' + Math.max(a, b) + '" y1="' + y + '" y2="' + y + '" ' + st({ stroke: w.gap > 0 ? "var(--signal)" : "var(--ink-4)", "stroke-width": "2", "stroke-opacity": ".55" }) + "/>";
    g += '<circle cx="' + b + '" cy="' + y + '" r="5" ' + st({ fill: "var(--c-loves)", stroke: "var(--sheet)", "stroke-width": "2" }) + "><title>" + esc(w.name + " 중요도 " + w.imp + "/5") + "</title></circle>";
    g += '<circle cx="' + a + '" cy="' + y + '" r="5" ' + st({ fill: "var(--c-values)", stroke: "var(--sheet)", "stroke-width": "2" }) + "><title>" + esc(w.name + " 만족도 " + w.sat + "/10") + "</title></circle>";
    g += '<text x="' + (W - 6) + '" y="' + (y + 4) + '" text-anchor="end" class="tick" ' + st({ fill: w.gap > 0 ? "var(--signal)" : "var(--ink-3)" }) + ">" + (w.gap > 0 ? "+" : "") + w.gap + "</text>";
  });
  return '<div class="legend" style="margin-bottom:6px"><span><i class="dot" style="background:var(--c-values)"></i>만족도(0~10)</span><span><i class="dot" style="background:var(--c-loves)"></i>중요도(×2)</span><span class="muted">오른쪽 숫자 = 중요도×2 − 만족도, 클수록 손볼 곳</span></div>' +
    '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" role="img" aria-label="라이프 휠 만족도와 중요도 비교">' + g + "</svg>";
}

/* value ranking HTML */
function valueRows(vs, topN) {
  const max = 1;
  return '<div class="vrank">' + vs.map((v, i) => '<div class="vrow' + (i < (topN || 3) && v.score != null ? " top" : "") + '"><span class="i">' + pad2(i + 1) + '</span><span class="nm">' + VAL_BY[v.id].name + '</span><span class="b"><i style="width:' + (v.score == null ? 0 : (v.score / max) * 100) + '%"></i></span><span class="v">' + (v.n ? v.wins + "/" + v.n : "–") + "</span></div>").join("") + "</div>";
}

/* compact previews for home cards */
function miniRadar(P) {
  const ws = wheelStats(P);
  if (!ws.some((w) => w.sat != null)) return placeholderSVG("라이프 휠 대기");
  return radarSVG(ws.map((w) => ({ label: w.name })), [{ name: "만족", color: "var(--c-values)", vals: ws.map((w) => w.sat) }], { size: 150, pad: 22, labels: false, dot: 2.5 });
}
function placeholderSVG(t) {
  return '<svg viewBox="0 0 200 120" width="200"><rect x="40" y="20" width="120" height="80" rx="3" ' + st({ fill: "none", stroke: "var(--rule)", "stroke-dasharray": "4 4" }) + '/><text x="100" y="64" text-anchor="middle" class="tick">' + esc(t) + "</text></svg>";
}
