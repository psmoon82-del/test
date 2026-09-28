/* ============================================================ MY RECORD · 나의 기록
   Scenes from the author's life, kept to the side. Claude reaches for them only when an opinion
   cannot stand on its reasoning alone. */
function viewRecords() {
  const xs = S.SC.items.slice().sort((a, b) => String(a.when || "9999").localeCompare(String(b.when || "9999")));
  const ed = S.ui.scEdit;
  const card = (s) => {
    const i = S.SC.items.indexOf(s);
    if (ed === s.id) return `<li class="sc edit"><div class="row"><input class="input when" data-bind="SC.items.${i}.when" value="${esc(s.when || "")}" placeholder="때 (예: 2004 또는 대학 3학년)"><input class="input" data-bind="SC.items.${i}.title" value="${esc(s.title)}" placeholder="제목"></div><textarea class="input" rows="6" data-bind="SC.items.${i}.text">${esc(s.text)}</textarea><div class="row"><button class="btn sm primary" data-act="scDone">다 고침</button><button class="btn sm ghost" data-act="scDel" data-id="${s.id}">${I.trash}지우기</button></div></li>`;
    const used = S.ISS.items.filter((x) => S.PC[x.id] && S.PC[x.id].iv.scenes.includes(s.id)).length;
    return `<li class="sc"><div class="w mono">${esc(s.when || "때 미상")}</div><div><div class="t">${esc(s.title)}${used ? ` <span class="tag ai">근거로 쓰임 ${used}</span>` : ""}</div><div class="tx">${nl2br(s.text)}</div></div><button class="btn sm ghost" data-act="scEdit" data-id="${s.id}" aria-label="고치기">${I.edit}</button></li>`;
  };
  const at = S.AT;
  const kinds = at ? Object.entries(at.items.reduce((m, x) => ((m[x.k] = (m[x.k] || 0) + 1), m), {})) : [];
  return `<div class="page-head"><div><div class="eyebrow">Record · 한켠에 두는 기록</div><h1>나의 기록</h1><p class="lede">살면서 겪은 장면을 모아 둡니다. 인터뷰에서 의견이 논리만으로 부족할 때만 Claude가 여기서 근거를 찾아 제안해요.</p></div></div>
<div class="stack">
<section class="sheet pad stack">
  <h3>장면 더하기</h3>
  <div class="row"><input class="input when" id="scWhen" placeholder="때 (예: 2004)"><input class="input" id="scTitle" placeholder="제목 (예: 옆 아파트에 공부방을 차림)" style="flex:1"></div>
  <textarea class="input" id="scText" rows="4" placeholder="무슨 일이 있었고, 그때 무엇을 따졌고, 어떻게 됐는지. 생각나는 만큼만."></textarea>
  <div class="row"><button class="btn primary" data-act="scAdd">${I.plus}더하기</button><span class="muted" style="font-size:12px">나만 볼 수 있게 저장돼요. 개인적인 내용은 원고를 정리할 때 빼면 돼요.</span></div>
</section>
<section class="sheet pad"><h3 style="margin-bottom:8px">장면 <span class="mono muted">${xs.length}</span></h3>${xs.length ? `<ul class="list-plain scs">${xs.map(card).join("")}</ul>` : '<p class="empty">아직 없어요.</p>'}</section>
<section class="sheet pad stack">
  <h3>Atlas 기록 가져오기</h3>
  <p class="muted">Atlas의 Pack 화면에서 '전체 JSON 저장'으로 받은 파일을 올리면, 생각 나무 메모·Records·기록·연표·딜레마 메모를 읽어 둡니다. Claude가 이슈를 제안할 때 참고해요. Atlas에는 아무것도 쓰지 않습니다.</p>
  ${at ? `<p><b>${at.items.length}개</b> <span class="muted">· ${fmtDot(at.at)} 가져옴 · ${kinds.map(([k, n]) => esc(k) + " " + n).join(", ")}</span></p>` : ""}
  <div class="row"><label class="btn">${I.up}${at ? "다시 가져오기" : "JSON 파일 올리기"}<input type="file" id="atlasFile" accept=".json,application/json" hidden></label>${at ? '<button class="btn ghost" data-act="atlasDel">가져온 기록 지우기</button>' : ""}</div>
</section>
</div>`;
}
/* Atlas "전체 JSON" (schema atlas.profile/4) → flat list of short texts */
function atlasItems(j) {
  const P = j && j.profile; if (!P) throw new Error("Atlas 전체 JSON 파일이 아니에요.");
  const out = [], seen = new Set();
  const add = (k, text, date) => { text = String(text || "").replace(/\s+/g, " ").trim(); if (text.length < 4 || seen.has(text)) return; seen.add(text); out.push({ k, text: text.slice(0, 400), date: date || null }); };
  ((P.tree && P.tree.nodes) || []).forEach((n) => { if (n.memo && !n.ai) add("생각", n.label + ": " + n.memo); });
  Object.entries((P.values && P.values.notes) || {}).forEach(([, v]) => add("딜레마", v));
  Object.entries((P.ipip && P.ipip.notes) || {}).forEach(([, v]) => add("성격", v));
  ((j.log && j.log.items) || []).forEach((x) => add("메모", x.text, x.date));
  ((P.timeline && P.timeline.events) || []).forEach((e) => add("연표", (e.s || "") + " " + e.label + (e.note ? " — " + e.note : ""), e.s));
  ((P.wants && P.wants.items) || []).forEach((w) => add("원하는 것", w.text + (w.why ? " (" + w.why + ")" : "")));
  ((P.decisions && P.decisions.items) || []).forEach((d) => add("결정", [d.title, d.situation, d.why, d.result, d.learned].filter(Boolean).join(" / ")));
  (P.ledger || []).forEach((e) => add("Records", (e.label ? e.label + ": " : "") + e.value, e.date));
  /* keep the document well under the store limit */
  let len = 0; const kept = [];
  for (const x of out) { len += x.text.length * 3 + 40; if (len > 180 * 1024) break; kept.push(x); }
  return kept;
}
