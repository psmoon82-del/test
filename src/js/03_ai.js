/* ============================================================ Claude: profile digest, prompts, calls */
const cut = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };

/* answers the owner marked as depending on the situation, with their notes */
function situational(P) {
  const out = [], ipn = P.ipip.notes || {};
  IPIP.forEach((x) => { const r = ipipRange(P.ipip.answers[x.n]); if (r && r.hi > r.lo) out.push("「" + x.q + "」 " + LIKERT[r.lo - 1] + " ~ " + LIKERT[r.hi - 1] + (ipn[x.n] ? ": " + cut(ipn[x.n], 120) : "")); });
  const vn = P.values.notes || {};
  DILEMMAS.forEach((d, i) => { if (P.values.picks[i] === "m") out.push("딜레마 「" + d.q + "」(" + d.a[1] + " / " + d.b[1] + ") 상황에 따라" + (vn[i] ? ": " + cut(vn[i], 120) : "")); });
  const dn = P.energy.discNotes || {};
  DISC_PAIRS.forEach((p, i) => { if (P.energy.disc[i] === "m") out.push("일하는 방식 「" + p.a[1] + " / " + p.b[1] + "」 상황에 따라" + (dn[i] ? ": " + cut(dn[i], 120) : "")); });
  return out;
}
/* shared helpers for ledger entries and the think tree */
const SRC_LABEL = { interview: "AI 인터뷰", record: "기록에서 추출", nudge: "주간 질문", import: "엑셀 가져오기", "": "직접 입력" };
function entryText(e) { return (e.label ? e.label + ": " : "") + (e.value || ""); }
function srcLabel(src) { return SRC_LABEL[src || ""] || src; }
function treeChildren(P, pid) { return P.tree.nodes.filter((n) => (n.parent || null) === (pid || null)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); }
function treePath(P, n) { const out = []; let x = n, guard = 0; while (x && guard++ < 20) { out.unshift(x.label); x = P.tree.nodes.find((y) => y.id === x.parent); } return out.join(" › "); }
function allActs(P) { return ACTS.concat((P.energy.custom || []).map((a) => ({ id: a.id, t: a.t, custom: true }))); }
/* ledger lines for prompts and packs, newest first, grouped by category */
function ledgerLines(P, cats, max) {
  const out = [];
  (cats || CAT_IDS).forEach((c) => {
    const xs = P.ledger.filter((e) => e.cat === c).sort((a, b) => String(b.up || b.at).localeCompare(String(a.up || a.at))).slice(0, max || 60);
    if (xs.length) out.push("[" + CAT_BY[c].name + "]\n" + xs.map((e) => "- " + (e.sub ? "(" + e.sub + ") " : "") + cut(entryText(e), 200) + (e.date ? " · " + fmtYM(e.date) : "") + (e.conf === "est" ? " · 추정" : "")).join("\n"));
  });
  return out.join("\n");
}
function treeLines(P, max) {
  const ns = P.tree.nodes.filter((n) => n.kind !== "word" && (n.now || n.memo || n.status || n.parent));
  return ns.slice(0, max || 40).map((n) => treePath(P, n) + (n.status ? " [" + ((TH_STATUS.find((s) => s[0] === n.status) || [0, ""])[1]) + (n.weight ? ", 비중" + n.weight : "") + "]" : "") + (n.now ? " 지금: " + cut(n.now, 80) : n.memo ? " 메모: " + cut(n.memo, 70) : "")).join(" / ");
}

function digest(P, opt) {
  opt = opt || {};
  const L = [];
  const b = P.basics;
  L.push("[기본] " + [b.name && "이름 " + b.name, b.birthYear && "출생 " + b.birthYear + (b.birthEst ? "(추정)" : ""), b.region && "거주 " + b.region, b.family && "가족 " + b.family, b.job && "일 " + b.job, b.career && "경력 " + cut(b.career, 140), b.intro && "자기소개 " + cut(b.intro, 140)].filter(Boolean).join(" / "));
  const ws = wheelStats(P).filter((w) => w.sat != null);
  if (ws.length) L.push("[지금의 나 · 라이프 휠: 만족 0~10 / 중요 1~5] " + ws.map((w) => w.name + " 만족" + w.sat + "·중요" + (w.imp ?? "?") + (w.note ? "(" + cut(w.note, 50) + ")" : "")).join(", "));
  const tr = ipipScores(P);
  if (TRAIT_ORDER.some((t) => tr[t].n)) L.push("[성격 Big Five, 1~5] " + TRAIT_ORDER.filter((t) => tr[t].n).map((t) => TRAITS[t].name + " " + tr[t].score.toFixed(1) + "(" + LVL_KO[lvl(tr[t].score)] + (tr[t].hi - tr[t].lo >= 0.5 ? ", 상황에 따라 " + tr[t].lo.toFixed(1) + "~" + tr[t].hi.toFixed(1) : "") + ")").join(", "));
  const vs = valueScores(P).filter((v) => v.n);
  if (vs.length) L.push("[가치 우선순위 · 딜레마 " + Object.keys(P.values.picks).length + "개 선택 기준] " + vs.map((v, i) => (i + 1) + "." + VAL_BY[v.id].name + "(" + fmtW(v.wins) + "/" + v.n + ")").join(" "));
  const sit = situational(P);
  if (sit.length) L.push("[상황에 따라 달라지는 모습 — 한 점으로 단정하지 말 것]\n" + sit.map((x) => "- " + x).join("\n"));
  if (P.prior && P.prior.valuesTop3) L.push("[이전에 직접 고른 가치 Top3] " + P.prior.valuesTop3.map((id) => VAL_BY[id]?.name || id).join(", "));
  const el = energyLists(P);
  if (el.c.length || el.d.length) L.push("[에너지] 충전: " + (el.c.map((a) => a.t).join(", ") || "-") + " / 방전: " + (el.d.map((a) => a.t).join(", ") || "-"));
  const e = P.energy;
  if (e.flowRecent) L.push("[최근 몰입] " + cut(e.flowRecent, 200));
  if (e.flowLast) L.push("[마지막 몰입] " + cut(e.flowLast, 200));
  if (e.flowChild) L.push("[어릴 때 빠졌던 것] " + cut(e.flowChild, 200));
  const cr = chrono(P); if (cr) L.push("[하루 리듬] " + cr.label);
  const dt = discTally(P); if (dt.n) L.push("[일하는 방식 DISC " + dt.n + "문항] D" + dt.t.D + " I" + dt.t.I + " S" + dt.t.S + " C" + dt.t.C + " → " + dt.top.map((k) => DISC[k].name).join("·"));
  const lv = LOVE_CATS.map((c) => { const it = P.loves.cats[c.id]?.items || []; return it.length ? c.name + ": " + it.slice(0, opt.full ? 10 : 6).map((x) => x.name + (x.why ? "(" + cut(x.why, 40) + ")" : "")).join(", ") : null; }).filter(Boolean);
  if (lv.length) L.push("[좋아하는 것] " + lv.join(" | "));
  if (P.prior && P.prior.tasteNote) L.push("[콘텐츠 취향 이전 응답] " + cut(P.prior.tasteNote, 200));
  const tl = treeLines(P, opt.full ? 40 : 20);
  if (tl) L.push("[생각 나무 (가지 › 주제)] " + tl);
  const wn = P.wants.items;
  if (wn.length) L.push("[원하는 것] " + WANT_TYPES.map((t) => { const xs = wn.filter((w) => w.type === t.id).sort((a, b) => (b.prio || 0) - (a.prio || 0)); return xs.length ? t.en + ": " + xs.slice(0, 7).map((w) => w.text + "(" + (HZ_BY[w.horizon]?.[1] || "?") + ",★" + (w.prio || 1) + "," + (WS_BY[w.status] || "") + ")").join(", ") : null; }).filter(Boolean).join(" | "));
  const ev = P.timeline.events.filter((x) => x.s).sort((a, b) => ym2num(a.s) - ym2num(b.s));
  if (ev.length) L.push("[연대기] " + ev.map((x) => fmtYM(x.s) + (x.e ? "~" + fmtYM(x.e) : "") + " " + x.label + (x.est ? "(추정)" : "")).join(", "));
  const led = ledgerLines(P, opt.cats, opt.facts ? Math.ceil(opt.facts / 3) : 20);
  if (led) L.push("[Records: 직접 기록하거나 대화에서 알게 된 사실]\n" + led);
  if (opt.log) {
    const recs = S.LOG.items.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, opt.log);
    if (recs.length) L.push("[최근 기록]\n" + recs.map((r) => "- " + (RT_BY[r.type]?.name || r.type) + " " + fmtYM(r.date) + ": " + cut(r.text, 130)).join("\n"));
  }
  return L.join("\n");
}

function aiErrMsg(e) {
  if (e instanceof Error) { noteErr("js", e); return "앱 내부 오류로 처리하지 못했어요 (" + cut(e.message, 60) + ")."; }
  const c = e && e.code;
  return aiErrCopy(c) + (c && c !== "cancelled" ? " [" + c + "]" : "");
}
function aiErrCopy(c) {
  return ({
    not_granted: "이 페이지에서 Claude를 쓰도록 허용되지 않았어요.",
    sampling_disabled: "이 계정에서는 Claude 연결을 쓸 수 없어요.",
    not_declared: "이 버전에서는 Claude 연결이 꺼져 있어요.",
    capability_disabled: "이 화면에서는 Claude 연결을 쓸 수 없어요.",
    capability_removed: "앱 버전이 오래돼 Claude 연결을 쓸 수 없어요.",
    rate_limited: "요청이 몰려 잠시 쉬어야 해요. 조금 뒤에 다시 눌러 주세요.",
    session_expired: "다시 로그인한 뒤 시도해 주세요.",
    refused: "Claude가 이 요청에는 답하지 않았어요. 표현을 바꿔 다시 시도해 주세요.",
    invalid_json: "답을 정리하는 데 실패했어요. 한 번 더 눌러 주세요.",
    prompt_too_large: "보낼 내용이 너무 길어요. 기록 일부를 줄여 주세요.",
    empty_completion: "빈 답이 돌아왔어요. 다시 누르면 더 가벼운 방식으로 시도해요.",
    cancelled: "중단했어요.",
  })[c] || "연결이 불안정해 답을 받지 못했어요. 다시 시도해 주세요.";
}
const PERMANENT = new Set(["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"]);
function aiAvailable() { return Backend.aiAvailable() && !S.aiOff; }
async function aiJSON(prompt, opts) {
  if (!aiAvailable()) throw { code: "capability_disabled" };
  const o = Object.assign({ modelTier: "default" }, opts || {});
  if (S.aiLite) o.modelTier = "quick";
  try { const r = await Backend.aiJSON(prompt, o); S.diag.ai = null; renderDiag(); return r; }
  catch (e) {
    if (!(e && e.code === "cancelled")) noteErr("ai", e);
    if (e && e.code === "empty_completion") S.aiLite = true;
    if (e && PERMANENT.has(e.code)) S.aiOff = e.code;
    throw e;
  }
}

const STYLE_RULES = "한국어로 쓰세요. 상황에 따라 달라진다고 답한 항목은 한 점으로 단정하지 말고 조건과 함께 해석하세요. 담백하고 구체적으로. 칭찬·과장·상담사 말투 금지. 사용자의 응답·메모에 있는 근거만 사용하고 추측으로 사실을 만들지 마세요. 진단하거나 단정하지 말고 '~로 보인다', '~일 수 있다' 수준으로.";

function chapterFocus(P, id) {
  switch (id) {
    case "basics": return "제원: " + JSON.stringify(P.basics);
    case "wheel": return "라이프 휠(만족 0~10, 중요 1~5, 우선순위=중요×2−만족): " + wheelStats(P).map((w) => w.name + " 만족" + w.sat + " 중요" + w.imp + " 우선순위" + w.gap + (w.note ? " 메모:" + cut(w.note, 80) : "")).join("; ");
    case "ipip": { const t = ipipScores(P); const sit = situational(P).filter((x) => x.startsWith("「")); return "Big Five(1~5): " + TRAIT_ORDER.map((k) => TRAITS[k].name + " " + (t[k].score ?? 0).toFixed(2) + (t[k].hi - t[k].lo >= 0.5 ? "(범위 " + t[k].lo.toFixed(1) + "~" + t[k].hi.toFixed(1) + ")" : "")).join(", ") + (sit.length ? "\n상황에 따라 달라지는 문항:\n" + sit.join("\n") : ""); }
    case "values": return "딜레마 선택: " + DILEMMAS.map((d, i) => { const p = P.values.picks[i]; const s = (P.values.str || {})[i]; return p ? "「" + d.q + "」→ " + (p === "m" ? "상황에 따라" + ((P.values.notes || {})[i] ? "(" + P.values.notes[i] + ")" : "") : (p === "a" ? d.a[1] : d.b[1]) + (s === 1 ? " 쪽에 가까움" : "")) : null; }).filter(Boolean).join(" / ") + "\n가치 점수: " + valueScores(P).map((v) => VAL_BY[v.id].name + " " + v.wins + "/" + v.n).join(", ");
    case "energy": { const el = energyLists(P); const d = discTally(P); const c = chrono(P); return "충전: " + el.c.map((a) => a.t).join(", ") + "\n보통: " + el.n.map((a) => a.t).join(", ") + "\n방전: " + el.d.map((a) => a.t).join(", ") + "\n최근 몰입: " + (P.energy.flowRecent || "-") + "\n마지막 몰입: " + (P.energy.flowLast || "-") + "\n어릴 때: " + (P.energy.flowChild || "-") + "\n리듬: " + (c ? c.label : "-") + "\nDISC: D" + d.t.D + " I" + d.t.I + " S" + d.t.S + " C" + d.t.C; }
    case "loves": return LOVE_CATS.map((c) => { const x = P.loves.cats[c.id]; return c.name + " [" + (x.subs || []).join(",") + "] " + (x.items || []).map((i) => i.name + (i.why ? "(" + cut(i.why, 60) + ")" : "")).join(", "); }).join("\n");
    case "thoughts": return P.tree.nodes.filter((n) => n.kind !== "word").map((n) => treePath(P, n) + " | 상태:" + ((TH_STATUS.find((x) => x[0] === n.status) || [0, "미검토"])[1]) + " | 비중:" + (n.weight || "-") + " | 메모:" + cut(n.memo, 90) + " | 지금:" + cut(n.now, 90)).join("\n");
    case "wants": return P.wants.items.map((w) => WT_BY[w.type].en + " " + w.text + " | " + (HZ_BY[w.horizon]?.[1] || "") + " | ★" + w.prio + " | " + (WS_BY[w.status] || "") + (w.why ? " | 이유:" + cut(w.why, 60) : "")).join("\n");
    case "timeline": return P.timeline.events.map((x) => (x.s ? fmtYM(x.s) : "연도미정") + (x.e ? "~" + fmtYM(x.e) : "") + " " + LANE_BY[x.lane]?.name + " " + x.label + (x.est ? "(추정)" : "")).join("\n");
  }
  return "";
}
async function aiChapterInsight(id) {
  const P = S.P; const ch = CH_BY[id];
  const prompt = "당신은 자기 이해 도구 'Atlas'의 해석가입니다. 사용자가 방금 '" + ch.code + " " + ch.name + "(" + ch.frame + ")'를 마쳤습니다.\n" + STYLE_RULES +
    "\n\n[이번 챕터 결과]\n" + chapterFocus(P, id) +
    "\n\n[참고: 프로필 전체 요약]\n" + digest(P) +
    "\n\n이 챕터 결과를 해석해 주세요. 다른 챕터·메모와 연결되거나 어긋나는 지점이 있으면 구체적으로 짚으세요." +
    '\nJSON 하나로만 답하세요: {"insight": "4~6문장. 근거가 되는 응답·메모를 직접 언급", "question": "사용자가 스스로에게 던져볼 질문 한 문장"}';
  const r = await aiJSON(prompt);
  if (!r || !r.insight) throw { code: "invalid_json" };
  S.AI.insights[id] = { insight: String(r.insight), question: String(r.question || ""), at: nowISO(), rev: S.P.rev };
  markDirty("ai");
  return S.AI.insights[id];
}
async function aiPortrait() {
  const P = S.P;
  const prompt = "당신은 한 사람의 자화상을 한 장으로 정리하는 편집자입니다. 아래는 그가 직접 답하고 기록한 프로필 전체입니다.\n" + STYLE_RULES +
    "\n\n" + digest(P, { full: true, facts: 60, log: 12 }) +
    '\n\n다음 JSON 하나로만 답하세요. 모든 항목은 위 근거에서 나와야 합니다.\n{"archetype": "이 사람을 요약하는 이름, 4~10자 (예: 조용한 설계자)", "headline": "한 문장 요약, 45자 이내", "essence": "3~4문장. 성격·가치·에너지·원하는 것이 어떻게 맞물리는지", "strengths": ["강점 3개, 각 25자 이내, 근거 포함"], "shadows": ["주의할 패턴 2개, 각 30자 이내, 비난이 아니라 관찰"], "drives": ["이 사람을 움직이는 것 3개, 짧게"], "tasteDNA": ["취향의 공통분모 3개, 짧게"], "nowFocus": "지금 가장 돌봐야 할 것 한 문장", "question": "지금 스스로에게 던질 질문 한 문장", "gaps": "근거가 부족해 확신하기 어려운 부분 한 문장"}';
  const r = await aiJSON(prompt, { modelTier: "complex" });
  if (!r || !r.archetype) throw { code: "invalid_json" };
  S.AI.portrait = Object.assign(r, { at: nowISO(), rev: (P.rev || 0) + 1 });
  bumpRev("자화상 갱신");
  markDirty("ai", "profile");
  return S.AI.portrait;
}
async function aiMap(nodes) {
  const P = S.P;
  const list = nodes.filter((n) => n.kind === "leaf").map((n) => n.id + " | " + DOM_BY[n.dom].name + " | " + n.label + (n.detail ? " | " + cut(n.detail, 60) : "")).join("\n");
  const prompt = "당신은 한 사람의 관심·가치·취향·욕구 사이의 숨은 연결을 찾는 분석가입니다.\n" + STYLE_RULES +
    "\n\n[프로필 요약]\n" + digest(P) + "\n\n[지도 위 노드: id | 영역 | 이름 | 설명]\n" + list +
    '\n\n서로 다른 영역의 노드 사이에서 의미 있는 연결을 찾고, 노드들을 3~5개의 주제로 묶으세요. JSON 하나로만 답하세요:\n{"themes": [{"name": "주제 이름 2~8자", "desc": "한 문장", "members": ["노드id", ...]}], "links": [{"a": "노드id", "b": "노드id", "why": "왜 연결되는지 한 문장"}]}\n규칙: links는 12~22개, 반드시 서로 다른 영역끼리. 위 목록에 있는 id만 쓰기.';
  const r = await aiJSON(prompt, { modelTier: "complex" });
  if (!r || !Array.isArray(r.links)) throw { code: "invalid_json" };
  const ids = new Set(nodes.map((n) => n.id));
  const links = r.links.filter((l) => ids.has(l.a) && ids.has(l.b) && l.a !== l.b).slice(0, 30);
  const themes = (r.themes || []).map((t) => ({ name: String(t.name || ""), desc: String(t.desc || ""), members: (t.members || []).filter((m) => ids.has(m)) })).filter((t) => t.name && t.members.length).slice(0, 6);
  S.AI.map = { links, themes, at: nowISO(), rev: (P.rev || 0) + 1 };
  bumpRev("Network 해석");
  markDirty("ai", "profile");
  return S.AI.map;
}
async function aiExtractFromRecord(rec) {
  const prompt = "아래는 한 사람이 남긴 기록입니다. 이 기록에서 이 사람에 대해 알 수 있는 사실을 뽑으세요.\n" + STYLE_RULES +
    "\n\n[기록 · " + (RT_BY[rec.type]?.name || "") + " · " + fmtYM(rec.date) + "]\n" + rec.text +
    "\n\n[이미 알려진 사실]\n" + S.P.ledger.slice(-40).map((f) => "- " + entryText(f)).join("\n") +
    '\n\n이미 알려진 사실과 겹치지 않는 것만, 기록에 실제로 쓰인 내용만. JSON 하나로만 답하세요: {"facts": [{"cat": "' + CAT_IDS.join("|") + '", "label": "짧은 항목명(선택)", "text": "3인칭 한 문장"}]} (최대 4개, 없으면 빈 배열)';
  const r = await aiJSON(prompt, { modelTier: "quick" });
  return (r && Array.isArray(r.facts) ? r.facts : []).filter((f) => f && f.text).map((f) => ({ cat: CAT_BY[f.cat] ? f.cat : AREA_TO_CAT[f.area] || "etc", label: String(f.label || ""), text: String(f.text) })).slice(0, 4);
}

/* think tree auto-fill: topics the owner seems to be carrying, filed under the standard areas.
   talk = recent interview turns to draw from (interview mode), else the whole profile. */
async function aiTreeTopics(talk) {
  const P = S.P, max = talk ? 5 : 12;
  const have = P.tree.nodes.filter((n) => !n.area && n.kind !== "word").map((n) => "- " + treePath(P, n)).join("\n") || "(없음)";
  const gone = (P.meta.treeRejected || []).map((r) => r.label).join(", ") || "(없음)";
  const prompt = "당신은 한 사람의 머릿속을 정리해 주는 편집자입니다. 아래 자료를 읽고, 이 사람이 요즘 마음을 쓰고 있는 주제를 생각 나무에 넣을 수 있게 뽑으세요.\n" + STYLE_RULES +
    "\n\n[프로필과 Records]\n" + digest(P, talk ? { facts: 30 } : { full: true, facts: 60, log: 12 }) +
    (talk ? "\n\n[이번 AI 인터뷰 대화 — 여기서 드러난 주제를 우선]\n" + talk : "") +
    "\n\n[이미 나무에 있는 주제 (가지 › 주제)]\n" + have +
    "\n\n[사용자가 뺀 주제 — 다시 제안하지 말 것] " + gone +
    "\n\n[가지] " + TREE_AREAS.map((a) => a.id + "=" + a.name + "(" + a.d + ")").join(", ") +
    "\n\n규칙:\n- 주제 이름은 2~12자 명사구(예: 이직 고민, 아이 교육, 간 수치 관리). 문장이나 감상 금지.\n- 자료에 근거가 있는 것만. 한 번 스친 사실보다 반복되거나 무게가 있는 것.\n- 이미 있는 주제·뺀 주제와 같거나 비슷하면 넣지 않는다. 기존 주제의 하위로 들어갈 만하면 under에 그 주제 이름을 그대로 적는다.\n- memo는 왜 이 주제인지 근거를 담은 한두 문장, '~다' 체.\n- weight는 마음을 차지하는 정도: 1 가볍게, 2 자주, 3 크게.\n- 최대 " + max + "개. 없으면 빈 배열." +
    '\n\nJSON 하나로만 답하세요: {"topics": [{"area": "' + TREE_AREAS.map((a) => a.id).join("|") + '", "label": "주제 이름", "under": "기존 주제 이름 또는 빈 문자열", "memo": "근거 한두 문장", "weight": 1}]}';
  const r = await aiJSON(prompt, { modelTier: talk ? "default" : "complex" });
  if (!r || !Array.isArray(r.topics)) throw { code: "invalid_json" };
  return r.topics.filter((t) => t && t.label).slice(0, max).map((t) => ({ area: TREE_AREAS.some((a) => a.id === t.area) ? t.area : "meaning", label: cut(t.label, 24), under: String(t.under || ""), memo: String(t.memo || ""), weight: [1, 2, 3].includes(+t.weight) ? +t.weight : 1 }));
}

/* ---------------- interview ---------------- */
function gapList(P) {
  return CH.map((c) => ({ id: c.id, name: c.name, p: P.done[c.id] ? 100 : chProgress(P, c.id) })).sort((a, b) => a.p - b.p);
}
function emptyCats(P) { return LEDGER_CATS.filter((c) => c.id !== "etc" && !catFilled(P, c.id)); }
const TOPICS = [["auto", "자동 (빈 곳부터 차례로)"]].concat(LEDGER_CATS.filter((c) => c.id !== "etc").map((c) => [c.id, c.name]));
/* ---- one Records category at a time. A topic is done when it stops yielding new facts
   (saturation: IV_DRY answers in a row with nothing new) or after IV_CAP answers; Claude then asks to move on. */
const IV_CAP = 8, IV_DRY = 3;
function catFill(P, c) {
  const C = CAT_BY[c], own = P.ledger.filter((e) => e.cat === c);
  const miss = C.subs.filter((sb) => !own.some((e) => e.sub === sb));
  const n = own.length + catCounts(P, c).linked;
  const p = (C.subs.length ? (C.subs.length - miss.length) / C.subs.length : 0) * 0.5 + Math.min(1, n / 12) * 0.5;
  return { c, p, n, miss };
}
function ivOrder(P, skip) { return LEDGER_CATS.filter((c) => c.id !== "etc" && !(skip || []).includes(c.id)).map((c) => catFill(P, c.id)).sort((a, b) => a.p - b.p); }
/* the emptiest category not yet covered in this round; a new round starts when all are covered */
function ivNext(P) {
  const ch = S.CHAT, cur = ch.cur ? [ch.cur.cat] : [];
  let xs = ivOrder(P, (ch.covered || []).concat(cur));
  if (!xs.length) { ch.covered = []; xs = ivOrder(P, cur); }
  return xs[0].c;
}
function ivNewCur(cat) { return { cat, n: 0, facts: 0, dry: 0, cap: IV_CAP }; }
function ivGo(cat) {
  const ch = S.CHAT;
  if (ch.cur && !(ch.covered || []).includes(ch.cur.cat)) ch.covered = (ch.covered || []).concat(ch.cur.cat);
  ch.cur = ivNewCur(cat); ch.pend = null;
  if (ch.topic && ch.topic !== "auto") ch.topic = "auto";
}
/* conversations from before topics were tracked: take the category most of their facts went to */
function ivEnsure(P) {
  const ch = S.CHAT; if (ch.cur && CAT_BY[ch.cur.cat]) return;
  if (ch.topic && ch.topic !== "auto" && CAT_BY[ch.topic]) { ch.cur = ivNewCur(ch.topic); return; }
  const byId = Object.fromEntries(P.ledger.map((e) => [e.id, e.cat])), tally = {};
  const asst = ch.turns.filter((t) => t.role === "assistant");
  asst.slice(-12).forEach((t) => (t.facts || []).forEach((id) => { const c = byId[id]; if (c && c !== "etc") tally[c] = (tally[c] || 0) + 1; }));
  const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
  ch.cur = ivNewCur(top ? top[0] : ivOrder(P)[0].c);
  if (!ch.turns.length) return;
  let dry = 0; for (let i = asst.length - 1; i >= 0 && !(asst[i].facts || []).length; i--) dry++;
  Object.assign(ch.cur, { n: ch.turns.filter((t) => t.role === "user" && !t.meta).length, facts: asst.reduce((k, t) => k + (t.facts || []).length, 0), dry });
  if (ch.cur.n >= ch.cur.cap || dry >= IV_DRY) ch.pend = ivNext(P);
}
/* after each reply: follow Claude's move/stay on a pending switch, then count this answer */
function ivCount(r, k, skip) {
  const ch = S.CHAT, cur = ch.cur; if (!cur) return;
  if (ch.pend && r.move === "next") { ivGo(ch.pend); return; }
  if (ch.pend && r.move === "stay") { cur.cap = cur.n + 4; cur.dry = 0; ch.pend = null; }
  if (skip) return;
  cur.n++; cur.facts += k; cur.dry = k ? 0 : cur.dry + 1;
  if (!ch.pend && (r.ask === true || cur.dry >= IV_DRY || cur.n >= cur.cap)) ch.pend = ivNext(S.P);
}
function interviewRules(P) {
  ivEnsure(P);
  const ch = S.CHAT, cur = ch.cur, C = CAT_BY[cur.cat], f = catFill(P, cur.cat);
  const ws = wheelStats(P).filter((w) => w.gap != null && w.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 2);
  let focus = "[지금 주제] " + C.name + " (" + C.d + "). 이 주제 안에서 묻는다." + (f.miss.length ? " 아직 빈 세부 칸: " + f.miss.join(", ") + ". 이쪽을 우선." : "") + " 이 분류에 이미 기록된 것은 다시 묻지 말고 빈 곳이나 오래된 것을 묻는다." + (ws.length ? " 참고로 라이프 휠에서 중요도 대비 만족이 낮은 영역: " + ws.map((w) => w.name).join(", ") + "." : "") +
    "\n[이 주제 진행] 답 " + cur.n + "번, 새 사실 " + cur.facts + "개, 최근 연속으로 새 사실이 없던 답 " + cur.dry + "번. 기준: " + IV_DRY + "번 연속 새 사실이 없거나 답이 " + cur.cap + "번에 닿으면 이 주제는 충분하다.";
  if (ch.pend) {
    const nx = CAT_BY[ch.pend].name;
    focus += "\n[다음 주제로 넘어갈 때] 다음 주제는 '" + nx + "'. 사용자의 이번 메시지가 넘어가자는 뜻이면 move를 \"next\"로 하고 reply에서 '" + nx + "'의 첫 질문을 한다. 지금 주제를 더 이야기하겠다는 뜻이면 move를 \"stay\"로 하고 지금 주제를 이어간다. 그냥 지금 주제에 대한 답을 했다면 짧게 받고, 이 주제에서 알게 된 것을 한 문장으로 정리한 뒤 '" + nx + "'로 넘어가도 될지 묻고 ask를 true로 한다.";
  } else if (cur.n + 1 >= cur.cap || cur.dry + 1 >= IV_DRY) {
    const nx = CAT_BY[ivNext(P)].name;
    focus += "\n[곧 기준] 이번 메시지가 이 주제의 " + (cur.n + 1) + "번째 답이다. " + (cur.n + 1 >= cur.cap ? "상한에 닿는다." : "이번 메시지에서 새 사실이 나오지 않으면 기준에 닿는다.") + " 기준에 닿으면 reply에서 이 주제에서 알게 된 것을 한 문장으로 정리하고 다음 주제 '" + nx + "'로 넘어가도 될지 묻는다(질문은 그것 하나). 이때 ask를 true로 한다.";
  }
  return "당신은 자기 이해 도구 'Atlas'의 인터뷰어입니다. 한 사람이 자신을 체계적으로 들여다보도록 돕는 숙련된 인터뷰어처럼 대화합니다.\n" +
    "규칙:\n- 한국어 존댓말. 따뜻하지만 담백하게. 과한 칭찬, 상담사 말투, 이모지 금지.\n- 한 번에 질문은 하나. 답은 2~4문장.\n- 추상적인 답에는 구체적인 장면과 예시를 묻고, '왜'를 한두 단계 더 파고든다.\n- 사용자가 한 말을 짧게 되짚은 뒤 다음 질문으로 간다.\n- 프로필에 이미 있는 내용은 다시 묻지 말고 그 위에서 더 깊게 묻는다. 서로 어긋나는 신호가 보이면 조심스럽게 짚는다.\n- 건강·의료, 재정·보험 같은 민감한 정보도 기록 대상이다. 필요하면 구체적인 수치와 날짜까지 묻되, 사용자가 원하지 않으면 바로 넘어간다.\n- 진단하거나 성격을 단정하지 않는다.\n- 이 사람은 상황에 따라 유연하게 달라지는 편일 수 있다. '상황에 따라 달라지는 모습'에 있는 항목은 한 점으로 해석하지 말고 '어떤 자리에서는 ~, 어떤 자리에서는 ~'처럼 조건을 묻는다(예: '분위기를 띄우게 되는 자리와 조용해지는 자리는 각각 어떤 곳인가요?').\n" +
    focus + "\n\n[프로필 요약]\n" + digest(P, S.aiLite ? { facts: 20 } : { facts: 50, log: 6 });
}
/* format goes last so Claude answers in JSON rather than prose */
const IV_FORMAT = "[응답 형식] 인사말이나 설명을 JSON 밖에 쓰지 말고, 아래 JSON 하나로만 답하세요. 사용자에게 할 말은 모두 reply 안에 넣습니다.\n" +
  '{"reply": "사용자에게 할 말(마지막은 질문 하나)", "facts": [{"cat": "' + CAT_IDS.join("|") + '", "sub": "그 분류의 세부 칸 이름(지금 주제의 빈 세부 칸 등), 맞는 게 없으면 빈 문자열", "label": "짧은 항목명(선택, 예: 복용약)", "text": "사용자가 이번 메시지에서 직접 말한 사실, 3인칭 한 문장"}], "wants": [{"type": "have|do|be|learn|give", "text": "...", "horizon": "1y|3y|5y|10y|someday"}], "events": [{"year": "YYYY 또는 YYYY-MM", "label": "...", "lane": "me|family|work|home"}], "ask": false, "move": ""}' +
  "\n" + "- facts, wants, events는 사용자가 이번 메시지에서 실제로 말한 것만. 추측 금지. 없으면 빈 배열. 이미 알려진 사실과 같은 내용은 넣지 않는다.\n- ask: 이번 reply에서 다음 주제로 넘어가도 될지 물었으면 true. move: 다음 주제 제안에 사용자가 넘어가자고 하면 \"next\", 더 하겠다고 하면 \"stay\", 그 밖에는 빈 문자열.";
function proseReply(text) {
  const t = String(text || "").trim();
  if (!t) return "";
  const m = t.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (m) { try { return JSON.parse('"' + m[1] + '"'); } catch (e) { return m[1]; } }
  if (/^[\[{]/.test(t)) return "";
  return t.replace(/```[a-z]*/g, "").trim();
}
/* opening=true: ask the first question. Otherwise the caller has already appended the user's turn to S.CHAT.turns. */
async function aiInterviewTurn(opening) {
  const P = S.P;
  const rules = interviewRules(P);
  let input;
  if (opening) input = [{ role: "user", content: rules + "\n\n인터뷰를 시작합니다. reply에 짧은 인사와 지금 주제의 첫 질문을 담아 주세요.\n\n" + IV_FORMAT }];
  else {
    let hist = S.CHAT.turns.slice(-24).map((t) => ({ role: t.role, content: String(t.content) }));
    while (hist.length && hist[hist.length - 1].role !== "user") hist.pop();
    input = [{ role: "user", content: rules + "\n\n" + IV_FORMAT + "\n\n(여기까지가 지침입니다. 이어지는 것이 실제 대화입니다.)" }].concat(hist);
    if (input.length > 1) { const last = input[input.length - 1]; input[input.length - 1] = { role: "user", content: last.content + "\n\n(답은 위 [응답 형식]의 JSON 하나로)" }; }
  }
  let r;
  try { r = await aiJSON(input, { cache: false }); }
  catch (e) {
    /* Claude answered in prose instead of JSON: keep the answer, skip fact extraction for this turn */
    const t = e && e.code === "invalid_json" ? proseReply(e.text) : "";
    if (t) return { reply: t, facts: [], wants: [], events: [] };
    throw e;
  }
  if (!r || !r.reply) throw { code: "invalid_json" };
  return r;
}
