/* ============================================================ Claude: calls, errors, prompts */
const cut = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };

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
function aiOffMsg() { return S.aiOff ? aiErrMsg({ code: S.aiOff }) : "이 화면에서는 Claude 연결을 쓸 수 없어요. Claude 앱에서 열어 주세요."; }
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
/* Claude answered in prose instead of JSON: keep the reply */
function proseReply(text) {
  const t = String(text || "").trim();
  if (!t) return "";
  const m = t.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (m) { try { return JSON.parse('"' + m[1] + '"'); } catch (e) { return m[1]; } }
  if (/^[\[{]/.test(t)) return "";
  return t.replace(/```[a-z]*/g, "").trim();
}

const VOICE = "한국어. 담백하고 구체적으로. 번역투, 감성 조어, 교훈조, 과한 칭찬, 상담사 말투, 이모지 금지.";

/* ---------------- material Claude reads ---------------- */
function scenesIndex() {
  return S.SC.items.map((s) => s.id + " | " + (s.when || "때 미상") + " | " + cut(s.title, 40) + " | " + cut(s.text, 90)).join("\n");
}
function atlasDigest(max) {
  if (!S.AT || !S.AT.items) return "";
  const out = []; let len = 0;
  for (const x of S.AT.items) { const line = "- [" + x.k + "] " + cut(x.text, 160); if (len + line.length > max) break; out.push(line); len += line.length; }
  return out.join("\n");
}
function sceneFull(id) { const s = S.SC.items.find((x) => x.id === id); return s ? "[" + (s.when || "때 미상") + "] " + s.title + "\n" + s.text : ""; }

/* ---------------- issue suggestions ---------------- */
async function aiSuggestIssues(area) {
  const have = S.ISS.items.map((x) => "- " + x.q).join("\n");
  const rej = (S.B.meta.rejected || []).map((r) => "- " + (r.q || r)).join("\n");
  const lite = S.aiLite;
  const prompt =
    "당신은 '보통 사람이 합리적으로 생각하는 과정'을 담는 삶의 지혜 책의 기획 편집자입니다. 저자에게 물을 이슈 질문을 제안합니다.\n" +
    "규칙:\n- 이슈 질문은 사람마다 의견이 갈리는 삶의 문제여야 한다. 정답이 뻔한 질문, 사실을 묻는 질문은 안 된다.\n- 아래 기록을 보고 이 저자가 뚜렷한 의견이나 특이한 판단을 가졌을 만한 것부터 고른다.\n- 질문 문장은 책의 꼭지 제목이 될 수 있게 일반적인 말로 쓴다. 저자의 사생활을 질문에 드러내지 않는다.\n- why에는 그 질문을 고른 근거가 된 기록을 한 줄로 적는다. 근거가 없으면 빈 문자열.\n- 이미 있는 질문, 저자가 지운 질문과 겹치지 않게.\n- " + VOICE + "\n" +
    (area ? "- 분야는 '" + AREA_BY[area].name + "'(" + area + ")만.\n" : "- 여러 분야에 고르게.\n") +
    "\n[분야]\n" + AREAS.map((a) => a.id + " = " + a.name).join(", ") +
    "\n\n[이미 있는 질문]\n" + (have || "(없음)") + "\n\n[저자가 지운 질문]\n" + (rej || "(없음)") +
    "\n\n[나의 기록: 저자가 들려준 장면]\n" + (scenesIndex() || "(없음)") +
    "\n\n[Atlas에서 가져온 기록]\n" + (atlasDigest(lite ? 3000 : 12000) || "(없음)") +
    '\n\n[응답 형식] JSON 하나로만 답하세요.\n{"issues": [{"area": "' + AREAS.map((a) => a.id).join("|") + '", "q": "이슈 질문", "why": "근거 기록 한 줄"}]}\n- ' + (area ? "4" : "8") + "개.";
  const r = await aiJSON(prompt, { cache: false });
  if (!r || !Array.isArray(r.issues)) throw { code: "invalid_json" };
  return r.issues.filter((x) => x && x.q);
}

/* ---------------- one interview turn ---------------- */
function ivRules(it, pc) {
  const iv = pc.iv, sl = iv.slots || {}, ck = iv.check || {};
  const failing = CHECKS.filter((c) => ck[c.id] === false);
  const lastU = [...iv.turns].reverse().find((t) => t.role === "user");
  const short = lastU && String(lastU.content).replace(/\s/g, "").length <= SHORT_ANSWER;
  const withScenes = failing.length && iv.n >= 2 && S.SC.items.length;
  return "당신은 삶의 지혜 책을 저자와 함께 만드는 취재 기자이자 편집자입니다. 저자는 평범한 직장인이고, 이 책은 보통 사람이 합리적으로 생각하는 과정을 보여 줍니다.\n" +
    "[이번 이슈] " + it.q + "\n\n" +
    "목표: 저자에게서 아래 다섯 칸을 차례로 끌어낸다. 원칙은 맨 마지막에 묻는다.\n" + SLOTS.map((s, i) => (i + 1) + ". " + s.name + ": " + s.q).join("\n") + "\n\n" +
    "규칙:\n- 존댓말. 한 번에 질문은 하나. 저자의 말을 한 줄로 되짚은 뒤 묻는다. reply는 2~4문장.\n" +
    "- 추상적인 답에는 한 번 '예를 들면요?'처럼 구체적인 기준, 비교, 숫자를 묻는다.\n" +
    "- 반론 칸에서는 가장 강한 반대 의견(흔한 통념이나 알려진 이론)을 실제로 제기하고 어떻게 답하는지 묻는다.\n" +
    "- 답할 때마다 세 가지를 점검한다: " + CHECKS.map((c) => c.name + "(" + c.d + ")").join(", ") + ".\n" +
    "- 세 가지가 모두 통과하면 저자의 과거 기록을 찾지 않는다. 논리만으로 충분하면 장면은 필요 없다.\n" +
    "- 하나라도 부족하고 '예를 들면요?'로도 채워지지 않을 때만 [나의 기록]에서 이 의견과 맞닿은 장면을 골라 scenes에 id를 넣고, reply에서 '그때와 같은 생각인가요?'처럼 확인을 묻는다.\n" +
    "- 다섯 칸이 차고 점검이 모두 통과하면 done을 true로 하고 reply에서 초안을 써도 되겠다고 알린다.\n" +
    "- 진단하거나 저자를 평가하지 않는다. " + VOICE + "\n" +
    (short ? "- 저자의 직전 답이 매우 짧다. 다음 질문은 보기 2~3개를 주거나('A에 가깝나요, B에 가깝나요?') 반대 경우와 대조해서 묻는다.\n" : "") +
    "\n[지금까지 채운 칸]\n" + SLOTS.map((s) => s.name + ": " + (sl[s.id] ? cut(sl[s.id], 160) : "(비어 있음)")).join("\n") +
    "\n[지난 점검] " + (CHECKS.map((c) => c.name + " " + (ck[c.id] === true ? "통과" : ck[c.id] === false ? "부족" : "-")).join(", ")) + (ck.note ? " · " + ck.note : "") +
    "\n[답한 횟수] " + iv.n + "/" + IV_CAP +
    (withScenes ? "\n\n[나의 기록: id | 때 | 제목 | 요약]\n" + scenesIndex() : "") +
    (iv.scenes.length ? "\n\n[저자가 이 이슈의 근거로 붙인 장면]\n" + iv.scenes.map(sceneFull).join("\n\n") : "");
}
const IV_FORMAT = "[응답 형식] JSON 밖에 아무것도 쓰지 말고, 아래 JSON 하나로만 답하세요. 저자에게 할 말은 모두 reply 안에 넣습니다.\n" +
  '{"reply": "저자에게 할 말(마지막은 질문 하나)", "slots": {"opinion": "", "reason": "", "counter": "", "cond": "", "principle": ""}, "quotes": ["저자가 이번 메시지에서 한 말 중 책에 그대로 쓸 만한 표현, 토씨까지 원문 그대로"], "check": {"concrete": true, "fresh": false, "robust": false, "note": "부족한 점 한 줄"}, "scenes": [], "done": false}\n' +
  "- slots: 이번 답으로 새로 채워지거나 더 정확해진 칸만, 저자의 말에 가깝게 한두 문장으로. 바뀌지 않은 칸은 빈 문자열.\n- quotes: 없으면 빈 배열. 요약하거나 다듬지 말 것.\n- check: 지금까지의 답 전체 기준. 아직 판단할 수 없으면 false.\n- scenes: [나의 기록]의 id만. 없으면 빈 배열.";

async function aiInterviewTurn(it, pc, opening) {
  const rules = ivRules(it, pc);
  let input;
  if (opening) input = [{ role: "user", content: rules + "\n\n인터뷰를 시작합니다. reply에 이 이슈를 한 줄로 소개하고 첫 질문(의견)을 담아 주세요.\n\n" + IV_FORMAT }];
  else {
    let hist = pc.iv.turns.slice(-24).map((t) => ({ role: t.role, content: String(t.content) }));
    while (hist.length && hist[hist.length - 1].role !== "user") hist.pop();
    input = [{ role: "user", content: rules + "\n\n" + IV_FORMAT + "\n\n(여기까지가 지침입니다. 이어지는 것이 실제 대화입니다.)" }].concat(hist);
    const last = input[input.length - 1];
    input[input.length - 1] = { role: "user", content: last.content + "\n\n(답은 위 [응답 형식]의 JSON 하나로)" };
  }
  let r;
  try { r = await aiJSON(input, { cache: false }); }
  catch (e) {
    const t = e && e.code === "invalid_json" ? proseReply(e.text) : "";
    if (t) return { reply: t, slots: {}, quotes: [], check: null, scenes: [], done: false };
    throw e;
  }
  if (!r || !r.reply) throw { code: "invalid_json" };
  return r;
}

/* ---------------- draft ---------------- */
async function aiDraft(it, pc, ask) {
  const iv = pc.iv, sl = iv.slots || {};
  const said = iv.turns.filter((t) => t.role === "user" && !t.meta).map((t) => "- " + t.content).join("\n");
  const prev = pc.draft && pc.draft.cur ? SECTIONS.map((s) => "## " + s.name + "\n" + (pc.draft.cur[s.id] || "")).join("\n\n") : "";
  const prompt =
    "당신은 삶의 지혜 책의 대필 작가입니다. 저자와의 인터뷰로 꼭지 한 편의 초안을 씁니다. 저자가 이 초안을 고쳐 자기 글로 만듭니다.\n" +
    "[이슈] " + it.q + "\n\n" +
    "규칙:\n- 저자의 1인칭('나')으로 쓴다. 저자는 평범한 직장인이다. 현명한 척하지 말고, 생각한 과정을 보여 준다.\n" +
    "- 편집 기준(저자 결정): 저자의 말투, 사실, 논리, 주요 흐름을 지키는 한 문장은 재구성해도 된다. 논리가 부족하거나 매끄럽지 않은 말은 다듬는다. [인용]의 핵심 표현과 비유는 그대로 살린다. 저자가 쓰지 않은 멋진 문장, 격언, 교훈을 지어내지 않는다.\n" +
    "- 저자가 말하지 않은 사실, 사건, 숫자를 만들지 않는다. 장면 칸은 [근거 장면]이 있을 때만 쓰고, 없으면 빈 문자열.\n" +
    "- 검증과 반론 칸(link)은 두 부분이다. 먼저 '숫자로 확인해 보면'으로 저자의 주요 판단을 하나씩 확인한다: 맞는 것, 반만 맞는 것, 확인할 수 없는 것을 나눠 쓰고, 숫자는 널리 알려진 공식 통계나 저자가 말한 숫자에서만 가져온다. 다음으로 인터뷰에서 나온 가장 아픈 반론 한두 개와 저자의 실제 답을 '— 질문 / — 답' 짧은 문답으로 싣는다. 저자가 하지 않은 답을 만들지 않는다.\n" +
    "- 유명인이나 이론을 인용해 권위를 빌리지 않는다. 이론이 꼭 필요하면 본문에 쓰지 말고 theory에만 참고로 남긴다.\n" +
    "- 독자에게 칸은 독자가 스스로 적용해 볼 질문 하나.\n" +
    "- 전체 2,000~2,500자(A4 두 장 안팎). " + VOICE + "\n" +
    "\n[인터뷰 정리]\n" + SLOTS.map((s) => s.name + ": " + (sl[s.id] || "(없음)")).join("\n") +
    "\n\n[인용: 저자의 원래 표현]\n" + (iv.quotes.map((q) => "- " + q).join("\n") || "(없음)") +
    "\n\n[저자가 한 말 전체]\n" + (said || "(없음)") +
    "\n\n[근거 장면]\n" + (iv.scenes.map(sceneFull).join("\n\n") || "(없음)") +
    (prev && ask ? "\n\n[지금 원고]\n" + prev + "\n\n[저자의 요청] " + ask + "\n위 원고를 요청대로 고쳐 다시 쓴다. 저자가 직접 고친 문장은 되도록 그대로 둔다." : "") +
    '\n\n[응답 형식] JSON 하나로만 답하세요.\n{"title": "꼭지 제목", "sections": {' + SECTIONS.map((s) => '"' + s.id + '": "' + s.name + '"').join(", ") + '}, "theory": [{"name": "이론·연구 이름", "who": "저자·연도", "use": "참고로 남기는 이유 한 줄 (없으면 빈 배열)"}]}';
  const r = await aiJSON(prompt, { cache: false });
  if (!r || !r.sections || typeof r.sections !== "object") throw { code: "invalid_json" };
  const sec = {}; SECTIONS.forEach((s) => (sec[s.id] = String(r.sections[s.id] || "").trim()));
  return { title: String(r.title || it.q), sections: sec, theory: Array.isArray(r.theory) ? r.theory.filter((t) => t && t.name) : [] };
}
