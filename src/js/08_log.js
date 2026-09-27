/* ============================================================ LOG · 정비 일지 */
function viewLog() {
  const items = S.LOG.items, f = S.ui.logFilter, P = S.P;
  const counts = {}; items.forEach((r) => (counts[r.type] = (counts[r.type] || 0) + 1));
  const nt = S.ui.newType || "thought";
  const input = '<section class="sheet log-in lift"><div class="row" style="gap:6px">' + REC_TYPES.map((t) => '<button class="chip ' + (nt === t.id ? "on" : "") + '" data-act="logType" data-v="' + t.id + '"><i class="dot" style="background:' + t.color + '"></i>' + t.name + "</button>").join("") +
    '<input class="input mono" id="logDate" type="date" value="' + localDate() + '" style="width:auto;margin-left:auto;padding:5px 9px;font-size:12.5px" aria-label="날짜"></div>' +
    '<textarea class="input" id="logText" rows="3" placeholder="' + esc(({ diary: "오늘 있었던 일, 느낀 것", thought: "요즘 드는 생각", idea: "떠오른 아이디어. 엉뚱해도 괜찮아요", pain: "불편했던 것. 불편은 아이디어의 원석이에요", thanks: "고마웠던 것" })[nt]) + '">' + esc(S.ui.logDraft || "") + "</textarea>" +
    '<div class="row" style="justify-content:space-between"><span class="muted" style="font-size:11.5px">Ctrl(⌘)+Enter로 저장 · 저장 후 "나에 대해 뽑기"를 누르면 Claude가 사실을 추려 프로필에 더해요</span><button class="btn primary" data-act="logAdd">' + I.plus + "기록하기</button></div></section>";
  const filters = '<div class="row" style="justify-content:space-between;margin:22px 0 4px"><div class="row" style="gap:6px"><button class="chip ' + (f === "all" ? "on" : "") + '" data-act="logFilter" data-v="all">전체 ' + items.length + "</button>" + REC_TYPES.map((t) => '<button class="chip ' + (f === t.id ? "on" : "") + '" data-act="logFilter" data-v="' + t.id + '"><i class="dot" style="background:' + t.color + '"></i>' + t.name + " " + (counts[t.id] || 0) + "</button>").join("") + '</div><input class="input" id="logQ" placeholder="기록 검색" style="width:200px;padding:6px 10px;font-size:13px" value="' + esc(S.ui.logQ || "") + '"></div>';
  const shown = items.filter((r) => f === "all" || r.type === f).sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.at).localeCompare(String(a.at)));
  const factById = Object.fromEntries(P.facts.map((x) => [x.id, x]));
  let list = "", lastM = null;
  shown.forEach((r) => {
    const m = String(r.date || "").slice(0, 7) || "날짜 없음";
    if (m !== lastM) { list += '<div class="log-month">' + esc(m.length === 4 ? m + "년" : fmtYM(m)) + "</div>"; lastM = m; }
    const T = RT_BY[r.type] || REC_TYPES[1];
    const ex = (r.extracted || []).map((id) => factById[id]).filter(Boolean);
    const busy = S.ui.busy["rec_" + r.id];
    list += '<article class="log-item" data-q="' + esc((r.text + " " + T.name).toLowerCase()) + '"><div class="d"><span>' + esc(fmtYM(r.date)) + '</span><span class="ltype"><i class="dot" style="background:' + T.color + '"></i>' + T.name + '</span></div><div><div class="tx">' + nl2br(r.text) + "</div>" + (r.src ? '<div class="src">' + esc(r.src) + "</div>" : "") +
      (ex.length ? '<div class="row" style="gap:6px;margin-top:8px">' + ex.map((x) => '<span class="fact-chip"><b>' + esc(AREAS[x.area] || x.area) + "</b>" + esc(x.text) + '<button data-act="factDel" data-id="' + x.id + '" aria-label="지우기">×</button></span>').join("") + "</div>" : r.extractedNone ? '<div class="muted" style="font-size:12px;margin-top:6px">새로 뽑을 사실이 없었어요.</div>' : "") +
      '</div><div class="ops">' + (busy ? '<span class="typing"><span class="spinner"></span></span>' : aiAvailable() && !ex.length ? '<button class="btn sm" data-act="recExtract" data-id="' + r.id + '">' + I.spark + "나에 대해 뽑기</button>" : "") +
      (S.ui.confirmDel === r.id ? '<button class="btn sm signal" data-act="recDel" data-id="' + r.id + '">삭제</button><button class="btn sm ghost" data-act="recDelCancel">취소</button>' : '<button class="btn sm ghost" data-act="recDelAsk" data-id="' + r.id + '" aria-label="삭제">' + I.trash + "</button>") + "</div></article>";
  });
  return '<div class="page-head"><div><div class="eyebrow">Maintenance log · 정비 일지</div><h1>기록</h1><p class="lede">일기, 생각, 아이디어, 불편, 감사. 짧은 기록이 쌓이면 나에 대한 사실이 되고, 사실이 쌓이면 초상이 선명해져요.</p></div></div>' +
    input + filters + '<div class="log-list" id="logList">' + (list || '<div class="empty">기록이 없어요.</div>') + "</div>";
}
function applyLogSearch() {
  const q = (S.ui.logQ || "").trim().toLowerCase();
  $$(".log-item").forEach((el) => { el.hidden = q && !el.dataset.q.includes(q); });
}
