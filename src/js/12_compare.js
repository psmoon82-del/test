/* ============================================================ PACK COMPARE · Pack 효과 비교
   The same question goes to Claude twice: once knowing nothing about me, once with the selected Pack.
   The owner picks which answer helped more; the tally shows whether the records earn their keep. */
const CMP_EX = {
  all: "나에게 맞는 주말 취미를 추천해 줘",
  career: "내 경력으로 자기소개서 첫 문단을 써 줘",
  health: "최근 건강검진 결과를 보고 앞으로 3개월 동안 할 일을 정리해 줘",
  money: "내 상황에서 지금 점검해야 할 보험이나 지출이 뭘까?",
  home: "이사 갈 동네를 고를 때 나에게 중요한 기준을 정리해 줘",
  taste: "이번 주말에 볼 영화 3편 추천해 줘",
  plan: "다음 주 일정을 짜는 걸 도와줘",
  counsel: "요즘 내 고민을 정리하는 걸 도와줘",
  study: "나에게 맞는 영어 공부 방법을 추천해 줘",
};
const CMP_PICK = [["plain", "Pack 없이가 나았다"], ["same", "비슷하다"], ["pack", "Pack과 함께가 나았다"]];
const CMP_MAX = 40000;
const cmpList = () => S.PLAY.compare || (S.PLAY.compare = []);
async function aiCompare(pack, q) {
  const ask = "한국어로, 핵심만 700자 이내로 답하세요. 목록이 도움이 되면 줄바꿈으로 나눠도 됩니다.";
  S.ui.cmpStep = 1; render();
  const a = await aiJSON("다음 질문에 답해 주세요. 질문한 사람에 대해서는 아무 정보도 없습니다. " + ask + "\n\n[질문] " + q + '\n\nJSON 하나로만 답하세요: {"answer": "답"}');
  S.ui.cmpStep = 2; render();
  let text = packText(S.P, pack);
  if (text.length > CMP_MAX) text = text.slice(0, CMP_MAX) + "\n…(길어서 뒷부분 생략)";
  const b = await aiJSON(text + "\n\n---\n위 자료는 질문한 사람이 직접 정리한 자기 기록입니다. 이 자료를 바탕으로 이 사람에게 맞춰 답해 주세요. 자료에 없는 것은 추측하지 마세요. " + ask + "\n\n[질문] " + q + '\n\nJSON 하나로만 답하세요: {"answer": "답", "used": ["답에 쓴 자료 항목, 짧게"]}');
  if (!a || !a.answer || !b || !b.answer) throw { code: "invalid_json" };
  cmpList().unshift({ id: uid("c"), at: nowISO(), pack: pack.id, q, a0: String(a.answer), a1: String(b.answer), used: (Array.isArray(b.used) ? b.used : []).slice(0, 8).map((x) => cut(x, 60)), pick: null });
  if (cmpList().length > 15) S.PLAY.compare = cmpList().slice(0, 15);
  S.ui.cmpSel = cmpList()[0].id; markDirty();
}
function cmpSection(pack) {
  const xs = cmpList(), sel = xs.find((c) => c.id === S.ui.cmpSel) || null, busy = S.ui.busy.cmp;
  const picked = xs.filter((c) => c.pick), win = picked.filter((c) => c.pick === "pack").length;
  const ask = '<div class="row" style="flex-wrap:nowrap;align-items:flex-end"><textarea class="input" id="cmpQ" rows="2" placeholder="예: ' + esc(CMP_EX[pack.id] || CMP_EX.all) + '">' + esc(S.ui.cmpDraft || "") + "</textarea>" +
    (busy ? '<span class="typing" style="white-space:nowrap"><span class="spinner"></span>' + (S.ui.cmpStep === 2 ? "Pack과 함께 (2/2)" : "Pack 없이 (1/2)") + "</span>" : aiAvailable() ? '<button class="btn accent" data-act="cmpRun">' + I.spark + "비교하기</button>" : "") + "</div>" +
    '<div class="row" style="gap:6px"><button class="chip" data-act="cmpEx">예시 질문 쓰기</button><span class="muted" style="font-size:12px">지금 고른 Pack: <b>' + esc(pack.name) + "</b></span></div>";
  const res = sel ? '<div class="cmp-q"><span class="muted">질문</span> ' + esc(sel.q) + ' <span class="tag">' + esc((PACK_BY[sel.pack] || pack).name) + " Pack</span></div>" +
    '<div class="cmp-grid"><div class="cmp-a"><div class="eyebrow">Pack 없이</div><div class="cmp-t">' + esc(sel.a0) + '</div></div><div class="cmp-a pack"><div class="eyebrow">Pack과 함께</div><div class="cmp-t">' + esc(sel.a1) + "</div>" +
    (sel.used.length ? '<div class="cmp-used">' + sel.used.map((u) => '<span class="tag">' + esc(u) + "</span>").join("") + "</div>" : "") + "</div></div>" +
    '<div class="row" style="gap:8px"><span class="flabel">어느 쪽이 도움이 됐나요?</span><span class="mini-seg">' + CMP_PICK.map(([v, l]) => '<button class="' + (sel.pick === v ? "on" : "") + '" data-act="cmpPick" data-id="' + sel.id + '" data-v="' + v + '">' + l + "</button>").join("") + "</span></div>" : "";
  const hist = xs.length > 1 ? '<details class="tbl"><summary>지난 비교 ' + xs.length + "개</summary><ul class=\"list-plain\">" + xs.map((c) => '<li><button class="link" data-act="cmpShow" data-id="' + c.id + '">' + esc(cut(c.q, 60)) + '</button><span class="muted" style="font-size:11.5px;margin-left:auto">' + esc((CMP_PICK.find((p) => p[0] === c.pick) || [0, "평가 전"])[1]) + "</span></li>").join("") + "</ul></details>" : "";
  return '<section class="sheet pad stack cmp" style="gap:12px;margin-bottom:18px"><div class="row" style="justify-content:space-between"><h3>Pack 효과 비교</h3><span class="muted" style="font-size:12px">' + (picked.length ? "평가 " + picked.length + "번 중 Pack이 나았다 " + win + "번 (" + Math.round((win / picked.length) * 100) + "%)" : "같은 질문을 Pack 없이/있이 물어 두 답을 나란히 봐요") + "</span></div>" +
    ask + (S.ui.cmpErr ? '<p class="banner">' + esc(S.ui.cmpErr) + "</p>" : "") + res + hist + "</section>";
}
