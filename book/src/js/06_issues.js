/* ============================================================ ISSUE MAP · 이슈 지도 (the book's table of contents) */
function viewIssues() {
  const f = S.ui.area || "all", busy = S.ui.busy.sug;
  const areas = AREAS.filter((a) => f === "all" || a.id === f);
  const chips = [["all", "전체"]].concat(AREAS.map((a) => [a.id, a.name])).map(([k, l]) => {
    const n = k === "all" ? S.ISS.items.length : S.ISS.items.filter((x) => x.area === k).length;
    return `<button class="chip ${f === k ? "on" : ""}" data-act="area" data-v="${k}">${esc(l)} <span class="mono muted">${n}</span></button>`;
  }).join("");
  const row = (x) => `<li class="iss">
    <div class="q"><span class="tag st-${x.status}">${esc(STATUS_BY[x.status].name)}</span><span>${esc(x.q)}</span>${x.ai ? '<span class="tag ai">Claude 제안</span>' : ""}</div>
    ${x.why ? `<div class="why">근거: ${esc(x.why)}</div>` : ""}
    <div class="ops">${x.status === "draft" || x.status === "done" ? `<button class="btn sm" data-act="openDraft" data-id="${x.id}">원고</button>` : ""}<button class="btn sm ${x.status === "idea" ? "primary" : ""}" data-act="openIv" data-id="${x.id}">${x.status === "idea" ? "인터뷰 시작" : "인터뷰"}</button><button class="btn sm ghost" data-act="issueDel" data-id="${x.id}" aria-label="지우기" title="지우기">${I.trash}</button></div>
  </li>`;
  const groups = areas.map((a) => {
    const xs = S.ISS.items.filter((x) => x.area === a.id);
    if (!xs.length && f === "all") return "";
    return `<section class="sheet pad area-g"><h3>${esc(a.name)} <span class="mono muted">${xs.length}</span></h3>${xs.length ? `<ul class="list-plain">${xs.map(row).join("")}</ul>` : '<p class="empty">아직 질문이 없어요.</p>'}</section>`;
  }).join("");
  const rej = S.B.meta.rejected || [];
  return `<div class="page-head"><div><div class="eyebrow">Issues · 목차</div><h1>이슈 지도</h1><p class="lede">책의 목차가 되는 질문들입니다. 분야마다 의견이 갈리는 삶의 문제를 모읍니다. 의견이 가장 뚜렷한 것부터 인터뷰하세요.</p></div></div>
<div class="stack">
<div class="topics">${chips}</div>
<section class="sheet pad stack">
  <div class="row add-iss"><select class="input" id="newArea" aria-label="분야">${AREAS.map((a) => `<option value="${a.id}" ${a.id === f ? "selected" : ""}>${esc(a.name)}</option>`).join("")}</select><input class="input" id="newQ" placeholder="질문을 직접 적기 (예: 이직은 언제 해야 하나?)"><button class="btn" data-act="issueAdd">${I.plus}추가</button></div>
  <div class="row"><button class="btn accent" data-act="issueSuggest" ${busy || !aiAvailable() ? "disabled" : ""}>${busy ? '<span class="spinner"></span>고르는 중' : I.spark + (f === "all" ? "Claude에게 질문 제안받기" : AREA_BY[f].name + " 질문 제안받기")}</button><span class="muted" style="font-size:12px">${aiAvailable() ? "나의 기록과 Atlas 기록을 읽고 의견이 뚜렷할 만한 질문을 고릅니다. 지운 질문은 다시 제안하지 않아요." : esc(aiOffMsg())}</span></div>
  ${S.ui.err.sug ? `<p class="banner">${esc(S.ui.err.sug)}</p>` : ""}
</section>
${groups || '<p class="empty">질문이 없어요.</p>'}
${rej.length ? `<details class="sheet pad"><summary>지운 질문 ${rej.length}개</summary><ul class="list-plain">${rej.map((r, i) => `<li><span>${esc(r.q || r)}</span><button class="btn sm ghost" data-act="issueRestore" data-i="${i}">되살리기</button></li>`).join("")}</ul></details>` : ""}
</div>`;
}
