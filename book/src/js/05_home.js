/* ============================================================ HOME · 개요 */
const GOAL_PIECES = 2; /* first goal: proposal + two sample pieces */

function statusCounts() {
  const c = {}; STATUS.forEach((s) => (c[s.id] = 0));
  S.ISS.items.forEach((x) => (c[x.status] = (c[x.status] || 0) + 1));
  return c;
}
/* one next step, never a list */
function nextStep() {
  const by = (st) => S.ISS.items.find((x) => x.status === st);
  let it;
  if ((it = by("draft"))) return { t: "원고 고치기", d: it.q, act: "openDraft", id: it.id, btn: "원고 열기" };
  if ((it = by("ready"))) return { t: "초안 쓰기", d: it.q, act: "openDraft", id: it.id, btn: "초안으로" };
  if ((it = by("talk"))) return { t: "인터뷰 이어 하기", d: it.q, act: "openIv", id: it.id, btn: "이어 하기" };
  return { t: "이슈 하나 고르기", d: "이슈 지도에서 의견이 가장 뚜렷한 질문 하나를 골라 인터뷰를 시작해요.", act: "go", view: "map", btn: "이슈 지도" };
}
function viewHome() {
  const c = statusCounts(), n = nextStep(), done = c.done;
  const board = STATUS.map((s) => `<div class="kb ${s.id}"><span class="n num">${c[s.id]}</span><span class="l">${esc(s.name)}</span></div>`).join("");
  const recent = S.ISS.items.filter((x) => x.status !== "idea").slice(-5).reverse();
  return `<div class="page-head"><div><div class="eyebrow">Book · 개요</div><h1>책 쓰기</h1><p class="lede">이슈 하나를 골라 의견을 말하면 Claude가 묻고, 반론을 걸고, 초안을 씁니다. 초안을 고칠수록 내 문장이 늘어납니다.</p></div></div>
<div class="stack">
<section class="sheet pad lift stack">
  <div class="next-card"><div><div class="t">${esc(n.t)}</div><div class="d">${esc(n.d)}</div></div><button class="btn primary" data-act="${n.act}" ${n.id ? `data-id="${n.id}"` : ""} ${n.view ? `data-view="${n.view}"` : ""}>${esc(n.btn)}${I.arrow}</button></div>
  <div class="kboard">${board}</div>
</section>
<div class="grid2">
<section class="sheet pad stack">
  <h3>첫 목표</h3>
  <p class="muted">출간기획서와 샘플 ${GOAL_PIECES}꼭지. 샘플이 실제로 읽히는지 확인한 뒤에 나머지를 씁니다.</p>
  <div class="goal-row"><span>샘플 꼭지</span><div class="meter"><i style="width:${Math.min(100, (done / GOAL_PIECES) * 100)}%"></i></div><span class="mono">${Math.min(done, GOAL_PIECES)}/${GOAL_PIECES}</span></div>
  <div class="goal-row"><span>출간기획서</span><div class="meter"><i style="width:0%"></i></div><span class="mono muted">다음 판</span></div>
</section>
<section class="sheet pad stack">
  <h3>최근 다룬 이슈</h3>
  ${recent.length ? `<ul class="list-plain">${recent.map((x) => `<li><span class="tag st-${x.status}">${esc(STATUS_BY[x.status].name)}</span><a href="#" data-act="${x.status === "talk" || x.status === "ready" ? "openIv" : "openDraft"}" data-id="${x.id}">${esc(x.q)}</a></li>`).join("")}</ul>` : `<p class="empty">아직 인터뷰한 이슈가 없어요.</p>`}
  <p class="muted" style="font-size:12px">나의 기록: 장면 ${S.SC.items.length}개${S.AT ? ` · Atlas 기록 ${S.AT.items.length}개` : ""}</p>
</section>
</div>
<details class="sheet pad diag diag-home"><summary>연결 상태</summary><div class="diag-body"></div></details>
</div>`;
}
