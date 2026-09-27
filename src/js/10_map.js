/* ============================================================ LD-02 LIVING MAP */
function shortAct(t) { return t.replace(/\s*\(.*?\)\s*/g, "").trim(); }
function buildGraph(P) {
  const nodes = [], links = [];
  const me = { id: "me", label: P.basics.nick || P.basics.name || "나", kind: "center", dom: null };
  nodes.push(me);
  DOMAINS.forEach((d) => { nodes.push({ id: "h_" + d.id, label: d.name, kind: "hub", dom: d.id }); links.push({ s: "me", t: "h_" + d.id, k: "hub" }); });
  const leaf = (dom, id, label, detail, w) => { nodes.push({ id, label, detail: detail || "", kind: "leaf", dom, w: w || 1 }); links.push({ s: "h_" + dom, t: id, k: "leaf" }); };
  // values
  const vs = valueScores(P).filter((v) => v.n);
  if (vs.length) vs.slice(0, 5).forEach((v, i) => leaf("values", "v_" + v.id, VAL_BY[v.id].name, VAL_BY[v.id].d + " · 순위 " + (i + 1), 3 - Math.min(2, i)));
  else ((P.prior && P.prior.valuesTop3) || []).forEach((id) => leaf("values", "v_" + id, VAL_BY[id].name, VAL_BY[id].d + " · 직접 고른 가치", 2));
  // traits
  const tr = ipipScores(P);
  TRAIT_ORDER.forEach((k) => { const s = tr[k].score; if (s == null) return; const L2 = lvl(s); if (L2 === "mid") return; leaf("traits", "t_" + k, TRAITS[k].name + " " + LVL_KO[L2], TRAITS[k].d[L2], 2); });
  // energy
  energyLists(P).c.slice(0, 7).forEach((a) => leaf("energy", "e_" + a.id, shortAct(a.t), "하고 나면 충전되는 활동", 2));
  const dt = discTally(P); if (dt.n) leaf("energy", "e_disc", "일하는 방식: " + dt.top.map((k) => DISC[k].name).join("·"), dt.top.map((k) => DISC[k].d).join(" "), 2);
  if (P.energy.flowChild) leaf("energy", "e_flowchild", "어릴 적 몰입", P.energy.flowChild, 1);
  // loves
  allLoveItems(P).sort((a, b) => (b.why ? 1 : 0) - (a.why ? 1 : 0)).slice(0, 16).forEach((it) => leaf("loves", "l_" + it.id, it.name, it.why || LOVE_CATS.find((c) => c.id === it.cat).name, it.why ? 2 : 1));
  // thoughts
  P.thoughts.items.filter((x) => x.status !== "dropped").sort((a, b) => (b.weight || (b.status === "heavy" ? 2 : 0) || (b.memo ? 1 : 0)) - (a.weight || (a.status === "heavy" ? 2 : 0) || (a.memo ? 1 : 0))).slice(0, 12)
    .forEach((x) => leaf("thoughts", "th_" + x.id, x.label, x.now || x.memo || (x.links || []).join(", "), x.weight || (x.status === "heavy" ? 3 : 1)));
  // wants
  P.wants.items.filter((w) => w.status !== "done").sort((a, b) => (b.prio || 0) - (a.prio || 0)).slice(0, 12).forEach((w) => leaf("wants", "w_" + w.id, cut(w.text, 16), WT_BY[w.type].name + " · " + (HZ_BY[w.horizon]?.[1] || "") + (w.why ? " · " + w.why : ""), w.prio || 1));
  // life: wheel focus + family
  wheelStats(P).filter((w) => w.gap != null && w.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 3).forEach((w) => leaf("life", "lf_" + w.id, w.name + "(손볼 곳)", "중요도 " + w.imp + "/5, 만족도 " + w.sat + "/10" + (w.note ? " · " + w.note : ""), 2));
  if (P.basics.family) leaf("life", "lf_family", "가족", P.basics.family, 2);
  if (P.basics.job) leaf("life", "lf_job", cut(P.basics.job, 14), P.basics.career || P.basics.job, 2);
  // AI overlays
  const ids = new Set(nodes.map((n) => n.id));
  const ai = S.AI.map;
  if (ai) {
    (ai.themes || []).forEach((t, i) => {
      const mem = t.members.filter((m) => ids.has(m)); if (!mem.length) return;
      const id = "theme_" + i; nodes.push({ id, label: t.name, detail: t.desc, kind: "theme", dom: null });
      mem.forEach((m) => links.push({ s: id, t: m, k: "theme" }));
    });
    (ai.links || []).forEach((l) => { if (ids.has(l.a) && ids.has(l.b)) links.push({ s: l.a, t: l.b, k: "ai", why: l.why }); });
  }
  return { nodes, links };
}

let d3Loading = null;
function ensureD3() {
  if (window.d3) return Promise.resolve(window.d3);
  if (d3Loading) return d3Loading;
  const srcs = ["https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js", "https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"];
  d3Loading = new Promise((res, rej) => {
    const tryLoad = (k) => {
      if (k >= srcs.length) { d3Loading = null; rej(new Error("d3")); return; }
      const s = document.createElement("script"); s.src = srcs[k]; s.async = true;
      s.onload = () => (window.d3 ? res(window.d3) : tryLoad(k + 1)); s.onerror = () => tryLoad(k + 1);
      document.head.appendChild(s);
    };
    tryLoad(0);
  });
  return d3Loading;
}

function viewMap() {
  const P = S.P, g = buildGraph(P), ai = S.AI.map, busy = S.ui.busy.map;
  const leafN = g.nodes.filter((n) => n.kind === "leaf").length;
  let bar = '<div class="dwg-bar"><div class="map-legend">' + DOMAINS.map((d) => { const n = g.nodes.filter((x) => x.dom === d.id && x.kind === "leaf").length; return '<button class="chip ' + (S.ui.mapHide[d.id] ? "" : "on") + '" data-act="mapToggle" data-v="' + d.id + '" style="' + (S.ui.mapHide[d.id] ? "" : "border-color:" + d.color + ";color:var(--ink);background:var(--sheet)") + '"><i class="dot" style="background:' + d.color + '"></i>' + d.name + " " + n + "</button>"; }).join("") + "</div>";
  bar += '<span style="margin-left:auto" class="row">';
  if (busy) bar += '<span class="typing"><span class="spinner"></span>Claude가 숨은 연결을 찾는 중이에요. 1분 정도 걸려요.</span>';
  else if (aiAvailable()) bar += '<button class="btn ' + (ai ? "" : "accent") + '" data-act="drawMap">' + I.spark + (ai ? "다시 해석" : "지도 해석하기") + "</button>";
  bar += "</span></div>";
  const themes = ai && ai.themes.length ? '<div class="row" style="justify-content:space-between;margin:20px 0 10px"><h3 style="font-size:15px">Claude가 찾은 주제</h3><span class="mono muted" style="font-size:11px">' + fmtDot(ai.at) + " · REV." + pad2(ai.rev || 0) + '</span></div><div class="themes">' + ai.themes.map((t, i) => '<button class="theme" style="text-align:left" data-act="mapSel" data-id="theme_' + i + '"><b>' + esc(t.name) + "</b><p>" + esc(t.desc) + '</p><span class="mono muted" style="font-size:10.5px">' + t.members.length + "개 노드</span></button>").join("") + "</div>" :
    '<p class="muted" style="margin-top:14px;font-size:13px">' + (aiAvailable() ? '"지도 해석하기"를 누르면 서로 다른 영역 사이의 숨은 연결과 3~5개의 주제를 찾아 지도 위에 겹쳐 그려요.' : "지금은 영역별 연결만 보여요. Claude 연결이 있는 화면에서 숨은 연결을 찾을 수 있어요.") + "</p>";
  const tbl = '<details class="tbl"><summary>표로 보기 (노드 ' + g.nodes.length + " · 연결 " + g.links.length + ')</summary><table><thead><tr><th>영역</th><th>노드</th><th>설명</th></tr></thead><tbody>' + g.nodes.filter((n) => n.kind === "leaf").map((n) => "<tr><td>" + esc(DOM_BY[n.dom].name) + "</td><td>" + esc(n.label) + "</td><td>" + esc(cut(n.detail, 80)) + "</td></tr>").join("") + "</tbody></table>" +
    (ai && ai.links.length ? '<table style="margin-top:10px"><thead><tr><th>연결</th><th>이유</th></tr></thead><tbody>' + ai.links.map((l) => { const a = g.nodes.find((n) => n.id === l.a), c = g.nodes.find((n) => n.id === l.b); return a && c ? "<tr><td>" + esc(a.label) + " ↔ " + esc(c.label) + "</td><td>" + esc(l.why) + "</td></tr>" : ""; }).join("") + "</tbody></table>" : "") + "</details>";
  return drawingHead("map", "성격·가치·에너지·취향·마음속 주제·원하는 것을 하나의 지도에. 노드를 끌거나 눌러 보세요. 가운데의 나에서 가까울수록 자주 연결된 것들이에요.") + bar +
    '<div class="map-wrap" id="mapWrap"><svg id="mapSvg" aria-label="관계 지도 (노드 ' + leafN + '개)"></svg><div class="map-side" id="mapSide" hidden></div><div id="mapMsg" class="empty" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">지도 엔진을 불러오는 중…</div></div>' + themes + tbl +
    '<div class="dwg-foot">' + titleBlock([["DWG NO.", "LD-02"], ["TITLE", "살아있는 지도"], ["REV", ai ? "REV." + pad2(ai.rev || 0) : "—"], ["NODES", String(leafN)], ["LINKS", String(ai ? ai.links.length : 0) + " AI"], ["SCALE", "FREE"]]) + "</div>";
}

let mapSim = null;
function afterMap() {
  ensureD3().then((d3) => drawMapD3(d3)).catch(() => { const m = $("#mapMsg"); if (m) m.textContent = "지도 엔진(d3)을 불러오지 못했어요. 네트워크를 확인한 뒤 새로고침해 주세요. 아래 표로도 볼 수 있어요."; });
}
function drawMapD3(d3) {
  const svgEl = $("#mapSvg"); if (!svgEl) return;
  const msg = $("#mapMsg"); if (msg) msg.remove();
  if (mapSim) { mapSim.stop(); mapSim = null; }
  const P = S.P, G = buildGraph(P);
  const hidden = S.ui.mapHide;
  const nodes = G.nodes.filter((n) => !(n.dom && hidden[n.dom])).map((n) => Object.assign({}, n));
  const nid = new Set(nodes.map((n) => n.id));
  const links = G.links.filter((l) => nid.has(l.s) && nid.has(l.t)).map((l) => ({ source: l.s, target: l.t, k: l.k, why: l.why }));
  // drop theme nodes that lost all members
  const W = svgEl.clientWidth || 900, H = svgEl.clientHeight || 640;
  const color = (n) => (n.kind === "center" ? cssVar("--ink") : n.kind === "theme" ? cssVar("--signal") : cssVar(DOM_BY[n.dom].color.slice(4, -1)));
  const R = (n) => (n.kind === "center" ? 18 : n.kind === "hub" ? 11 : n.kind === "theme" ? 8 : 4 + (n.w || 1) * 1.4);
  const hubAngle = {}; DOMAINS.forEach((d, i) => (hubAngle["h_" + d.id] = -Math.PI / 2 + (i * 2 * Math.PI) / DOMAINS.length));
  nodes.forEach((n) => {
    if (n.kind === "center") { n.fx = W / 2; n.fy = H / 2; }
    else if (n.kind === "hub") { n.x = W / 2 + Math.cos(hubAngle[n.id]) * 150; n.y = H / 2 + Math.sin(hubAngle[n.id]) * 130; }
    else if (n.dom) { const a = hubAngle["h_" + n.dom] + (Math.random() - 0.5) * 0.8; n.x = W / 2 + Math.cos(a) * 260; n.y = H / 2 + Math.sin(a) * 220; }
  });
  const svg = d3.select(svgEl); svg.selectAll("*").remove();
  const root = svg.append("g");
  const link = root.append("g").selectAll("line").data(links).join("line")
    .attr("stroke", (l) => (l.k === "ai" ? cssVar("--signal") : l.k === "theme" ? cssVar("--signal") : cssVar("--rule")))
    .attr("stroke-opacity", (l) => (l.k === "ai" ? 0.38 : l.k === "theme" ? 0.22 : 1))
    .attr("stroke-width", (l) => (l.k === "ai" ? 1.2 : l.k === "hub" ? 1.5 : 1))
    .attr("stroke-dasharray", (l) => (l.k === "theme" ? "3 4" : null));
  const node = root.append("g").selectAll("g").data(nodes).join("g").attr("class", "nd").style("cursor", "pointer");
  node.each(function (n) {
    const g = d3.select(this);
    if (n.kind === "theme") g.append("rect").attr("x", -7).attr("y", -7).attr("width", 14).attr("height", 14).attr("transform", "rotate(45)").attr("fill", cssVar("--sheet")).attr("stroke", color(n)).attr("stroke-width", 2);
    else g.append("circle").attr("r", R(n)).attr("fill", color(n)).attr("stroke", cssVar("--sheet-2")).attr("stroke-width", 2);
    g.append("circle").attr("r", Math.max(12, R(n) + 6)).attr("fill", "transparent");
    g.append("text").attr("class", "node-label" + (n.kind === "hub" || n.kind === "center" ? " hub" : "") + (n.kind === "theme" ? " theme-l" : ""))
      .attr("x", n.kind === "center" ? 0 : R(n) + 5).attr("y", n.kind === "center" ? 34 : 4).attr("text-anchor", n.kind === "center" ? "middle" : "start").text(n.label);
  });
  const nb = {}; links.forEach((l) => { (nb[l.source] = nb[l.source] || new Set()).add(l.target); (nb[l.target] = nb[l.target] || new Set()).add(l.source); });
  const focus = (id) => {
    if (!id) { node.style("opacity", 1); link.style("opacity", 1).attr("stroke-opacity", (l) => (l.k === "ai" ? 0.38 : l.k === "theme" ? 0.22 : 1)); return; }
    const set = nb[id] || new Set();
    node.style("opacity", (n) => (n.id === id || set.has(n.id) ? 1 : 0.18));
    link.style("opacity", (l) => { const s = l.source.id || l.source, t = l.target.id || l.target; return s === id || t === id ? 1 : 0.08; })
      .attr("stroke-opacity", (l) => { const s = l.source.id || l.source, t = l.target.id || l.target; return (s === id || t === id) && l.k === "ai" ? 0.95 : l.k === "ai" ? 0.38 : l.k === "theme" ? 0.22 : 1; });
  };
  node.on("mouseenter", (ev, n) => { if (!S.ui.mapSel) focus(n.id); }).on("mouseleave", () => { if (!S.ui.mapSel) focus(null); })
    .on("click", (ev, n) => { ev.stopPropagation(); S.ui.mapSel = n.id; focus(n.id); showMapSide(n, links, nodes); });
  svg.on("click", () => { S.ui.mapSel = null; focus(null); const s = $("#mapSide"); if (s) s.hidden = true; });
  node.call(d3.drag().on("start", (ev, n) => { if (!ev.active) sim.alphaTarget(0.2).restart(); n.fx = n.x; n.fy = n.y; })
    .on("drag", (ev, n) => { n.fx = ev.x; n.fy = ev.y; })
    .on("end", (ev, n) => { if (!ev.active) sim.alphaTarget(0); if (n.kind !== "center") { n.fx = null; n.fy = null; } }));
  const sim = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((n) => n.id).distance((l) => (l.k === "hub" ? 230 : l.k === "leaf" ? 80 : l.k === "theme" ? 120 : 200)).strength((l) => (l.k === "hub" ? 0.9 : l.k === "leaf" ? 0.8 : l.k === "theme" ? 0.05 : 0.02)))
    .force("charge", d3.forceManyBody().strength((n) => (n.kind === "hub" ? -900 : n.kind === "theme" ? -260 : -170)).distanceMax(420))
    .force("collide", d3.forceCollide().radius((n) => R(n) + (n.kind === "center" ? 30 : Math.min(62, 10 + n.label.length * 4.2))).strength(0.9))
    .force("x", d3.forceX(W / 2).strength(0.02)).force("y", d3.forceY(H / 2).strength(0.03));
  mapSim = sim;
  const tick = () => {
    link.attr("x1", (l) => l.source.x).attr("y1", (l) => l.source.y).attr("x2", (l) => l.target.x).attr("y2", (l) => l.target.y);
    node.attr("transform", (n) => "translate(" + n.x + "," + n.y + ")");
  };
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  sim.stop(); for (let i = 0; i < 320; i++) sim.tick(); tick();
  // fit everything into view
  const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y);
  const bx0 = Math.min(...xs) - 30, bx1 = Math.max(...xs) + 150, by0 = Math.min(...ys) - 30, by1 = Math.max(...ys) + 40;
  const k = Math.min(1.2, W / (bx1 - bx0), H / (by1 - by0));
  const zoom = d3.zoom().scaleExtent([0.3, 3]).on("zoom", (ev) => root.attr("transform", ev.transform));
  svg.call(zoom).call(zoom.transform, d3.zoomIdentity.translate(W / 2 - ((bx0 + bx1) / 2) * k, H / 2 - ((by0 + by1) / 2) * k).scale(k));
  if (!reduce) { sim.alpha(0.08).restart(); sim.on("tick", tick); }
  if (S.ui.mapSel) { const n = nodes.find((x) => x.id === S.ui.mapSel); if (n) { focus(n.id); showMapSide(n, links, nodes); } else S.ui.mapSel = null; }
}
function showMapSide(n, links, nodes) {
  const side = $("#mapSide"); if (!side) return;
  const byId = Object.fromEntries(nodes.map((x) => [x.id, x]));
  const rel = links.filter((l) => l.k === "ai" && ((l.source.id || l.source) === n.id || (l.target.id || l.target) === n.id)).map((l) => { const o = byId[(l.source.id || l.source) === n.id ? (l.target.id || l.target) : (l.source.id || l.source)]; return o ? "<div><b>↔ " + esc(o.label) + "</b><br>" + esc(l.why || "") + "</div>" : ""; }).join("");
  const members = n.kind === "theme" ? links.filter((l) => (l.source.id || l.source) === n.id).map((l) => byId[l.target.id || l.target]).filter(Boolean) : [];
  const dom = n.dom ? DOM_BY[n.dom] : null;
  side.innerHTML = '<div class="row" style="justify-content:space-between"><span class="k">' + (n.kind === "theme" ? "THEME · 주제" : n.kind === "hub" ? "DOMAIN · 영역" : n.kind === "center" ? "CENTER" : esc(dom ? dom.name : "")) + '</span><button class="btn sm ghost" data-act="mapClose" aria-label="닫기">×</button></div><h4>' + esc(n.label) + "</h4>" + (n.detail ? '<p style="font-size:13px;color:var(--ink-2)">' + esc(n.detail) + "</p>" : "") +
    (members.length ? '<div class="pt-tags">' + members.map((m) => "<span>" + esc(m.label) + "</span>").join("") + "</div>" : "") +
    (rel ? '<div class="k" style="margin-top:4px">숨은 연결</div><div class="rel">' + rel + "</div>" : n.kind === "leaf" && S.AI.map ? '<p class="muted" style="font-size:12px">다른 영역과 연결되지 않았어요.</p>' : "");
  side.hidden = false;
}
