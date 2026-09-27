/* ============================================================ THINK TREE · 생각 나무 */
function treeNode(id) { return S.P.tree.nodes.find((n) => n.id === id); }
function treeDesc(id) { const out = []; const walk = (pid) => S.P.tree.nodes.filter((n) => n.parent === pid).forEach((n) => { out.push(n); walk(n.id); }); walk(id); return out; }
function treeNorm(pid) { treeChildren(S.P, pid).forEach((n, i) => (n.order = i)); }
function treeAdd(parent, label) {
  const sibs = treeChildren(S.P, parent || null);
  const n = { id: uid("t"), parent: parent || null, label: label || "새 주제", memo: "", now: "", status: null, weight: null, order: sibs.length };
  S.P.tree.nodes.push(n);
  return n;
}
function treeDepth(n) { let d = 0, x = n; while (x && x.parent && d < 20) { x = treeNode(x.parent); d++; } return d; }

function treeEditor(compact) {
  const P = S.P, ns = P.tree.nodes, sel = S.ui.treeSel && treeNode(S.ui.treeSel);
  const toolbar = '<div class="tree-bar"><span class="seg3" role="group" aria-label="보기">' + [["outline", "개요"], ["mind", "마인드맵"]].map(([v, l]) => '<button class="' + (S.ui.treeView === v ? "on" : "") + '" data-act="treeView" data-v="' + v + '">' + l + "</button>").join("") + "</span>" +
    '<span class="row" style="gap:6px;flex-wrap:nowrap;flex:1;min-width:0"><input class="input" id="newNode" placeholder="' + (sel ? "'" + esc(cut(sel.label, 14)) + "' 아래에 추가" : "새 가지 이름") + '" style="min-width:0"><button class="btn primary" data-act="treeAdd">' + I.plus + (sel ? "하위 추가" : "가지 추가") + "</button></span></div>";
  if (!ns.length) {
    return toolbar + '<div class="tree-empty"><p>아직 나무가 없어요. 요즘 머릿속을 차지하는 큰 주제부터 가지로 만들어 보세요.</p><div class="row" style="gap:6px;justify-content:center">' +
      TREE_STARTERS.map((t) => '<button class="chip" data-act="treeStarter" data-v="' + esc(t) + '">' + I.plus + esc(t) + "</button>").join("") + "</div></div>";
  }
  const outline = (pid, depth) => treeChildren(P, pid).map((n) => {
    const kids = treeChildren(P, n.id), on = sel && sel.id === n.id;
    const st = n.status ? '<i class="tn-st ' + n.status + '" title="' + esc((TH_STATUS.find((x) => x[0] === n.status) || [0, ""])[1]) + '"></i>' : "";
    return '<li><div class="tn' + (on ? " on" : "") + (n.kind === "word" ? " word" : "") + '" style="--d:' + depth + '"><button class="tn-l" data-act="treeSel" data-id="' + n.id + '">' + st + "<span>" + esc(n.label) + "</span>" + (n.weight ? '<span class="tn-w">' + "●".repeat(n.weight) + "</span>" : "") + (n.now ? '<span class="tn-note" title="지금의 생각이 있어요">✎</span>' : "") + "</button>" +
      (on ? '<span class="tn-ops">' + [["treeUp", "위로", "↑"], ["treeDown", "아래로", "↓"], ["treeOut", "내어쓰기", "←"], ["treeIn", "들여쓰기", "→"]].map(([a, t, g]) => '<button class="btn sm ghost" data-act="' + a + '" title="' + t + '" aria-label="' + t + '">' + g + "</button>").join("") + "</span>" : "") + "</div>" +
      (kids.length ? "<ul>" + outline(n.id, depth + 1) + "</ul>" : "") + "</li>";
  }).join("");
  const main = S.ui.treeView === "mind" ? '<div class="tree-mind">' + treeMindSVG(P) + "</div>" : '<ul class="tree">' + outline(null, 0) + "</ul>";
  let detail = '<p class="muted" style="font-size:13px">주제를 누르면 여기에서 이름, 메모, 지금의 생각, 무게를 적을 수 있어요.</p>';
  if (sel) {
    const i = ns.indexOf(sel), kids = treeDesc(sel.id).length;
    detail = '<div class="stack" style="gap:12px"><div class="crumbs" style="margin:0">' + esc(treePath(P, sel)) + "</div>" +
      '<div class="field"><label for="tn_label">이름</label><input class="input" id="tn_label" data-bind="P.tree.nodes.' + i + '.label" data-rerender="1" value="' + esc(sel.label) + '"></div>' +
      '<div class="field"><span class="flabel">지금 이 주제는</span><div class="seg3" role="group">' + TH_STATUS.map(([v, l]) => '<button class="' + (sel.status === v ? "on" : "") + '" data-act="thStatus" data-v="' + v + '">' + l + "</button>").join("") + "</div></div>" +
      '<div class="field"><span class="flabel">마음을 차지하는 무게</span><div class="mini-seg">' + [[1, "가볍게"], [2, "자주"], [3, "크게"]].map(([v, l]) => '<button class="' + (sel.weight === v ? "on" : "") + '" data-act="thWeight" data-v="' + v + '">' + l + "</button>").join("") + "</div></div>" +
      (sel.memo || sel.src ? '<div class="memo"><span class="yr">예전 메모' + (sel.src ? " · " + esc(sel.src) : "") + "</span>" + '<textarea class="input" rows="3" data-bind="P.tree.nodes.' + i + '.memo" aria-label="예전 메모">' + esc(sel.memo || "") + "</textarea></div>"
        : '<div class="field"><label for="tn_memo">메모</label><textarea class="input" id="tn_memo" rows="3" data-bind="P.tree.nodes.' + i + '.memo" placeholder="이 주제에 대해 떠오르는 것">' + esc(sel.memo || "") + "</textarea></div>") +
      '<div class="field"><label for="tn_now">지금의 생각</label><textarea class="input" id="tn_now" rows="3" data-bind="P.tree.nodes.' + i + '.now" placeholder="예전과 무엇이 같고 무엇이 달라졌나요?">' + esc(sel.now || "") + "</textarea></div>" +
      '<div class="row" style="justify-content:space-between"><button class="btn sm ghost" data-act="treeSel" data-id="">선택 해제</button>' +
      (S.ui.confirmDel === sel.id ? '<span class="row" style="gap:6px"><span class="muted" style="font-size:12px">' + (kids ? "하위 " + kids + "개도 함께 지워요." : "") + '</span><button class="btn sm signal" data-act="treeDel">삭제</button><button class="btn sm ghost" data-act="recDelCancel">취소</button></span>' : '<button class="btn sm ghost" data-act="recDelAsk" data-id="' + sel.id + '">' + I.trash + "삭제</button>") + "</div></div>";
  }
  return toolbar + '<div class="tree-wrap' + (compact ? " compact" : "") + '"><div class="tree-main">' + main + '</div><aside class="tree-detail sheet pad">' + detail + "</aside></div>";
}

/* radial mind map: leaves spread evenly around the circle, parents sit at their children's mean angle */
function treeMindSVG(P) {
  const ns = P.tree.nodes;
  const R0 = 120, DR = 120;
  const pos = {}; let leafI = 0;
  const leaves = (id) => { const k = treeChildren(P, id); return k.length ? k.reduce((s, c) => s + leaves(c.id), 0) : 1; };
  const total = Math.max(1, treeChildren(P, null).reduce((s, c) => s + leaves(c.id), 0));
  const place = (n, d) => {
    const kids = treeChildren(P, n.id);
    let a;
    if (!kids.length) { a = ((leafI + 0.5) / total) * Math.PI * 2 - Math.PI / 2; leafI++; }
    else { const as = kids.map((k) => place(k, d + 1)); a = avg(as); }
    pos[n.id] = { a, r: R0 + d * DR, d };
    return a;
  };
  treeChildren(P, null).forEach((n) => place(n, 0));
  const maxD = Math.max(0, ...Object.values(pos).map((p) => p.d));
  const half = R0 + maxD * DR + 140, W = half * 2;
  const xy = (p) => [half + Math.cos(p.a) * p.r, half + Math.sin(p.a) * p.r];
  let g = "";
  ns.forEach((n) => {
    const p = pos[n.id]; if (!p) return; const [x, y] = xy(p);
    const pp = n.parent ? pos[n.parent] : { a: p.a, r: 0 }; if (!pp) return;
    const [px, py] = n.parent ? xy(pp) : [half, half];
    const mx = half + Math.cos(p.a) * (p.r - DR / 2), my = half + Math.sin(p.a) * (p.r - DR / 2);
    g += '<path d="M' + px.toFixed(1) + " " + py.toFixed(1) + " Q" + mx.toFixed(1) + " " + my.toFixed(1) + " " + x.toFixed(1) + " " + y.toFixed(1) + '" style="fill:none;stroke:var(--rule);stroke-width:' + (p.d === 0 ? 2 : 1.2) + '"/>';
  });
  ns.forEach((n) => {
    const p = pos[n.id]; if (!p) return; const [x, y] = xy(p);
    const right = Math.cos(p.a) >= 0, on = S.ui.treeSel === n.id;
    const col = n.status === "heavy" ? "var(--signal)" : n.status === "changed" ? "var(--accent)" : n.status === "dropped" ? "var(--ink-4)" : p.d === 0 ? "var(--ink)" : "var(--ink-3)";
    g += '<g class="mm-n" data-act="treeSel" data-id="' + n.id + '" style="cursor:pointer"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (p.d === 0 ? 7 : 4.5) + '" style="fill:' + col + ";stroke:" + (on ? "var(--accent)" : "var(--sheet)") + ";stroke-width:" + (on ? 3 : 2) + '"/>' +
      '<text x="' + (x + (right ? 10 : -10)).toFixed(1) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="' + (right ? "start" : "end") + '" class="mm-t' + (p.d === 0 ? " root" : "") + '">' + esc(cut(n.label, 18)) + "</text></g>";
  });
  g += '<circle cx="' + half + '" cy="' + half + '" r="9" style="fill:var(--ink)"/><text x="' + half + '" y="' + (half + 26) + '" text-anchor="middle" class="mm-t root">' + esc(S.P.basics.nick || S.P.basics.name || "나") + "</text>";
  return '<svg viewBox="0 0 ' + W + " " + W + '" width="' + W + '" style="max-width:none;display:block" role="img" aria-label="생각 나무 마인드맵">' + g + "</svg>";
}
function viewTree() {
  return '<div class="page-head"><div><div class="eyebrow">Think tree · 생각 나무</div><h1>생각 나무</h1><p class="lede">머릿속을 차지하는 주제를 가지처럼 뻗어 그리는 곳이에요. 주제를 누른 뒤 위아래로 옮기거나, 들여쓰기로 다른 주제 아래에 넣을 수 있어요.</p></div></div>' + treeEditor(false);
}
/* keep the mind map where the viewer left it across re-renders; center it the first time */
function afterTree() {
  const m = $(".tree-mind"); if (!m) return;
  const k = S.ui.mindScroll;
  if (k) { m.scrollLeft = k[0]; m.scrollTop = k[1]; } else { m.scrollLeft = (m.scrollWidth - m.clientWidth) / 2; m.scrollTop = (m.scrollHeight - m.clientHeight) / 2; }
  m.addEventListener("scroll", () => { S.ui.mindScroll = [m.scrollLeft, m.scrollTop]; }, { passive: true });
}
