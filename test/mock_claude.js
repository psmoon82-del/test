// Mock of the claude.ai artifact runtime for local testing only.
(function () {
  const SEED = window.__SEED__;
  const store = new Map();
  if (SEED && !window.__NO_SEED__) store.set("seed/owner", JSON.parse(JSON.stringify(SEED)));
  if (window.__PRE__) Object.entries(window.__PRE__).forEach(([k, v]) => store.set(k, v));
  window.__store = store;
  const deepFreeze = (o) => { if (o && typeof o === "object") { Object.values(o).forEach(deepFreeze); Object.freeze(o); } return o; };
  const snap = (path) => { const d = store.get(path); return { id: path.split("/").pop(), exists: d !== undefined, data: () => (d === undefined ? undefined : deepFreeze(JSON.parse(JSON.stringify(d)))), metadata: { fromCache: false, hasPendingWrites: false } }; };
  const doc = (path) => ({ id: path.split("/").pop(), path, get: async () => snap(path), set: async (d) => { await new Promise((r) => setTimeout(r, 20)); store.set(path, JSON.parse(JSON.stringify(d))); window.__writes = (window.__writes || 0) + 1; }, update: async (d) => { store.set(path, Object.assign(store.get(path) || {}, d)); }, delete: async () => store.delete(path), onSnapshot: (n) => { n(snap(path)); return () => {}; } });
  const coll = (p) => ({ path: p, doc: (id) => doc(p + "/" + id), get: async () => { const depth = p.split("/").length + 1; const docs = Array.from(store.keys()).filter((k) => k.startsWith(p + "/") && k.split("/").length === depth).sort().map(snap); return { docs, size: docs.length, empty: !docs.length }; } });
  const db = { doc, collection: coll };
  const user = { id: async () => "u_testuser000000000000000", isOwner: async () => !window.__NOT_OWNER__, canEdit: async () => true, can: async () => true, me: async () => ({ id: "u_test", name: "", isOwner: true }) };
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  const textOf = (input) => (typeof input === "string" ? input : input.map((t) => t.content).join("\n"));
  async function json(input, opts) {
    (window.__SENT__ = window.__SENT__ || []).push({ input, opts });
    await delay(window.__AI_DELAY__ || 400);
    const t = textOf(input);
    if (window.__AI_FAIL__) throw { code: window.__AI_FAIL__, message: "mock" };
    if (window.__AI_PROSE_ONCE__) { const tx = window.__AI_PROSE_ONCE__; window.__AI_PROSE_ONCE__ = null; throw { code: "invalid_json", message: "mock", text: tx }; }
    if (window.__AI_FAIL_ONCE__) { const c = window.__AI_FAIL_ONCE__; window.__AI_FAIL_ONCE__ = null; throw { code: c, message: "mock" }; }
    if (t.includes('{"answer"')) return t.includes("직접 정리한 자기 기록") ? { answer: "기록을 보면 조립과 설계를 좋아하시니, 주말엔 프라모델과 캠핑 장비 정비를 추천해요.", used: ["좋아하는 것: 프라모델", "에너지: 손으로 만들기"] } : { answer: "주말 취미로는 등산, 독서, 요리가 무난해요." };
    if (t.includes('{"items"')) return { items: [
      { q: "갑자기 하루 휴가가 생기면?", opts: ["집에서 쉰다", "혼자 드라이브", "가족과 외출"], cat: "routine", pred: 0, conf: 70, why: "주말에 집에서 쉬는 걸 좋아한다고 적었어요." },
      { q: "새 전자기기를 살 때 먼저 하는 일은?", opts: ["리뷰를 몇 시간 찾아본다", "매장에서 만져 본다"], cat: "taste", pred: 0, conf: 80, why: "기기 구경과 세팅에서 에너지를 얻는다고 했어요." },
      { q: "회의에서 의견이 갈리면?", opts: ["데이터를 먼저 모은다", "분위기를 본다"], cat: "work", pred: 0, conf: 65, why: "근거를 먼저 확인하는 편이라고 답했어요." },
      { q: "보너스가 들어오면?", opts: ["저축", "갖고 싶던 물건", "가족 여행"], cat: "money", pred: 2, conf: 55, why: "가족과의 여행을 원하는 것에 적었어요." },
      { q: "스트레스가 쌓이면?", opts: ["술자리", "혼자 뭔가 만든다"], cat: "mind", pred: 1, conf: 60, why: "만들기에서 충전된다고 했어요." }] };
    if (t.includes('"topics"')) {
      if (t.includes("이번 AI 인터뷰 대화")) return { topics: [{ area: "fun", label: "건담 조립", under: "", memo: "조립할 때 시간 가는 줄 모른다고 했다.", weight: 2 }] };
      return { topics: [{ area: "health", label: "간 수치 관리", under: "", memo: "r-GTP가 3년째 오르고 있다.", weight: 3 }, { area: "work", label: "이직 고민", under: "", memo: "지금 일의 의미를 다시 묻고 있다.", weight: 2 }, { area: "money", label: "연금 준비", under: "은퇴", memo: "60세 은퇴를 생각한다.", weight: 1 }, { area: "fun", label: "은퇴", under: "", memo: "이미 있는 주제", weight: 1 }] };
    }
    if (t.includes('"archetype"')) return { archetype: "조용한 설계자", headline: "흩어진 것을 모아 구조를 짜야 마음이 놓이는 사람", essence: "상황을 끝까지 파악한 뒤에야 방향을 정하는 신중함이 일과 생활 전반에 깔려 있다. 통신요금 표, 집 정리 동선, 여행 시간표처럼 스스로 체계를 설계하는 일에서 에너지를 얻는다. 다만 조율과 회의가 일의 본체가 되면서 몰입이 줄었고, 스스로 만드는 일에 대한 갈증이 세컨잡 고민으로 이어진다.", strengths: ["상황 파악 후 방향 결정", "생활을 시스템으로 설계", "기술 변화를 먼저 읽음"], shadows: ["결정적 순간을 미루는 회피", "조율에 에너지를 소진"], drives: ["자기주도", "시간의 여유", "가족"], tasteDNA: ["깊은 국물과 구운 맛", "완결된 이야기", "손에 잡히는 기기"], nowFocus: "몇 달째 없는 몰입을 되찾을 작은 만들기 프로젝트", question: "하루 4시간만 일해도 된다면, 남은 시간에 무엇을 만들겠습니까?", gaps: "가족 관계와 건강에 대한 응답이 적어 확신하기 어렵다." };
    if (t.includes('"themes"')) {
      const ids = Array.from(t.matchAll(/^([a-z]+_[A-Za-z0-9_]+) \|/gm)).map((m) => m[1]);
      const pick = (k) => ids.filter((_, i) => i % k === 0);
      return { themes: [{ name: "만드는 사람", desc: "손과 머리로 뭔가를 설계하고 만들 때 살아난다", members: pick(5).slice(0, 6) }, { name: "시간의 주인", desc: "돈보다 시간 통제권을 원한다", members: pick(7).slice(0, 5) }, { name: "가족의 울타리", desc: "결국 가족으로 돌아온다", members: pick(9).slice(0, 4) }], links: ids.slice(0, 16).map((a, i) => ({ a, b: ids[(i * 7 + 11) % ids.length], why: "둘 다 스스로 설계하고 통제하려는 욕구에서 나온다" })) };
    }
    if (t.includes('"insight"')) return { insight: "중요도와 만족도의 차이가 가장 큰 곳은 재미와 건강이에요. '명확한 취미가 없다'는 2022년 메모와 '몇 달째 몰입이 없다'는 말이 같은 방향을 가리킵니다. 반면 가족과 환경은 이미 잘 채워져 있어요.", question: "지난 한 달 중 가장 시간이 빨리 간 두 시간은 언제였나요?" };
    if (t.includes("인터뷰어")) {
      const turns = Array.isArray(input) ? input.length : 1;
      const lastU = Array.isArray(input) ? String(input[input.length - 1].content) : "";
      if (t.includes("[마지막 분류]") && lastU.includes("마치")) return { reply: "수고하셨어요. 이번 인터뷰는 여기까지예요.", facts: [], wants: [], events: [], move: "next" };
      if (t.includes("[다음 주제로 넘어갈 때]") && lastU.includes("넘어가")) return { reply: "좋아요, 다음 주제로 가 볼게요. 첫 질문입니다.", facts: [], wants: [], events: [], move: "next" };
      if (window.__IV_NOFACTS__ && turns > 1) return { reply: "그렇군요. 조금 더 여쭤볼게요.", facts: [], wants: [], events: [] };
      if (window.__IV_VARY__ && turns > 1) return { reply: "알겠어요. 다음 질문입니다.", facts: [{ cat: "health", sub: ["건강 상태", "복용약", "없는칸"][turns % 3], text: "건강 사실 " + turns + "." }], wants: [], events: [] };
      if (turns <= 1) return { reply: "안녕하세요. 프로필을 읽어 보니 몇 달째 몰입이 없다고 하셨어요. 가장 최근에 '시간 가는 줄 몰랐다'고 느낀 건 언제, 무엇을 할 때였나요?", facts: [], wants: [], events: [] };
      return { reply: "건담을 조립할 때 손이 먼저 움직였다는 말이 인상적이에요. 그때 결과물보다 과정 중 어떤 순간이 가장 좋았나요?", facts: [{ area: "energy", text: "건담을 조립할 때 시간 가는 줄 모른다." }, { area: "loves", text: "완성보다 조립 과정 자체를 즐긴다." }], wants: [{ type: "do", text: "주말마다 프라모델 한 판 완성하기", horizon: "1y" }], events: [{ year: "2024", label: "첫 PG 건담 조립", lane: "me" }] };
    }
    if (t.includes('"facts"')) return { facts: [{ area: "thoughts", text: "생활 속 불편을 제품 아이디어로 바꿔 생각하는 습관이 있다." }] };
    return {};
  }
  async function sample(input, opts) { const r = await json(input, opts); return { text: JSON.stringify(r), truncated: false, modelTierApplied: "default" }; }
  sample.json = json; sample.limits = async () => ({ maxPromptBytes: 65536 });
  const downloads = { save: async ({ filename, data }) => { const size = typeof data === "string" ? data.length : data.size || data.byteLength || 0; (window.__SAVED__ = window.__SAVED__ || []).push({ filename, size, data: typeof data === "string" ? data : null }); return { status: "saved" }; } };
  const permissions = { state: async () => ({ db: "granted", sample: "granted" }) };
  const caps = { db, user, sample, downloads, permissions };
  window.claude = { use: (n) => new Promise((r) => setTimeout(() => r(window.__NO_CLAUDE_CAPS__ ? null : caps[n] || null), 60)) };
})();
