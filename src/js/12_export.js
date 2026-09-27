/* ============================================================ EXPORT · Pack and files
   Packs are Markdown written for a reader who has never met the owner (a person or an AI).
   Excel sheets mirror the data model one table per sheet, so the same file can be edited and uploaded back. */
function packText(P, pack) {
  const b = P.basics, L = [];
  const who = b.nick || b.name || "나";
  L.push("# " + who + "에 대한 참고 자료 — " + pack.name);
  L.push("기준일 " + fmtDot(nowISO()) + " · Atlas에서 내보냄");
  L.push("");
  L.push("> 이 자료는 본인이 직접 정리한 기록입니다. 용도: " + pack.d + ". 이 자료를 바탕으로 답해 주고, 자료에 없는 것은 추측하지 말고 물어봐 주세요. '추정'이 붙은 항목은 확실하지 않은 정보입니다.");
  const part = (k) => pack.parts.includes(k);
  if (part("basics")) {
    L.push("", "## 기본");
    [["이름", b.name], ["호칭", b.nick], ["출생", b.birthYear ? b.birthYear + (b.birthEst ? " (추정)" : "") : ""], ["사는 곳", b.region], ["가족", b.family], ["하는 일", b.job], ["경력", b.career], ["한 문장 소개", b.intro]]
      .filter((x) => x[1]).forEach(([k, v]) => L.push("- " + k + ": " + v));
  }
  if (part("mind")) {
    const tr = ipipScores(P), vs = valueScores(P).filter((v) => v.n), el = energyLists(P), dt = discTally(P), cr = chrono(P), ws = wheelStats(P).filter((w) => w.sat != null);
    const lines = [];
    if (TRAIT_ORDER.some((k) => tr[k].n)) lines.push("성격(Big Five, 1~5): " + TRAIT_ORDER.filter((k) => tr[k].n).map((k) => TRAITS[k].name + " " + tr[k].score.toFixed(1) + "(" + LVL_KO[lvl(tr[k].score)] + (tr[k].hi - tr[k].lo >= 0.5 ? ", 상황에 따라 " + tr[k].lo.toFixed(1) + "~" + tr[k].hi.toFixed(1) : "") + ")").join(", "));
    if (vs.length) lines.push("가치 우선순위: " + vs.slice(0, 6).map((v) => VAL_BY[v.id].name).join(" > "));
    if (el.c.length) lines.push("힘이 나는 활동: " + el.c.map((a) => shortAct(a.t)).join(", "));
    if (el.d.length) lines.push("진이 빠지는 활동: " + el.d.map((a) => shortAct(a.t)).join(", "));
    if (dt.n) lines.push("일하는 방식(DISC): " + dt.top.map((k) => DISC[k].name).join("·"));
    if (cr) lines.push("하루 리듬: " + cr.label);
    if (ws.length) lines.push("삶의 영역별 만족도(0~10): " + ws.map((w) => w.name + " " + w.sat).join(", "));
    if (P.energy.flowRecent) lines.push("최근 몰입: " + P.energy.flowRecent);
    if (lines.length) { L.push("", "## 성향"); lines.forEach((x) => L.push("- " + x)); }
    const sit = situational(P);
    if (sit.length) { L.push("", "### 상황에 따라 달라지는 모습", "한 가지로 고정된 성향이 아니니 조건과 함께 봐 주세요."); sit.forEach((x) => L.push("- " + x)); }
  }
  pack.cats.forEach((c) => {
    const xs = P.ledger.filter((e) => e.cat === c);
    if (!xs.length) return;
    L.push("", "## " + CAT_BY[c].name);
    const subs = Array.from(new Set(xs.map((e) => e.sub || "")));
    subs.forEach((sb) => {
      if (sb) L.push("### " + sb);
      xs.filter((e) => (e.sub || "") === sb).forEach((e) => L.push("- " + entryText(e) + (e.date ? " (" + fmtYM(e.date) + ")" : "") + (e.conf === "est" ? " · 추정" : "")));
    });
  });
  if (part("taste")) {
    const lv = LOVE_CATS.map((c) => ({ c, it: P.loves.cats[c.id]?.items || [] })).filter((x) => x.it.length);
    if (lv.length) { L.push("", "## 좋아하는 것"); lv.forEach(({ c, it }) => L.push("- " + c.name + ": " + it.map((x) => x.name + (x.why ? " (" + x.why + ")" : "")).join(", "))); }
  }
  if (part("thoughts") && P.tree.nodes.length) {
    L.push("", "## 생각 나무");
    const walk = (pid, d) => treeChildren(P, pid).forEach((n) => { L.push("  ".repeat(d) + "- " + n.label + (n.status ? " [" + (TH_STATUS.find((x) => x[0] === n.status) || [0, ""])[1] + "]" : "") + (n.now ? ": " + n.now : "")); walk(n.id, d + 1); });
    walk(null, 0);
  }
  if (part("goals") && P.wants.items.length) {
    L.push("", "## 원하는 것");
    WANT_TYPES.forEach((t) => { const xs = P.wants.items.filter((w) => w.type === t.id).sort((a, c) => (c.prio || 0) - (a.prio || 0)); if (xs.length) L.push("- " + t.name + ": " + xs.map((w) => w.text + " (" + (HZ_BY[w.horizon]?.[1] || "") + ", " + (WS_BY[w.status] || "") + ")").join("; ")); });
  }
  if (part("history")) {
    const ev = P.timeline.events.filter((e) => e.s).sort((a, c) => ym2num(a.s) - ym2num(c.s));
    if (ev.length) { L.push("", "## 연대기"); ev.forEach((e) => L.push("- " + fmtYM(e.s) + (e.e ? "~" + fmtYM(e.e) : "") + " " + e.label + (e.est ? " · 추정" : ""))); }
  }
  if (part("decisions") && P.decisions.items.length) {
    L.push("", "## 결정 일지");
    P.decisions.items.slice().sort((a, c) => String(c.date).localeCompare(String(a.date))).slice(0, 10).forEach((d) => L.push("- " + fmtYM(d.date) + " " + d.title + (d.why ? ": " + cut(d.why, 120) : "") + " (확신 " + (d.conf || "?") + "%" + (d.status === "done" ? ", 결과 " + ((DEC_MET.find((x) => x[0] === d.met) || [0, "?"])[1]) + (d.lesson ? ", 배운 점: " + cut(d.lesson, 120) : "") : ", 진행 중") + ")"));
  }
  if (part("log")) {
    const rs = S.LOG.items.slice().sort((a, c) => String(c.date).localeCompare(String(a.date))).slice(0, 15);
    if (rs.length) { L.push("", "## 최근 기록"); rs.forEach((r) => L.push("- " + fmtYM(r.date) + " " + (RT_BY[r.type]?.name || "") + ": " + cut(r.text, 200))); }
  }
  return L.join("\n");
}

/* ---------------- Excel: one sheet per table; the same layout is read back on upload ---------------- */
const byName = (list, name, key) => { const x = list.find((o) => o[key || "name"] === name || o.id === name); return x ? x.id : null; };
const pairId = (pairs, label) => { const x = pairs.find((p) => p[1] === label || p[0] === label); return x ? x[0] : null; };
const yes = (v) => /^(y|yes|o|true|1|예|네|추정|민감)$/i.test(String(v || "").trim());
const XL_SHEETS = [
  { name: "Records", key: "ledger",
    rows: (P) => P.ledger.map((e) => ({ id: e.id, 분류: CAT_BY[e.cat].name, 세부: e.sub || "", 항목: e.label || "", 내용: e.value || "", 날짜: e.date || "", 민감: e.sens === "sensitive" ? "Y" : "", 추정: e.conf === "est" ? "Y" : "", 출처: srcLabel(e.src), 수정일: String(e.up || "").slice(0, 10) })),
    list: (P) => P.ledger,
    toItem: (r) => { const v = String(r.내용 || "").trim(); if (!v) return null; const cat = byName(LEDGER_CATS, String(r.분류 || "").trim()) || "etc"; return { cat, sub: String(r.세부 || ""), label: String(r.항목 || ""), value: v, date: normYM(r.날짜).ok ? normYM(r.날짜).v : null, sens: yes(r.민감) || SENSITIVE_CATS.has(cat) ? "sensitive" : "normal", conf: yes(r.추정) ? "est" : "sure" }; },
    add: (P, it) => addEntry(Object.assign(it, { src: "import" })) },
  { name: "취향", key: "loves",
    rows: (P) => allLoveItems(P).map((x) => ({ id: x.id, 분류: LOVE_CATS.find((c) => c.id === x.cat).name, 이름: x.name, 이유: x.why || "", 출처: x.src || "" })),
    list: (P) => LOVE_CATS.flatMap((c) => P.loves.cats[c.id].items),
    toItem: (r) => { const n = String(r.이름 || "").trim(); if (!n) return null; return { _cat: byName(LOVE_CATS, String(r.분류 || "").trim()) || "food", name: n, why: String(r.이유 || "") }; },
    add: (P, it) => { const c = it._cat; delete it._cat; P.loves.cats[c].items.push(Object.assign({ id: uid("l"), src: "엑셀" }, it)); } },
  { name: "생각나무", key: "tree",
    rows: (P) => P.tree.nodes.map((n) => ({ id: n.id, 상위id: n.parent || "", 주제: n.label, 메모: n.memo || "", "지금 생각": n.now || "", 상태: (TH_STATUS.find((x) => x[0] === n.status) || [0, ""])[1], 무게: n.weight || "" })),
    list: (P) => P.tree.nodes,
    toItem: (r) => { const l = String(r.주제 || "").trim(); if (!l) return null; return { parent: String(r.상위id || "") || null, label: l, memo: String(r.메모 || ""), now: String(r["지금 생각"] || ""), status: pairId(TH_STATUS, String(r.상태 || "")), weight: +r.무게 || null }; },
    add: (P, it, id) => P.tree.nodes.push(Object.assign({ id: id || uid("t"), order: treeChildren(P, it.parent).length }, it)) },
  { name: "원하는것", key: "wants",
    rows: (P) => P.wants.items.map((w) => ({ id: w.id, 종류: WT_BY[w.type].name, 내용: w.text, 시기: HZ_BY[w.horizon]?.[1] || "", 중요도: w.prio || "", 상태: WS_BY[w.status] || "", 이유: w.why || "" })),
    list: (P) => P.wants.items,
    toItem: (r) => { const t = String(r.내용 || "").trim(); if (!t) return null; return { type: byName(WANT_TYPES, String(r.종류 || "").trim()) || WANT_TYPES.find((x) => x.en === String(r.종류).toUpperCase())?.id || "do", text: t, horizon: (HORIZONS.find((h) => h[1] === String(r.시기 || "").trim() || h[0] === r.시기) || [])[0] || "someday", prio: clamp(+r.중요도 || 2, 1, 3), status: pairId(W_STATUS, String(r.상태 || "")) || "idea", why: String(r.이유 || "") }; },
    add: (P, it) => P.wants.items.push(Object.assign({ id: uid("w"), src: "엑셀", rv: true }, it)) },
  { name: "연대기", key: "timeline",
    rows: (P) => P.timeline.events.map((e) => ({ id: e.id, 구분: LANE_BY[e.lane]?.name || "", 이름: e.label, 시작: e.s || "", 끝: e.e || "", 추정: e.est ? "Y" : "", 메모: e.note || "" })),
    list: (P) => P.timeline.events,
    toItem: (r) => { const l = String(r.이름 || "").trim(); if (!l) return null; const s = normYM(r.시작), e = normYM(r.끝); return { lane: byName(LANES, String(r.구분 || "").trim()) || "me", label: l, s: s.ok ? s.v : null, e: e.ok ? e.v : null, est: yes(r.추정), note: String(r.메모 || "") }; },
    add: (P, it) => P.timeline.events.push(Object.assign({ id: uid("e"), kind: it.e ? "phase" : "milestone", src: "엑셀" }, it)) },
  { name: "결정일지", key: "decisions",
    rows: (P) => P.decisions.items.map((d) => ({ id: d.id, 날짜: d.date || "", 결정: d.title, 분야: d.area && CAT_BY[d.area] ? CAT_BY[d.area].name : "", 상황: d.situation || "", 선택지: d.options || "", 이유: d.why || "", 기대: d.expect || "", 확신: d.conf || "", 다시볼날: d.due || "", 결과: d.result || "", 기대대비: (DEC_MET.find((x) => x[0] === d.met) || [0, ""])[1], 배운점: d.lesson || "" })),
    list: (P) => P.decisions.items,
    toItem: (r) => { const t = String(r.결정 || "").trim(); if (!t) return null; return { title: t, date: String(r.날짜 || "") || localDate(), area: byName(LEDGER_CATS, String(r.분야 || "").trim()), situation: String(r.상황 || ""), options: String(r.선택지 || ""), why: String(r.이유 || ""), expect: String(r.기대 || ""), conf: clamp(+r.확신 || 70, 0, 100), due: String(r.다시볼날 || "") || null, result: String(r.결과 || ""), met: pairId(DEC_MET, String(r.기대대비 || "")), lesson: String(r.배운점 || "") }; },
    add: (P, it) => P.decisions.items.push(Object.assign({ id: uid("d"), status: it.result ? "done" : "open", quality: null, outcome: null, at: nowISO() }, it)) },
  { name: "기록", key: "log",
    rows: () => S.LOG.items.map((r) => ({ id: r.id, 종류: RT_BY[r.type]?.name || r.type, 날짜: r.date || "", 내용: r.text })),
    list: () => S.LOG.items,
    toItem: (r) => { const t = String(r.내용 || "").trim(); if (!t) return null; return { type: byName(REC_TYPES, String(r.종류 || "").trim()) || "thought", date: String(r.날짜 || "") || localDate(), text: t }; },
    add: (P, it) => S.LOG.items.push(Object.assign({ id: uid("r"), src: "엑셀", at: nowISO() }, it)) },
];
function basicsRows(P) { const b = P.basics; return [["이름", "name"], ["호칭", "nick"], ["출생년도", "birthYear"], ["사는 곳", "region"], ["가족", "family"], ["하는 일", "job"], ["경력", "career"], ["소개", "intro"]].map(([k, f]) => ({ 항목: k, 값: b[f] ?? "", _f: f })); }
function answerRows(P) {
  const out = [];
  wheelStats(P).forEach((w) => out.push({ 구분: "라이프 휠", 항목: w.name, 값: w.sat ?? "", 보조: w.imp ?? "" }));
  IPIP.forEach((x) => { const r = ipipRange(P.ipip.answers[x.n]); out.push({ 구분: "성격 문항", 항목: x.q, 값: r ? (r.lo === r.hi ? r.lo : r.lo + "~" + r.hi) : "", 보조: (P.ipip.notes || {})[x.n] || "" }); });
  DILEMMAS.forEach((d, i) => { const p = P.values.picks[i], s = (P.values.str || {})[i]; out.push({ 구분: "가치 딜레마", 항목: d.q, 값: p ? (p === "m" ? "상황에 따라" : (p === "a" ? d.a[1] : d.b[1]) + (s === 1 ? " (가까움)" : "")) : "", 보조: (P.values.notes || {})[i] || "" }); });
  allActs(P).forEach((a) => out.push({ 구분: "에너지", 항목: a.t, 값: ({ c: "충전", n: "보통", d: "방전" })[P.energy.acts[a.id]] || "", 보조: "" }));
  return out;
}

let xlsxLoading = null;
function ensureXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (xlsxLoading) return xlsxLoading;
  const srcs = ["https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js", "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"];
  xlsxLoading = new Promise((res, rej) => {
    const tryLoad = (k) => {
      if (k >= srcs.length) { xlsxLoading = null; rej({ code: "xlsx_load", message: "엑셀 도구를 불러오지 못했어요" }); return; }
      const s = document.createElement("script"); s.src = srcs[k]; s.async = true;
      s.onload = () => (window.XLSX ? res(window.XLSX) : tryLoad(k + 1)); s.onerror = () => tryLoad(k + 1);
      document.head.appendChild(s);
    };
    tryLoad(0);
  });
  return xlsxLoading;
}
async function buildWorkbook(P) {
  const X = await ensureXLSX();
  const wb = X.utils.book_new();
  const add = (name, rows) => X.utils.book_append_sheet(wb, X.utils.json_to_sheet(rows.length ? rows : [{}]), name);
  add("기본정보", basicsRows(P).map(({ 항목, 값 }) => ({ 항목, 값 })));
  XL_SHEETS.forEach((sh) => add(sh.name, sh.rows(P)));
  add("응답", answerRows(P));
  add("안내", [{ 설명: "Atlas 원본 데이터입니다. '응답'과 '안내'를 뺀 시트는 고쳐서 다시 올릴 수 있어요. id가 있는 행은 그 항목을 고치고, id가 비어 있는 행은 새로 추가해요. 행을 지워도 앱의 데이터는 지워지지 않아요." }]);
  return X.write(wb, { bookType: "xlsx", type: "array" });
}
/* compare an uploaded workbook with the current data; nothing changes until applyImport */
async function planImport(file) {
  const X = await ensureXLSX();
  const wb = X.read(await file.arrayBuffer(), { type: "array" });
  const P = S.P, plan = { file: file.name, sheets: [], basics: [] };
  const bs = wb.Sheets["기본정보"];
  if (bs) {
    const map = Object.fromEntries(basicsRows(P).map((r) => [r.항목, r._f]));
    X.utils.sheet_to_json(bs, { defval: "" }).forEach((r) => { const f = map[String(r.항목).trim()]; if (!f) return; let v = r.값; if (f === "birthYear") v = parseInt(v, 10) || null; else v = String(v); if ((P.basics[f] ?? "") !== (v ?? "")) plan.basics.push({ f, v }); });
  }
  XL_SHEETS.forEach((sh) => {
    const ws = wb.Sheets[sh.name]; if (!ws) return;
    const rows = X.utils.sheet_to_json(ws, { defval: "" });
    const cur = Object.fromEntries(sh.list(P).map((x) => [x.id, x]));
    const out = { name: sh.name, add: [], upd: [], skip: 0 };
    rows.forEach((r) => {
      const it = sh.toItem(r); if (!it) { out.skip++; return; }
      const id = String(r.id || "").trim(), ex = id && cur[id];
      if (ex) { const diff = Object.keys(it).filter((k) => k !== "_cat" && JSON.stringify(ex[k] ?? null) !== JSON.stringify(it[k] ?? null)); if (diff.length) out.upd.push({ id, it, diff }); }
      else out.add.push({ id: id || null, it });
    });
    if (out.add.length || out.upd.length || out.skip) plan.sheets.push(out);
  });
  return plan;
}
function applyImport(plan) {
  const P = S.P; let n = 0;
  plan.basics.forEach(({ f, v }) => { P.basics[f] = v; n++; });
  plan.sheets.forEach((o) => {
    const sh = XL_SHEETS.find((x) => x.name === o.name);
    const cur = Object.fromEntries(sh.list(P).map((x) => [x.id, x]));
    o.upd.forEach(({ id, it, diff }) => { const ex = cur[id]; diff.forEach((k) => (ex[k] = it[k])); if (sh.key === "ledger") ex.up = nowISO(); n++; });
    o.add.forEach(({ id, it }) => { sh.add(P, it, id); n++; });
  });
  return n;
}

function noteExport(kind, pack) {
  S.P.meta.exports.push({ at: nowISO(), kind, pack: pack || null });
  if (S.P.meta.exports.length > 100) S.P.meta.exports = S.P.meta.exports.slice(-100);
  markDirty();
}
function viewExport() {
  const P = S.P, pack = PACK_BY[S.ui.pack] || PACKS[0], text = packText(P, pack);
  const imp = S.ui.importPlan;
  const packs = '<div class="packs">' + PACKS.map((p) => '<button class="pack ' + (p.id === pack.id ? "on" : "") + '" data-act="packSel" data-id="' + p.id + '"><b>' + esc(p.name) + "</b><span>" + esc(p.d) + "</span></button>").join("") + "</div>";
  const kb = Math.max(1, Math.round(new Blob([text]).size / 1024));
  const preview = '<section class="sheet pad stack" style="gap:10px"><div class="row" style="justify-content:space-between"><h3>' + esc(pack.name) + ' Pack</h3><span class="mono muted" style="font-size:11.5px">' + text.split("\n").length + "줄 · " + kb + "KB</span></div>" +
    '<p class="muted" style="font-size:12.5px">이 글을 복사해서 ChatGPT, Claude, Gemini 같은 AI 대화의 첫 메시지에 붙여 넣으세요. 그다음 원하는 일을 부탁하면 돼요.</p>' +
    '<textarea class="input mono pack-text" id="packText" rows="14" readonly>' + esc(text) + "</textarea>" +
    '<div class="row"><button class="btn primary" data-act="packCopy">' + I.copy + "복사하기</button><button class=\"btn\" data-act=\"packSave\">" + I.down + ".md 파일로 저장</button></div></section>";
  const files = '<section class="sheet pad stack" style="gap:12px"><h3>원본 데이터</h3><p class="muted" style="font-size:12.5px">모든 기록을 파일로 내려받거나, 엑셀로 고친 뒤 다시 올릴 수 있어요.</p>' +
    '<div class="row"><button class="btn" data-act="xlsxSave">' + I.down + "엑셀로 저장 (.xlsx)</button><button class=\"btn\" data-act=\"jsonSave\">" + I.down + "전체 JSON 저장</button></div>" +
    '<div class="upload"><label class="btn" for="xlsxFile">' + I.up + '엑셀 올리기</label><input type="file" id="xlsxFile" accept=".xlsx,.xls,.csv" class="sr"><span class="muted" style="font-size:12px">이 앱에서 저장한 엑셀 형식을 읽어요. 적용하기 전에 바뀌는 내용을 먼저 보여 줘요.</span></div>' +
    (S.ui.busy.xlsx ? '<div class="typing"><span class="spinner"></span>엑셀을 처리하는 중이에요</div>' : "") +
    (imp ? importPreview(imp) : "") + "</section>";
  const hist = P.meta.exports.slice(-8).reverse();
  const log = '<section class="sheet pad"><h3 style="margin-bottom:8px">내보낸 기록</h3><ul class="list-plain">' + (hist.length ? hist.map((x) => '<li><span class="mono muted" style="font-size:11.5px;min-width:92px">' + fmtDot(x.at) + " " + fmtTime(x.at).split(" ")[1] + "</span><span>" + esc(({ copy: "복사", md: ".md 저장", json: "JSON 저장", xlsx: "엑셀 저장", import: "엑셀 올리기" })[x.kind] || x.kind) + (x.pack ? " · " + esc(PACK_BY[x.pack]?.name || x.pack) : "") + "</span></li>").join("") : '<li class="muted">아직 내보낸 적이 없어요.</li>') + "</ul></section>";
  return '<div class="page-head"><div><div class="eyebrow">Pack · 꺼내 쓰기</div><h1>Pack</h1><p class="lede">필요한 일에 맞는 부분만 골라 다른 사람이나 AI가 바로 읽을 수 있는 글로 만들어요. 건강·재정 정보도 해당 Pack에 포함돼요.</p></div></div>' +
    packs + cmpSection(pack) + '<div class="export-grid">' + preview + '<div class="stack">' + files + log + "</div></div>";
}
function importPreview(p) {
  const tot = p.basics.length + p.sheets.reduce((s, o) => s + o.add.length + o.upd.length, 0);
  return '<div class="import"><div class="row" style="justify-content:space-between"><b>' + esc(p.file) + "</b><span class=\"muted\" style=\"font-size:12px\">적용 전 미리보기</span></div>" +
    '<table class="import-t"><thead><tr><th>시트</th><th>추가</th><th>수정</th><th>건너뜀</th></tr></thead><tbody>' +
    (p.basics.length ? "<tr><td>기본정보</td><td>–</td><td>" + p.basics.length + "</td><td>–</td></tr>" : "") +
    p.sheets.map((o) => "<tr><td>" + esc(o.name) + "</td><td>" + o.add.length + "</td><td>" + o.upd.length + "</td><td>" + o.skip + "</td></tr>").join("") + "</tbody></table>" +
    (tot ? '<div class="row"><button class="btn primary" data-act="importApply">' + tot + "건 적용하기</button><button class=\"btn ghost\" data-act=\"importCancel\">취소</button></div>" : '<p class="muted" style="font-size:12.5px">바뀌는 내용이 없어요.</p><button class="btn sm ghost" data-act="importCancel">닫기</button>') + "</div>";
}
async function saveFile(name, data, kind, pack) {
  try { await Backend.download(name, data); noteExport(kind, pack); toast("저장했어요: " + name); }
  catch (e) {
    if (e && e.code === "declined") return;
    toast(e && e.code === "unavailable" ? "이 화면에서는 파일 저장을 쓸 수 없어요." : "파일을 저장하지 못했어요 (" + ((e && e.code) || "오류") + ").", 4200);
  }
}
const stamp = () => localDate().replace(/-/g, "");
