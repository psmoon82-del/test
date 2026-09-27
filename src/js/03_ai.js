/* ============================================================ Claude: profile digest, prompts, calls */
const cut = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };

function digest(P, opt) {
  opt = opt || {};
  const L = [];
  const b = P.basics;
  L.push("[제원] " + [b.name && "이름 " + b.name, b.birthYear && "출생 " + b.birthYear + (b.birthEst ? "(추정)" : ""), b.region && "거주 " + b.region, b.family && "가족 " + b.family, b.job && "일 " + b.job, b.career && "경력 " + cut(b.career, 140), b.intro && "자기소개 " + cut(b.intro, 140)].filter(Boolean).join(" / "));
  const ws = wheelStats(P).filter((w) => w.sat != null);
  if (ws.length) L.push("[지금의 나 · 라이프 휠: 만족 0~10 / 중요 1~5] " + ws.map((w) => w.name + " 만족" + w.sat + "·중요" + (w.imp ?? "?") + (w.note ? "(" + cut(w.note, 50) + ")" : "")).join(", "));
  const tr = ipipScores(P);
  if (TRAIT_ORDER.some((t) => tr[t].n)) L.push("[성격 Big Five, 1~5] " + TRAIT_ORDER.filter((t) => tr[t].n).map((t) => TRAITS[t].name + " " + tr[t].score.toFixed(1) + "(" + LVL_KO[lvl(tr[t].score)] + ")").join(", "));
  const vs = valueScores(P).filter((v) => v.n);
  if (vs.length) L.push("[가치 우선순위 · 딜레마 " + Object.keys(P.values.picks).length + "개 선택 기준] " + vs.map((v, i) => (i + 1) + "." + VAL_BY[v.id].name + "(" + v.wins + "/" + v.n + ")").join(" "));
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
  const th = P.thoughts.items.filter((x) => x.memo || x.now || x.status);
  if (th.length) L.push("[마음속 주제 (예전 메모 → 지금)] " + th.slice(0, opt.full ? 30 : 16).map((x) => x.label + (x.status ? "[" + (TH_STATUS.find((s) => s[0] === x.status) || [0, ""])[1] + (x.weight ? ", 비중" + x.weight : "") + "]" : "") + (x.now ? " 지금: " + cut(x.now, 80) : x.memo ? " 메모: " + cut(x.memo, 70) : x.links?.length ? " (" + x.links.slice(0, 4).join(",") + ")" : "")).join(" / "));
  const wn = P.wants.items;
  if (wn.length) L.push("[원하는 것] " + WANT_TYPES.map((t) => { const xs = wn.filter((w) => w.type === t.id).sort((a, b) => (b.prio || 0) - (a.prio || 0)); return xs.length ? t.en + ": " + xs.slice(0, 7).map((w) => w.text + "(" + (HZ_BY[w.horizon]?.[1] || "?") + ",★" + (w.prio || 1) + "," + (WS_BY[w.status] || "") + ")").join(", ") : null; }).filter(Boolean).join(" | "));
  const ev = P.timeline.events.filter((x) => x.s).sort((a, b) => ym2num(a.s) - ym2num(b.s));
  if (ev.length) L.push("[연대기] " + ev.map((x) => fmtYM(x.s) + (x.e ? "~" + fmtYM(x.e) : "") + " " + x.label + (x.est ? "(추정)" : "")).join(", "));
  const facts = P.facts.slice(-(opt.facts || 40));
  if (facts.length) L.push("[알려진 사실]\n" + facts.map((f) => "- (" + (AREAS[f.area] || f.area) + ") " + cut(f.text, 150)).join("\n"));
  if (opt.log) {
    const recs = S.LOG.items.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, opt.log);
    if (recs.length) L.push("[최근 기록]\n" + recs.map((r) => "- " + (RT_BY[r.type]?.name || r.type) + " " + fmtYM(r.date) + ": " + cut(r.text, 130)).join("\n"));
  }
  return L.join("\n");
}

function aiErrMsg(e) {
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
function aiAvailable() { return !!S.sample && !S.aiOff; }
async function aiJSON(prompt, opts) {
  if (!aiAvailable()) throw { code: "capability_disabled" };
  const o = Object.assign({ modelTier: "default" }, opts || {});
  if (S.aiLite) o.modelTier = "quick";
  try { const r = await S.sample.json(prompt, o); S.diag.ai = null; renderDiag(); return r; }
  catch (e) {
    if (!(e && e.code === "cancelled")) noteErr("ai", e);
    if (e && e.code === "empty_completion") S.aiLite = true;
    if (e && PERMANENT.has(e.code)) S.aiOff = e.code;
    throw e;
  }
}

const STYLE_RULES = "한국어로 쓰세요. 담백하고 구체적으로. 칭찬·과장·상담사 말투 금지. 사용자의 응답·메모에 있는 근거만 사용하고 추측으로 사실을 만들지 마세요. 진단하거나 단정하지 말고 '~로 보인다', '~일 수 있다' 수준으로.";

function chapterFocus(P, id) {
  switch (id) {
    case "basics": return "제원: " + JSON.stringify(P.basics);
    case "wheel": return "라이프 휠(만족 0~10, 중요 1~5, 우선순위=중요×2−만족): " + wheelStats(P).map((w) => w.name + " 만족" + w.sat + " 중요" + w.imp + " 우선순위" + w.gap + (w.note ? " 메모:" + cut(w.note, 80) : "")).join("; ");
    case "ipip": { const t = ipipScores(P); return "Big Five(1~5): " + TRAIT_ORDER.map((k) => TRAITS[k].name + " " + (t[k].score ?? 0).toFixed(2)).join(", "); }
    case "values": return "딜레마 선택: " + DILEMMAS.map((d, i) => { const p = P.values.picks[i]; return p ? "「" + d.q + "」→ " + (p === "a" ? d.a[1] : d.b[1]) : null; }).filter(Boolean).join(" / ") + "\n가치 점수: " + valueScores(P).map((v) => VAL_BY[v.id].name + " " + v.wins + "/" + v.n).join(", ");
    case "energy": { const el = energyLists(P); const d = discTally(P); const c = chrono(P); return "충전: " + el.c.map((a) => a.t).join(", ") + "\n보통: " + el.n.map((a) => a.t).join(", ") + "\n방전: " + el.d.map((a) => a.t).join(", ") + "\n최근 몰입: " + (P.energy.flowRecent || "-") + "\n마지막 몰입: " + (P.energy.flowLast || "-") + "\n어릴 때: " + (P.energy.flowChild || "-") + "\n리듬: " + (c ? c.label : "-") + "\nDISC: D" + d.t.D + " I" + d.t.I + " S" + d.t.S + " C" + d.t.C; }
    case "loves": return LOVE_CATS.map((c) => { const x = P.loves.cats[c.id]; return c.name + " [" + (x.subs || []).join(",") + "] " + (x.items || []).map((i) => i.name + (i.why ? "(" + cut(i.why, 60) + ")" : "")).join(", "); }).join("\n");
    case "thoughts": return P.thoughts.items.map((x) => x.label + " | 상태:" + ((TH_STATUS.find((s) => s[0] === x.status) || [0, "미검토"])[1]) + " | 비중:" + (x.weight || "-") + " | 예전 메모:" + cut(x.memo || (x.links || []).join(","), 90) + " | 지금:" + cut(x.now, 90)).join("\n");
    case "wants": return P.wants.items.map((w) => WT_BY[w.type].en + " " + w.text + " | " + (HZ_BY[w.horizon]?.[1] || "") + " | ★" + w.prio + " | " + (WS_BY[w.status] || "") + (w.why ? " | 이유:" + cut(w.why, 60) : "")).join("\n");
    case "timeline": return P.timeline.events.map((x) => (x.s ? fmtYM(x.s) : "연도미정") + (x.e ? "~" + fmtYM(x.e) : "") + " " + LANE_BY[x.lane]?.name + " " + x.label + (x.est ? "(추정)" : "")).join("\n");
  }
  return "";
}
async function aiChapterInsight(id) {
  const P = S.P; const ch = CH_BY[id];
  const prompt = "당신은 자기이해 도구 '라이프 독'의 해석가입니다. 사용자가 방금 'CH." + ch.code + " " + ch.name + "(" + ch.frame + ")'를 마쳤습니다.\n" + STYLE_RULES +
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
  const prompt = "당신은 한 사람의 자기 초상을 한 장으로 정리하는 편집자입니다. 아래는 그가 직접 답하고 기록한 프로필 전체입니다.\n" + STYLE_RULES +
    "\n\n" + digest(P, { full: true, facts: 60, log: 12 }) +
    '\n\n다음 JSON 하나로만 답하세요. 모든 항목은 위 근거에서 나와야 합니다.\n{"archetype": "이 사람을 요약하는 이름, 4~10자 (예: 조용한 설계자)", "headline": "한 문장 요약, 45자 이내", "essence": "3~4문장. 성격·가치·에너지·원하는 것이 어떻게 맞물리는지", "strengths": ["강점 3개, 각 25자 이내, 근거 포함"], "shadows": ["주의할 패턴 2개, 각 30자 이내, 비난이 아니라 관찰"], "drives": ["이 사람을 움직이는 것 3개, 짧게"], "tasteDNA": ["취향의 공통분모 3개, 짧게"], "nowFocus": "지금 가장 돌봐야 할 것 한 문장", "question": "지금 스스로에게 던질 질문 한 문장", "gaps": "근거가 부족해 확신하기 어려운 부분 한 문장"}';
  const r = await aiJSON(prompt, { modelTier: "complex" });
  if (!r || !r.archetype) throw { code: "invalid_json" };
  S.AI.portrait = Object.assign(r, { at: nowISO(), rev: (P.rev || 0) + 1 });
  bumpRev("자기 초상 갱신");
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
  bumpRev("관계 지도 해석");
  markDirty("ai", "profile");
  return S.AI.map;
}
async function aiExtractFromRecord(rec) {
  const prompt = "아래는 한 사람이 남긴 기록입니다. 이 기록에서 이 사람에 대해 알 수 있는 사실을 뽑으세요.\n" + STYLE_RULES +
    "\n\n[기록 · " + (RT_BY[rec.type]?.name || "") + " · " + fmtYM(rec.date) + "]\n" + rec.text +
    "\n\n[이미 알려진 사실]\n" + S.P.facts.slice(-30).map((f) => "- " + f.text).join("\n") +
    '\n\n이미 알려진 사실과 겹치지 않는 것만, 기록에 실제로 쓰인 내용만. JSON 하나로만 답하세요: {"facts": [{"area": "basics|wheel|traits|values|energy|work|family|loves|thoughts|wants|timeline", "text": "3인칭 한 문장"}]} (최대 4개, 없으면 빈 배열)';
  const r = await aiJSON(prompt, { modelTier: "quick" });
  return (r && Array.isArray(r.facts) ? r.facts : []).filter((f) => f && f.text && AREAS[f.area]).slice(0, 4);
}

/* ---------------- interview ---------------- */
function gapList(P) {
  const rows = CH.map((c) => ({ id: c.id, name: c.name, p: P.done[c.id] ? 100 : chProgress(P, c.id) }));
  const facts = {};
  P.facts.forEach((f) => { facts[f.area] = (facts[f.area] || 0) + 1; });
  return rows.map((r) => ({ ...r, facts: facts[r.id === "ipip" ? "traits" : r.id] || 0 })).sort((a, b) => a.p - b.p);
}
const TOPICS = [
  ["auto", "자동 (빈 곳부터)"], ["wheel", "지금의 나"], ["traits", "성격"], ["values", "가치"], ["energy", "에너지·몰입"], ["work", "일"],
  ["family", "가족"], ["loves", "취향"], ["thoughts", "마음속 주제"], ["wants", "원하는 것"], ["timeline", "지나온 길"],
];
function interviewRules(P, topic) {
  let focus;
  if (topic === "auto") {
    const g = gapList(P).slice(0, 3);
    const ws = wheelStats(P).filter((w) => w.gap != null).sort((a, b) => b.gap - a.gap).slice(0, 2);
    focus = "자동: 가장 덜 채워진 영역부터 → " + g.map((x) => x.name + "(" + x.p + "%)").join(", ") + (ws.length ? ". 라이프 휠에서 중요도 대비 만족이 낮은 영역: " + ws.map((w) => w.name).join(", ") : "") + ". 아직 몰입 경험, 좋아하는 이유, 원하는 것의 '왜'가 비어 있다면 그쪽을 우선.";
  } else focus = "사용자가 고른 주제: " + (TOPICS.find((t) => t[0] === topic) || [0, topic])[1];
  return "당신은 자기이해 도구 '라이프 독'의 인터뷰어입니다. 한 사람이 자신을 체계적으로 들여다보도록 돕는 숙련된 인터뷰어처럼 대화합니다.\n" +
    "규칙:\n- 한국어 존댓말. 따뜻하지만 담백하게. 과한 칭찬, 상담사 말투, 이모지 금지.\n- 한 번에 질문은 하나. 답은 2~4문장.\n- 추상적인 답에는 구체적인 장면과 예시를 묻고, '왜'를 한두 단계 더 파고든다.\n- 사용자가 한 말을 짧게 되짚은 뒤 다음 질문으로 간다.\n- 프로필에 이미 있는 내용은 다시 묻지 말고 그 위에서 더 깊게 묻는다. 서로 어긋나는 신호가 보이면 조심스럽게 짚는다.\n- 재정·투자의 세부 숫자, 건강 진단 같은 민감한 주제는 사용자가 먼저 꺼내지 않으면 파고들지 않는다.\n- 진단하거나 성격을 단정하지 않는다.\n" +
    "[이번 인터뷰 초점] " + focus + "\n\n[프로필 요약]\n" + digest(P, S.aiLite ? { facts: 20 } : { facts: 50, log: 6 });
}
/* format goes last so Claude answers in JSON rather than prose */
const IV_FORMAT = "[응답 형식] 인사말이나 설명을 JSON 밖에 쓰지 말고, 아래 JSON 하나로만 답하세요. 사용자에게 할 말은 모두 reply 안에 넣습니다.\n" +
  '{"reply": "사용자에게 할 말(마지막은 질문 하나)", "facts": [{"area": "basics|wheel|traits|values|energy|work|family|loves|thoughts|wants|timeline", "text": "사용자가 이번 메시지에서 직접 말한 사실, 3인칭 한 문장"}], "wants": [{"type": "have|do|be|learn|give", "text": "...", "horizon": "1y|3y|5y|10y|someday"}], "events": [{"year": "YYYY 또는 YYYY-MM", "label": "...", "lane": "me|family|work|home"}]}' +
  "\n" + "- facts, wants, events는 사용자가 이번 메시지에서 실제로 말한 것만. 추측 금지. 없으면 빈 배열. 이미 알려진 사실과 같은 내용은 넣지 않는다.";
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
  const rules = interviewRules(P, S.CHAT.topic || "auto");
  let input;
  if (opening) input = [{ role: "user", content: rules + "\n\n인터뷰를 시작합니다. reply에 짧은 인사와 초점에 맞는 첫 질문을 담아 주세요.\n\n" + IV_FORMAT }];
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
