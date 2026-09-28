// Mock of the claude.ai artifact runtime for local testing only.
(function () {
  const store = new Map();
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
    await delay(window.__AI_DELAY__ || 300);
    const t = textOf(input);
    if (window.__AI_FAIL__) throw { code: window.__AI_FAIL__, message: "mock" };
    if (window.__AI_PROSE_ONCE__) { const tx = window.__AI_PROSE_ONCE__; window.__AI_PROSE_ONCE__ = null; throw { code: "invalid_json", message: "mock", text: tx }; }
    if (window.__AI_FAIL_ONCE__) { const c = window.__AI_FAIL_ONCE__; window.__AI_FAIL_ONCE__ = null; throw { code: c, message: "mock" }; }
    if (t.includes('{"issues"')) return { issues: [
      { area: "decide", q: "도전할지 말지는 무엇으로 정하나?", why: "공부방을 차릴 때 최소 이득부터 계산했다." },
      { area: "work", q: "조직이 정해 주지 않은 역할은 누가 정하나?", why: "EM 교육 인사말: 정할 사람도 우리다." },
      { area: "money", q: "빚을 내서 투자해도 되나?", why: "이미 있는 질문과 겹침" },
      { area: "fail", q: "실패한 선택은 언제 접어야 하나?", why: "" }] };
    if (t.includes('"sections"')) {
      const re = t.includes("[저자의 요청]");
      return { title: re ? "다시 쓴 제목" : "최악일 때 남는 것부터 센다", sections: {
        opinion: re && t.includes("잘 안 되면 뭐가 남는지부터 따진다.") ? "나는 해 볼지 말지를 정할 때, 잘 안 되면 뭐가 남는지부터 따진다. 그게 전부다." : "나는 도전할지 말지를 정할 때 얼마나 벌지보다 잘 안 됐을 때 무엇이 남는지부터 센다. 그게 괜찮으면 해 본다.",
        process: "공부방을 차릴 때 따진 건 수익이 아니었다. 허접한 자취방 대신 같은 돈으로 아파트에서 산다는 것, 그게 내가 가질 수 있는 미니멈 혜택이었다.",
        scene: t.includes("[근거 장면]\n(없음)") ? "" : "대학 3학년 때 원장에게 잘리고 한 달이 안 돼 옆 아파트에 월세를 얻었다.",
        limits: "잃는 것이 돈이 아니라 사람일 때는 이 계산이 맞지 않는다.",
        link: "Saras Sarasvathy(2001)의 이펙추에이션에는 감당 가능한 손실이라는 원칙이 있다. 반론도 있다.",
        reader: "지금 망설이는 일이 잘 안 된다면, 당신 손에는 무엇이 남는가?" },
        theory: [{ name: "이펙추에이션: 감당 가능한 손실", who: "Saras Sarasvathy, 2001", use: "기대 수익보다 잃어도 되는 만큼으로 뛰어든다" }] };
    }
    if (t.includes('"slots"')) {
      const turns = Array.isArray(input) ? input.length : 1;
      const lastU = Array.isArray(input) ? String(input[input.length - 1].content).split("\n\n(답은")[0] : "";
      const ids = Array.from(t.matchAll(/^(s[a-z0-9]+) \|/gm)).map((m) => m[1]);
      if (turns <= 1) return { reply: "도전할지 말지를 어떻게 정하는지에 대한 이슈입니다. 먼저, 이럴 때 보통 어떻게 판단하세요?", slots: {}, quotes: [], check: { concrete: false, fresh: false, robust: false, note: "" }, scenes: [], done: false };
      const n = Math.floor(turns / 2);
      if (window.__IV_PROSE__) { window.__IV_PROSE__ = false; throw { code: "invalid_json", message: "mock", text: "산문으로 답했어요. 조금 더 말씀해 주세요." }; }
      const all = n >= 5;
      const sl = [{ opinion: "잘 안 됐을 때 남는 것부터 센다." }, { reason: "최소 이득이 괜찮으면 수익은 덤이다." }, { counter: "기대 수익을 봐야 한다는 반론에는, 기대는 틀리기 쉽다고 답한다." }, { cond: "잃는 것이 사람일 때는 통하지 않는다." }, { principle: "망해도 남는 게 있으면 한다." }][Math.min(n - 1, 4)];
      return { reply: (lastU.replace(/\s/g, "").length <= 12 ? "짧게 답하셨네요. A에 가깝나요, B에 가깝나요? " : "그렇군요. ") + "다음 질문입니다.", slots: sl, quotes: lastU.length > 8 ? [lastU.slice(0, 30)] : [], check: { concrete: n >= 2, fresh: n >= 3, robust: all, note: all ? "" : "아직 반론에 답이 없어요." }, scenes: ids.length && n === 3 ? [ids[0], "nope"] : [], done: all };
    }
    return {};
  }
  async function sample(input, opts) { const r = await json(input, opts); return { text: JSON.stringify(r), truncated: false, modelTierApplied: "default" }; }
  sample.json = json; sample.limits = async () => ({ maxPromptBytes: 65536 });
  const downloads = { save: async ({ filename, data }) => { const size = typeof data === "string" ? data.length : data.size || data.byteLength || 0; (window.__SAVED__ = window.__SAVED__ || []).push({ filename, size, data: typeof data === "string" ? data : null }); return { status: "saved" }; } };
  const permissions = { state: async () => ({ db: "granted", sample: "granted" }) };
  const caps = { db, user, sample, downloads, permissions };
  window.claude = { use: (n) => new Promise((r) => setTimeout(() => r(window.__NO_CLAUDE_CAPS__ ? null : caps[n] || null), 60)) };
})();
