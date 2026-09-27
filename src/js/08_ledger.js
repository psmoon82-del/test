/* ============================================================ LEDGER · 원장 */
const STALE_DAYS = 365;
function addEntry(f) {
  const now = nowISO();
  const e = Object.assign({ id: uid("f"), cat: "etc", sub: "", label: "", value: "", date: null, sens: "normal", conf: "sure", src: "", at: now, up: now }, f);
  if (!f.sens) e.sens = SENSITIVE_CATS.has(e.cat) ? "sensitive" : "normal";
  S.P.ledger.push(e);
  return e;
}
function isStale(e) { const t = Date.parse(e.up || e.at); return !isNaN(t) && Date.now() - t > STALE_DAYS * 86400000; }
function catCount(P, c) {
  const n = P.ledger.filter((e) => e.cat === c).length;
  const extra = c === "taste" ? allLoveItems(P).length : c === "thoughts" ? P.tree.nodes.filter((x) => x.kind !== "word").length : c === "goals" ? P.wants.items.length : c === "history" ? P.timeline.events.length : 0;
  return n + extra;
}
/* structured sections that also belong to a ledger category */
function catLinked(P, c) {
  const b = P.basics;
  const link = (label, act, attrs) => '<button class="btn sm" data-act="' + act + '" ' + (attrs || "") + ">" + label + I.arrow + "</button>";
  switch (c) {
    case "basic": return '<div class="kv">' + [["이름", b.name], ["출생", b.birthYear ? b.birthYear + (b.birthEst ? " (추정)" : "") : ""], ["사는 곳", b.region], ["가족", b.family], ["하는 일", b.job]].map(([k, v]) => "<div><span>" + k + "</span><b>" + (v ? esc(v) : '<i class="muted">—</i>') + "</b></div>").join("") + "</div>" + link("기본 정보 고치기", "openCh", 'data-id="basics"');
    case "mind": { const tr = ipipScores(P), vs = valueScores(P).filter((v) => v.n).slice(0, 3), el = energyLists(P);
      return '<p class="linked-sum">' + [TRAIT_ORDER.some((k) => tr[k].n) ? "성격 " + TRAIT_ORDER.filter((k) => tr[k].n).map((k) => TRAITS[k].name + " " + tr[k].score.toFixed(1)).join(" · ") : "", vs.length ? "가치 " + vs.map((v) => VAL_BY[v.id].name).join(" › ") : "", el.c.length ? "충전 " + el.c.slice(0, 4).map((a) => shortAct(a.t)).join(", ") : ""].filter(Boolean).map(esc).join("<br>") + "</p>" + link("지표 보기", "go", 'data-view="metrics"'); }
    case "taste": return '<p class="linked-sum">좋아하는 것 ' + allLoveItems(P).length + "개 · " + LOVE_CATS.filter((x) => (P.loves.cats[x.id]?.items || []).length).map((x) => x.name).join(", ") + "</p>" + link("취향 탐구 열기", "openCh", 'data-id="loves"');
    case "thoughts": return '<p class="linked-sum">가지 ' + treeChildren(P, null).length + "개 · 주제 " + P.tree.nodes.filter((x) => x.parent && x.kind !== "word").length + "개</p>" + link("생각 나무 열기", "go", 'data-view="tree"');
    case "goals": return '<p class="linked-sum">원하는 것 ' + P.wants.items.length + "개 · 진행 중 " + P.wants.items.filter((w) => w.status === "doing").length + "</p>" + link("원하는 것 열기", "openCh", 'data-id="wants"');
    case "history": return '<p class="linked-sum">이정표 ' + P.timeline.events.length + "개 · 추정 " + P.timeline.events.filter((e) => e.est).length + "</p>" + link("인생 연표 열기", "go", 'data-view="gantt"');
  }
  return "";
}
function viewLedger() {
  const P = S.P, cur = S.ui.ledCat;
  const staleAll = P.ledger.filter(isStale).length;
  const idx = '<nav class="led-index" aria-label="원장 분류"><button class="led-cat ' + (!cur ? "on" : "") + '" data-act="ledCat" data-id=""><span>전체</span><span class="n">' + P.ledger.length + "</span></button>" +
    LEDGER_CATS.map((c) => { const n = catCount(P, c.id), st = P.ledger.filter((e) => e.cat === c.id && isStale(e)).length;
      return '<button class="led-cat ' + (cur === c.id ? "on" : "") + (n ? "" : " empty") + '" data-act="ledCat" data-id="' + c.id + '"><span>' + c.name + '</span><span class="n">' + (st ? '<i class="stale-dot" title="확인 필요 ' + st + '"></i>' : "") + n + "</span></button>"; }).join("") + "</nav>";
  const cats = cur ? [CAT_BY[cur]] : LEDGER_CATS.filter((c) => P.ledger.some((e) => e.cat === c.id));
  let body = "";
  cats.forEach((c) => {
    const rows = P.ledger.map((e, i) => ({ e, i })).filter((o) => o.e.cat === c.id);
    const subs = Array.from(new Set(rows.map((o) => o.e.sub || "")));
    subs.sort((a, b) => (c.subs.indexOf(a) + 99 * !a) - (c.subs.indexOf(b) + 99 * !b));
    body += '<section class="led-sec"><header><h2>' + esc(c.name) + '</h2><span class="muted">' + esc(c.d) + "</span></header>" +
      (cur ? catLinked(P, c.id) : "") +
      (rows.length ? subs.map((sb) => '<div class="led-group">' + (sb ? '<div class="led-sub">' + esc(sb) + "</div>" : "") + rows.filter((o) => (o.e.sub || "") === sb).sort((a, b) => String(b.e.up).localeCompare(String(a.e.up))).map(entryRow).join("") + "</div>").join("")
        : cur ? '<p class="empty">아직 기록이 없어요. 아래에서 추가해 보세요.</p>' : "") +
      (cur ? entryAdder(c) : "") + "</section>";
  });
  if (!cats.length) body = '<p class="empty">원장이 비어 있어요. 왼쪽에서 분류를 골라 첫 기록을 남겨 보세요.</p>';
  return '<div class="page-head"><div><div class="eyebrow">Ledger · 원장</div><h1>나에 대한 모든 기록</h1><p class="lede">분류별로 사실을 쌓는 곳이에요. 직접 적은 것, 인터뷰와 기록에서 뽑은 것이 모두 여기에 모여요. 1년 넘게 손대지 않은 항목에는 확인 표시가 붙어요.</p></div>' +
    '<input class="input" id="ledQ" placeholder="원장 검색" value="' + esc(S.ui.ledQ || "") + '" style="max-width:240px"></div>' +
    (staleAll ? '<div class="banner" style="margin-bottom:14px"><span>1년 넘게 확인하지 않은 항목이 <b>' + staleAll + "개</b> 있어요. 항목 옆의 <b>아직 맞아요</b>를 누르거나 고쳐 주세요.</span></div>" : "") +
    '<div class="led">' + idx + '<div class="led-body" id="ledBody">' + body + "</div></div>";
}
function entryRow({ e, i }) {
  const q = esc((entryText(e) + " " + (e.sub || "") + " " + CAT_BY[e.cat].name).toLowerCase());
  if (S.ui.ledEdit === e.id) {
    const c = CAT_BY[e.cat];
    return '<div class="entry editing" data-q="' + q + '"><div class="entry-form">' +
      '<select class="input" data-bind="P.ledger.' + i + '.cat" data-rerender="1" aria-label="분류">' + LEDGER_CATS.map((x) => '<option value="' + x.id + '"' + (x.id === e.cat ? " selected" : "") + ">" + x.name + "</option>").join("") + "</select>" +
      '<input class="input" list="subs_' + c.id + '" data-bind="P.ledger.' + i + '.sub" value="' + esc(e.sub || "") + '" placeholder="세부 분류" aria-label="세부 분류"><datalist id="subs_' + c.id + '">' + c.subs.map((x) => '<option value="' + esc(x) + '">').join("") + "</datalist>" +
      '<input class="input" data-bind="P.ledger.' + i + '.label" value="' + esc(e.label || "") + '" placeholder="항목 (예: 혈압)" aria-label="항목">' +
      '<input class="input mono" data-bind="P.ledger.' + i + '.date" data-ym="1" value="' + esc(e.date || "") + '" placeholder="날짜 YYYY-MM" aria-label="날짜">' +
      '<textarea class="input" rows="2" data-bind="P.ledger.' + i + '.value" aria-label="내용">' + esc(e.value || "") + "</textarea>" +
      '<div class="row" style="gap:6px"><span class="mini-seg">' + SENS.map(([v, l]) => '<button class="' + (e.sens === v ? "on" : "") + '" data-act="entrySet" data-i="' + i + '" data-k="sens" data-v="' + v + '">' + l + "</button>").join("") + '</span><span class="mini-seg">' + CONF.map(([v, l]) => '<button class="' + (e.conf === v ? "on" : "") + '" data-act="entrySet" data-i="' + i + '" data-k="conf" data-v="' + v + '">' + l + "</button>").join("") + '</span><span style="flex:1"></span>' +
      (S.ui.confirmDel === e.id ? '<button class="btn sm signal" data-act="entryDel" data-id="' + e.id + '">삭제</button><button class="btn sm ghost" data-act="recDelCancel">취소</button>' : '<button class="btn sm ghost" data-act="recDelAsk" data-id="' + e.id + '">' + I.trash + "삭제</button>") +
      '<button class="btn sm primary" data-act="entryEdit" data-id="">완료</button></div></div></div>';
  }
  const stale = isStale(e);
  return '<div class="entry" data-q="' + q + '"><button class="entry-main" data-act="entryEdit" data-id="' + e.id + '" aria-label="고치기">' +
    (e.label ? '<span class="entry-k">' + esc(e.label) + "</span>" : "") + '<span class="entry-v">' + esc(e.value) + "</span></button>" +
    '<div class="entry-meta">' + (e.date ? '<span class="mono">' + esc(fmtYM(e.date)) + "</span>" : "") + (e.conf === "est" ? '<span class="tag est">추정</span>' : "") + (e.sens === "sensitive" ? '<span class="tag sens">민감</span>' : "") +
    (e.src ? '<span class="src">' + esc(srcLabel(e.src)) + "</span>" : "") + (stale ? '<button class="btn sm stale" data-act="entryOk" data-id="' + e.id + '">아직 맞아요</button>' : "") + "</div></div>";
}
function entryAdder(c) {
  return '<div class="entry-add"><div class="entry-form">' +
    '<input class="input" id="newEntSub" list="subs_add_' + c.id + '" placeholder="세부 분류 (선택)" aria-label="세부 분류"><datalist id="subs_add_' + c.id + '">' + c.subs.map((x) => '<option value="' + esc(x) + '">').join("") + "</datalist>" +
    '<input class="input" id="newEntLabel" placeholder="항목 (예: ' + esc(({ health: "혈압", money: "월 소득", work: "현재 직무", family: "배우자 생일", home: "거주 형태", routine: "기상 시간", basic: "최종 학력" })[c.id] || "항목") + ')" aria-label="항목">' +
    '<input class="input mono" id="newEntDate" placeholder="날짜 YYYY-MM (선택)" aria-label="날짜">' +
    '<textarea class="input" id="newEntValue" rows="2" placeholder="내용" aria-label="내용"></textarea>' +
    '<div class="row" style="gap:6px"><label class="check"><input type="checkbox" id="newEntEst"> 추정</label><span style="flex:1"></span><button class="btn primary" data-act="entryAdd" data-cat="' + c.id + '">' + I.plus + "기록하기</button></div></div></div>";
}
function applyLedSearch() {
  const q = (S.ui.ledQ || "").trim().toLowerCase();
  $$("#ledBody .entry").forEach((el) => { el.hidden = q && !el.dataset.q.includes(q); });
}
