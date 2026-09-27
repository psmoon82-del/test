(function(){
"use strict";
/* ============================================================ utilities */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nl2br = (s) => esc(s).replace(/\n/g, "<br>");
const uid = (p) => (p || "x") + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sum = (a) => a.reduce((x, y) => x + y, 0);
const avg = (a) => (a.length ? sum(a) / a.length : 0);
const pad2 = (n) => String(n).padStart(2, "0");
const nowISO = () => new Date().toISOString();
const localDate = (d) => { d = d || new Date(); return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); };
const curYM = () => { const d = new Date(); return d.getFullYear() + "-" + pad2(d.getMonth() + 1); };
const nowYear = () => { const d = new Date(); return d.getFullYear() + d.getMonth() / 12; };
const fmtDot = (iso) => { if (!iso) return "-"; const d = new Date(iso); if (isNaN(d)) return String(iso); return d.getFullYear() + "." + pad2(d.getMonth() + 1) + "." + pad2(d.getDate()); };
const fmtYM = (s) => { if (!s) return "연도 미정"; const [y, m, d] = String(s).split("-"); return y + (m ? "." + m : "") + (d ? "." + d : ""); };
/* "2017-05" -> 2017.33 ; "2017" -> 2017 ; null -> null */
const ym2num = (s) => { if (s == null || s === "") return null; const p = String(s).split("-"); const y = +p[0]; if (!y) return null; const m = p[1] ? +p[1] - 1 : 0; return y + m / 12; };
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const pick = (arr, n) => arr.slice(0, n);
const clone = (o) => JSON.parse(JSON.stringify(o));
const words = (n) => n;

let toastTimer = null;
function toast(msg, ms) {
  let el = $("#toast");
  if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, ms || 2600);
}

/* inline icons (stroke = currentColor) */
const I = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3 11 12 4l9 7"/><path d="M5 10v9h14v-9"/><path d="M10 19v-5h4v5"/></svg>',
  route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5" stroke-linecap="round"/></svg>',
  log: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h10l3 3v15H6z"/><path d="M9 9h7M9 13h7M9 17h4"/></svg>',
  dwg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M13 15h8M13 15v5M3 15h4" /><path d="M7 11l3-4 3 3 2-2" stroke-linecap="round"/></svg>',
  person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6" stroke-linecap="round"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="6" r="1.8"/><circle cx="19" cy="7" r="1.8"/><circle cx="6" cy="18" r="1.8"/><circle cx="18" cy="18" r="1.8"/><path d="M10.2 10.6 6.4 7.2M13.9 10.9l3.5-2.7M10.4 13.8l-3 2.7M13.8 13.8l2.9 2.8"/></svg>',
  gantt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M3 4v16h18"/><path d="M6 8h7M9 12h9M7 16h5"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 12 20 4l-6 16-3-7z"/></svg>',
  logo: '<svg viewBox="0 0 32 32" fill="none"><rect x="1" y="1" width="30" height="30" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M5 19h22l-3 6H8z" fill="var(--accent)"/><path d="M9 19v-6h6v6M15 15h5v4" stroke="currentColor" stroke-width="1.5"/><path d="M5 8h22" stroke="var(--signal)" stroke-width="1.5" stroke-dasharray="2 2"/></svg>',
};

/* ============================================================ domain constants (generic — no personal data here) */
const CH = [
  { id: "basics", code: "00", stage: "기본설계", name: "제원", title: "나의 제원", mins: 2, frame: "자기소개의 기본 틀",
    why: "배를 짓기 전에 제원표부터 정합니다. 이름, 나이, 사는 곳, 가족, 하는 일. 뒤에 나올 모든 해석의 기준점이에요." },
  { id: "wheel", code: "01", stage: "선체 점검", name: "지금의 나", title: "지금 나는 어디가 기울어 있나", mins: 5, frame: "라이프 휠(Wheel of Life) · 코칭 도구",
    why: "삶의 여덟 영역마다 지금의 만족도와 나에게 중요한 정도를 따로 매깁니다. 둘의 차이가 큰 곳이 지금 손봐야 할 곳이에요." },
  { id: "ipip", code: "02", stage: "선형", name: "타고난 결", title: "나는 어떤 결을 가진 사람인가", mins: 4, frame: "Big Five · Mini-IPIP 20문항(공개 척도)",
    why: "성격 심리학에서 가장 많이 검증된 5요인 모델의 간이 척도입니다. 좋고 나쁨이 아니라 어느 쪽으로 기울어 있는지를 봐요." },
  { id: "values", code: "03", stage: "항로", name: "나를 움직이는 것", title: "결정적인 순간, 나는 무엇을 고르나", mins: 5, frame: "Schwartz 기본 가치 이론 · 딜레마 선택",
    why: "무엇이 중요하냐고 물으면 누구나 좋은 답을 고릅니다. 그래서 둘 다 괜찮은 것 사이에서 하나를 고르게 해요. 선택이 쌓이면 실제 우선순위가 드러납니다." },
  { id: "energy", code: "04", stage: "기관", name: "에너지와 일", title: "무엇이 나를 충전하고 무엇이 방전시키나", mins: 6, frame: "에너지 감사 · 크로노타입 · DISC 간이",
    why: "같은 하루라도 어떤 일은 힘을 주고 어떤 일은 힘을 빼앗습니다. 활동별 에너지, 몰입 경험, 하루 리듬, 일하는 방식을 봐요." },
  { id: "loves", code: "05", stage: "의장", name: "좋아하는 것", title: "나는 무엇을 좋아하는 사람인가", mins: 6, frame: "취향 드릴다운 · 좋아하는 이유",
    why: "큰 분류에서 시작해 구체적인 것으로 내려갑니다. 무엇을 좋아하는지보다 왜 좋은지를 적을수록 취향의 공통분모가 보여요." },
  { id: "thoughts", code: "06", stage: "화물", name: "마음속 주제", title: "나는 무엇을 싣고 다니나", mins: 6, frame: "마인드맵(think tree) 재검토",
    why: "오래 머릿속을 차지해 온 주제들입니다. 예전 메모를 지금의 눈으로 다시 보고, 여전히 무거운지, 생각이 바뀌었는지, 내려놓았는지 표시해요." },
  { id: "wants", code: "07", stage: "목적지", name: "원하는 것", title: "나는 어디로 가고 싶은가", mins: 6, frame: "Have · Do · Be · Learn · Give",
    why: "갖고 싶은 것, 해보고 싶은 것, 되고 싶은 모습, 배우고 싶은 것, 나누고 싶은 것. 시기와 중요도를 매기면 인생 공정표의 미래 구간이 채워집니다." },
  { id: "timeline", code: "08", stage: "항해일지", name: "연대기", title: "나는 어디서 와서 지금 여기에 있나", mins: 5, frame: "인생 공정표(Life Gantt)",
    why: "지나온 이정표와 앞으로의 계획을 하나의 시간축 위에 놓습니다. 추정으로 채운 연도는 확인하거나 고쳐 주세요." },
];
const CH_BY = Object.fromEntries(CH.map((c) => [c.id, c]));
const POST_STAGES = [
  { id: "interview", code: "09", stage: "시운전", name: "AI 인터뷰", href: "#interview" },
  { id: "portrait", code: "10", stage: "인도", name: "자기 초상", href: "#portrait" },
];

const WHEEL = [
  { id: "health", name: "건강", sub: "몸과 컨디션" },
  { id: "money", name: "재정", sub: "돈과 경제적 여유" },
  { id: "work", name: "일", sub: "커리어와 일의 보람" },
  { id: "family", name: "가족", sub: "배우자·아이·부모" },
  { id: "people", name: "관계", sub: "친구·동료·사람들" },
  { id: "growth", name: "성장", sub: "배움과 자기계발" },
  { id: "fun", name: "재미", sub: "여가와 취미" },
  { id: "env", name: "환경", sub: "집과 생활 공간" },
];

/* Mini-IPIP (Donnellan et al., 2006) — public-domain IPIP items, Korean wording */
const IPIP = [
  { n: 1, t: "E", k: 1, q: "모임에서 분위기를 띄우는 편이다" },
  { n: 2, t: "A", k: 1, q: "다른 사람의 감정에 공감한다" },
  { n: 3, t: "C", k: 1, q: "해야 할 일을 바로바로 처리한다" },
  { n: 4, t: "N", k: 1, q: "기분 변화가 잦다" },
  { n: 5, t: "O", k: 1, q: "상상력이 풍부하다" },
  { n: 6, t: "E", k: -1, q: "말수가 적은 편이다" },
  { n: 7, t: "A", k: -1, q: "다른 사람의 문제에는 별 관심이 없다" },
  { n: 8, t: "C", k: -1, q: "물건을 제자리에 두는 걸 자주 잊는다" },
  { n: 9, t: "N", k: -1, q: "대부분의 시간 동안 느긋하다" },
  { n: 10, t: "O", k: -1, q: "추상적인 생각에는 관심이 없다" },
  { n: 11, t: "E", k: 1, q: "모임에서 여러 사람과 두루 이야기한다" },
  { n: 12, t: "A", k: 1, q: "다른 사람의 감정을 잘 느낀다" },
  { n: 13, t: "C", k: 1, q: "정돈된 상태를 좋아한다" },
  { n: 14, t: "N", k: 1, q: "쉽게 속상해한다" },
  { n: 15, t: "O", k: -1, q: "추상적인 개념을 이해하기 어렵다" },
  { n: 16, t: "E", k: -1, q: "사람들 사이에서 눈에 띄지 않게 있는 편이다" },
  { n: 17, t: "A", k: -1, q: "다른 사람에게 그다지 관심이 없다" },
  { n: 18, t: "C", k: -1, q: "일을 엉망으로 만들 때가 있다" },
  { n: 19, t: "N", k: -1, q: "우울한 기분을 거의 느끼지 않는다" },
  { n: 20, t: "O", k: -1, q: "상상력이 좋은 편은 아니다" },
];
const LIKERT = ["전혀 아니다", "아닌 편", "보통", "그런 편", "매우 그렇다"];
const TRAITS = {
  E: { name: "외향성", en: "Extraversion", lo: "내향", hi: "외향",
    d: { hi: "사람들 속에서 에너지를 얻고, 모임에서 자연스럽게 중심에 서는 편이에요.",
         mid: "상황에 따라 사교적이기도 하고 혼자만의 시간도 필요한, 양쪽을 오가는 편이에요.",
         lo: "조용히 관찰하고 소수와 깊게 교류하며, 혼자 있을 때 충전되는 편이에요." } },
  A: { name: "친화성", en: "Agreeableness", lo: "독립·직설", hi: "공감·협조",
    d: { hi: "다른 사람의 감정에 민감하게 반응하고 관계의 조화를 중요하게 여겨요.",
         mid: "공감하되 필요하면 선을 긋는, 균형 잡힌 편이에요.",
         lo: "감정보다 논리와 결과를 우선하고, 할 말은 하는 편이에요." } },
  C: { name: "성실성", en: "Conscientiousness", lo: "즉흥·유연", hi: "계획·정돈",
    d: { hi: "정돈과 계획을 좋아하고, 맡은 일을 미루지 않고 처리하는 편이에요.",
         mid: "중요한 일엔 꼼꼼하지만 모든 걸 통제하려 들진 않는 편이에요.",
         lo: "즉흥적이고 유연한 대신, 정리와 마감에는 에너지가 많이 드는 편이에요." } },
  N: { name: "정서 민감도", en: "Neuroticism", lo: "안정", hi: "민감",
    d: { hi: "감정의 파도가 크고 걱정과 스트레스를 강하게 느끼는 편이에요. 그만큼 위험 신호를 빨리 알아채요.",
         mid: "대체로 안정적이지만 압박이 쌓이면 흔들리는 편이에요.",
         lo: "웬만한 일에는 흔들리지 않는 정서적 안정형이에요." } },
  O: { name: "개방성", en: "Openness", lo: "실용·현실", hi: "상상·탐구",
    d: { hi: "상상력이 풍부하고 추상적인 아이디어와 새로운 개념을 즐겨요.",
         mid: "현실 감각과 호기심이 적당히 섞인 편이에요.",
         lo: "구체적이고 실용적인 것을 선호하고, 검증된 방식을 신뢰해요." } },
};
const TRAIT_ORDER = ["O", "C", "E", "A", "N"];

const VALUES = [
  { id: "self", name: "자기주도", d: "내 생각대로 선택하고 만들어 가는 것" },
  { id: "stim", name: "자극", d: "새로움, 도전, 변화" },
  { id: "hedon", name: "즐거움", d: "삶을 즐기고 누리는 것" },
  { id: "achieve", name: "성취", d: "능력을 발휘하고 인정받는 것" },
  { id: "power", name: "영향력", d: "지위, 결정권, 자원에 대한 통제" },
  { id: "security", name: "안정", d: "안전, 예측 가능함, 질서" },
  { id: "conform", name: "조화", d: "규범과 기대에 맞추고 갈등을 피하는 것" },
  { id: "trad", name: "전통", d: "관습과 뿌리를 존중하는 것" },
  { id: "benev", name: "배려", d: "가까운 사람들을 돌보는 것" },
  { id: "univ", name: "공정", d: "모두를 위한 정의, 공정, 환경" },
];
const VAL_BY = Object.fromEntries(VALUES.map((v) => [v.id, v]));
const DILEMMAS = [
  { q: "승진이 걸린 프로젝트 마감 주간에 아이 학교 행사가 겹쳤다.", a: ["achieve", "프로젝트에 집중하고 행사는 다음을 기약한다"], b: ["benev", "반차를 내고 행사에 간다"] },
  { q: "앞으로 10년, 둘 중 하나를 고른다면?", a: ["security", "지금 회사에서 정년까지 안정적으로"], b: ["self", "5년 안에 나만의 일을 시작"] },
  { q: "일주일 휴가가 생겼다.", a: ["stim", "처음 가보는 낯선 나라로 자유여행"], b: ["security", "익숙하고 편한 단골 휴양지"] },
  { q: "토요일 하루가 온전히 비었다.", a: ["hedon", "맛있는 걸 먹고 푹 쉰다"], b: ["achieve", "미뤄둔 공부나 프로젝트 진도를 뺀다"] },
  { q: "새 조직에서 역할을 고를 수 있다.", a: ["power", "의사결정 권한이 큰 자리"], b: ["univ", "권한은 없지만 모두에게 공정한 규칙을 만드는 역할"] },
  { q: "회의에서 다수 의견이 내 판단과 다르다.", a: ["conform", "분위기를 보고 다수에 맞춘다"], b: ["self", "끝까지 내 의견을 설득한다"] },
  { q: "올해 명절은?", a: ["trad", "늘 하던 대로 가족이 모여 차례를 지낸다"], b: ["stim", "올해는 새로운 방식으로 보내 본다"] },
  { q: "여윳돈 100만 원을 기부한다면?", a: ["benev", "형편이 어려운 가까운 지인을 돕는다"], b: ["univ", "잘 모르는 사회적 약자를 돕는 단체에 낸다"] },
  { q: "이직 제안이 두 곳에서 왔다.", a: ["power", "연봉과 직급이 크게 오르지만 성과 압박이 센 자리"], b: ["security", "조금 덜 받아도 오래 다닐 수 있는 자리"] },
  { q: "내가 정말 하고 싶은 일이 가족에게 불편을 준다.", a: ["self", "가족을 설득해서라도 한다"], b: ["benev", "가족을 위해 당분간 미룬다"] },
  { q: "회식 2차, 윗사람이 같이 가자고 한다.", a: ["hedon", "적당히 인사하고 빠져서 내 시간을 갖는다"], b: ["conform", "분위기상 끝까지 함께한다"] },
  { q: "커리어의 다음 5년을 설계한다.", a: ["stim", "전혀 새로운 분야를 처음부터 배운다"], b: ["achieve", "지금 잘하는 분야에서 최고가 된다"] },
  { q: "집안의 중요한 결정을 내려야 한다.", a: ["trad", "어른들의 방식과 관례를 따른다"], b: ["power", "내가 주도해서 정하고 책임진다"] },
  { q: "귀한 주말 반나절.", a: ["hedon", "온전히 나를 위해 쉰다"], b: ["univ", "지역 봉사활동에 참여한다"] },
];

const ACTS = [
  { id: "deep", t: "혼자 파고드는 분석·문제 해결" },
  { id: "plan", t: "일정·계획 짜기 (공정표, 여행 계획)" },
  { id: "coord", t: "여러 부서와 조율하는 회의" },
  { id: "eng", t: "영어로 외국인과 회의·통화" },
  { id: "mail", t: "쏟아지는 메일·메신저 처리" },
  { id: "present", t: "사람들 앞에서 발표·보고" },
  { id: "teach", t: "후배 가르치기·코칭" },
  { id: "idea", t: "아이디어 떠올리고 적기" },
  { id: "make", t: "손으로 만들기 (조립·프라모델·DIY)" },
  { id: "gear", t: "전자기기 구경하고 세팅하기" },
  { id: "organize", t: "정리 시스템 만들기 (집·파일)" },
  { id: "learn", t: "새로운 기술 배우기 (코딩 등)" },
  { id: "kids", t: "아이들과 놀기" },
  { id: "family", t: "가족과 외출·여행" },
  { id: "drink", t: "술자리·회식" },
  { id: "shorts", t: "쇼츠·SNS 넘기기" },
  { id: "longform", t: "좋은 작품·지식 영상에 몰입해서 보기" },
  { id: "sport", t: "운동 (농구 등)" },
  { id: "cook", t: "요리하기" },
  { id: "photo", t: "사진 찍기" },
];
const CHRONO = [
  { id: "wake", q: "출근 걱정이 없다면 몇 시에 일어나고 싶나요?", o: [["5시대", 5], ["6시대", 4], ["7시대", 3], ["8시대", 2], ["9시 이후", 1]] },
  { id: "peak", q: "머리가 가장 맑은 때는?", o: [["이른 아침", 5], ["오전", 4], ["오후", 3], ["저녁", 2], ["밤", 1]] },
  { id: "sleep", q: "다음 날 일정이 없다면 몇 시에 자고 싶나요?", o: [["22시 전", 5], ["22~23시", 4], ["23~24시", 3], ["0~1시", 2], ["1시 이후", 1]] },
];
const DISC_PAIRS = [
  { a: ["D", "결론부터 빠르게 말하고 주도하는 편이다"], b: ["I", "사람들과 분위기를 맞추며 이야기하는 편이다"] },
  { a: ["D", "위험을 감수하고서라도 빠르게 결정한다"], b: ["S", "지금 방식을 안정적으로 유지하는 게 좋다"] },
  { a: ["D", "일단 밀어붙이고 본다"], b: ["C", "근거와 데이터를 먼저 확인한다"] },
  { a: ["I", "사람들과의 관계에서 에너지를 얻는다"], b: ["S", "튀지 않고 갈등 없이 지내는 게 편하다"] },
  { a: ["I", "말을 재미있게 하는 편이다"], b: ["C", "세부사항을 꼼꼼히 따지는 편이다"] },
  { a: ["S", "계획이 갑자기 바뀌는 걸 좋아하지 않는다"], b: ["C", "정확성과 검증을 중요하게 여긴다"] },
  { a: ["D", "직설적으로 말하는 편이다"], b: ["I", "분위기 봐 가며 말을 고르는 편이다"] },
  { a: ["S", "묵묵히 맡은 일을 끝까지 하는 편이다"], b: ["C", "분석하고 검증한 뒤에야 확신한다"] },
];
const DISC = {
  D: { name: "주도형", d: "결과와 속도를 중시하고, 결정을 앞당기며 도전을 즐겨요." },
  I: { name: "사교형", d: "사람과 분위기를 움직이고, 표현하고 설득하는 데서 힘을 얻어요." },
  S: { name: "안정형", d: "조화와 꾸준함을 중시하고, 믿을 수 있는 버팀목 역할을 해요." },
  C: { name: "신중형", d: "정확성과 품질을 중시하고, 근거를 확인한 뒤 움직여요." },
};

const LOVE_CATS = [
  { id: "food", name: "음식", d: "맛, 요리, 단골집", subs: ["국물·국밥", "찌개·전골", "구이·고기", "해산물", "면 요리", "한식 반찬", "분식", "양식", "중식", "일식", "디저트·간식", "술·안주"] },
  { id: "content", name: "콘텐츠", d: "영상, 웹툰, 책", subs: ["영화", "드라마·미드", "웹툰", "유튜브 롱폼", "쇼츠·릴스", "책", "다큐·지식", "예능", "게임"] },
  { id: "sound", name: "음악·소리", d: "장르, 노래, 오디오", subs: ["발라드", "인디·싱어송", "록", "힙합", "클래식·피아노", "OST", "노래 부르기", "악기 연주", "오디오 기기"] },
  { id: "gear", name: "기기·물건", d: "갖고 싶고 만지고 싶은 것", subs: ["스마트폰", "컴퓨터·노트북", "오디오", "시계", "프라모델·피규어", "문구·만년필", "카메라", "자동차 용품", "스마트홈"] },
  { id: "play", name: "활동·놀이", d: "몸과 손으로 하는 것", subs: ["운동·구기", "캠핑", "여행", "사진", "만들기·조립", "요리", "정리·인테리어", "산책", "낚시"] },
  { id: "place", name: "공간·장소", d: "머물고 싶은 곳", subs: ["바다", "산·숲", "도시", "조용한 나만의 공간", "카페", "한옥·시골", "홈시어터 방", "해외 소도시"] },
  { id: "vibe", name: "사람·분위기", d: "함께 있고 싶은 방식", subs: ["떠들썩한 모임", "소수의 깊은 대화", "가족과의 시간", "혼자만의 시간", "새로운 사람", "웃긴 사람", "지적인 대화"] },
];
const THOUGHT_GROUPS = [
  { id: "money", name: "돈·일·미래", d: "돈, 일, 은퇴, 투자" },
  { id: "people", name: "사람·가족", d: "관계, 아이, 행복" },
  { id: "make", name: "배움·취미·만들기", d: "취미, 배움, 표현" },
  { id: "space", name: "공간·기기", d: "집, 차, 기기" },
  { id: "rest", name: "건강·여유·기타", d: "몸, 시간, 사고방식" },
];
const TH_STATUS = [["heavy", "여전히 무겁다"], ["changed", "생각이 바뀌었다"], ["dropped", "내려놓았다"]];
const WANT_TYPES = [
  { id: "have", name: "갖고 싶은 것", en: "HAVE", d: "물건, 공간, 자산" },
  { id: "do", name: "해보고 싶은 것", en: "DO", d: "경험, 프로젝트, 도전" },
  { id: "be", name: "되고 싶은 모습", en: "BE", d: "어떤 사람으로 살고 싶은가" },
  { id: "learn", name: "배우고 싶은 것", en: "LEARN", d: "기술, 지식, 언어" },
  { id: "give", name: "나누고 싶은 것", en: "GIVE", d: "사람과 세상에 돌려줄 것" },
];
const WT_BY = Object.fromEntries(WANT_TYPES.map((w) => [w.id, w]));
const HORIZONS = [["1y", "1년 안", 1], ["3y", "3년", 3], ["5y", "5년", 5], ["10y", "10년+", 10], ["someday", "언젠가", null]];
const HZ_BY = Object.fromEntries(HORIZONS.map((h) => [h[0], h]));
const W_STATUS = [["idea", "생각만"], ["plan", "계획"], ["doing", "진행 중"], ["done", "이룸"]];
const WS_BY = Object.fromEntries(W_STATUS);
const LANES = [
  { id: "me", name: "나", code: "1.0" },
  { id: "family", name: "가족", code: "2.0" },
  { id: "work", name: "일", code: "3.0" },
  { id: "home", name: "거주", code: "4.0" },
  { id: "plan", name: "원하는 것", code: "5.0" },
];
const LANE_BY = Object.fromEntries(LANES.map((l) => [l.id, l]));
const REC_TYPES = [
  { id: "diary", name: "일기", color: "var(--ink-3)" },
  { id: "thought", name: "생각", color: "var(--c-values)" },
  { id: "idea", name: "아이디어", color: "var(--c-thoughts)" },
  { id: "pain", name: "불편", color: "var(--c-loves)" },
  { id: "thanks", name: "감사", color: "var(--c-energy)" },
];
const RT_BY = Object.fromEntries(REC_TYPES.map((r) => [r.id, r]));
const AREAS = {
  basics: "기본", wheel: "지금의 나", traits: "성격", values: "가치", energy: "에너지", work: "일",
  family: "가족", loves: "취향", thoughts: "마음속 주제", wants: "원하는 것", timeline: "연대기",
};
/* identity hues for the map / legends — fixed order, never cycled */
const DOMAINS = [
  { id: "values", name: "가치", color: "var(--c-values)" },
  { id: "loves", name: "취향", color: "var(--c-loves)" },
  { id: "energy", name: "에너지·일", color: "var(--c-energy)" },
  { id: "thoughts", name: "마음속 주제", color: "var(--c-thoughts)" },
  { id: "wants", name: "원하는 것", color: "var(--c-wants)" },
  { id: "life", name: "삶·관계", color: "var(--c-life)" },
  { id: "traits", name: "성격", color: "var(--c-traits)" },
];
const DOM_BY = Object.fromEntries(DOMAINS.map((d) => [d.id, d]));
const AREA_DOMAIN = { basics: "life", wheel: "life", family: "life", timeline: "life", traits: "traits", values: "values", energy: "energy", work: "energy", loves: "loves", thoughts: "thoughts", wants: "wants" };

/* ============================================================ state, scoring, persistence */
const S = {
  mode: "boot", uid: null, isOwner: false, db: null, sample: null, user: null,
  P: null,
  AI: { portrait: null, map: null, insights: {} },
  CHAT: { turns: [], topic: "auto" },
  LOG: { items: [] },
  ui: {
    view: "home", ch: null, step: 0,
    lovesCat: null, thGroup: null, thItem: null, wantType: null,
    logFilter: "all", logQ: "", mapSel: null, mapHide: {}, ganttRange: "all", editEvent: null,
    busy: {},
  },
  saveState: "idle",
};

function blankProfile() {
  return {
    v: 3, rev: 0, revLog: [], createdAt: nowISO(), updatedAt: nowISO(),
    basics: { name: "", nick: "", birthYear: null, birthEst: false, region: "", family: "", job: "", career: "", intro: "", confirmed: false },
    wheel: { areas: {} }, wheelHist: [],
    ipip: { answers: {} },
    values: { picks: {} },
    energy: { acts: {}, flowRecent: "", flowChild: "", flowLast: "", chrono: {}, disc: {} },
    loves: { cats: {}, seen: {} },
    thoughts: { items: [] },
    wants: { items: [] },
    timeline: { events: [] },
    facts: [], hints: {}, prior: {}, progressLog: [], done: {}, chapterAt: {},
  };
}
function ensureShape(P) {
  const b = blankProfile();
  for (const k in b) if (P[k] == null) P[k] = b[k];
  for (const k of ["basics", "wheel", "ipip", "values", "energy", "loves", "thoughts", "wants", "timeline"]) {
    for (const kk in b[k]) if (P[k][kk] == null) P[k][kk] = b[k][kk];
  }
  if (!P.done) P.done = {};
  if (!P.loves.seen) P.loves.seen = {};
  LOVE_CATS.forEach((c) => { if (!P.loves.cats[c.id]) P.loves.cats[c.id] = { subs: [], items: [] }; });
  return P;
}

/* ---------------- scoring ---------------- */
function ipipScores(P) {
  const out = {};
  for (const t of TRAIT_ORDER) {
    const its = IPIP.filter((x) => x.t === t);
    const vals = its.map((x) => { const v = P.ipip.answers[x.n]; return v == null ? null : x.k > 0 ? v : 6 - v; }).filter((v) => v != null);
    out[t] = { n: vals.length, score: vals.length ? avg(vals) : null };
  }
  return out;
}
const lvl = (s) => (s == null ? null : s >= 3.6 ? "hi" : s <= 2.6 ? "lo" : "mid");
const LVL_KO = { hi: "높음", mid: "중간", lo: "낮음" };

function valueScores(P) {
  const m = {};
  VALUES.forEach((v) => (m[v.id] = { id: v.id, wins: 0, n: 0 }));
  DILEMMAS.forEach((d, i) => {
    const p = P.values.picks[i];
    if (!p) return;
    m[d.a[0]].n++; m[d.b[0]].n++;
    m[p === "a" ? d.a[0] : d.b[0]].wins++;
  });
  return Object.values(m).map((r) => ({ ...r, score: r.n ? r.wins / r.n : null }))
    .sort((x, y) => (y.score ?? -1) - (x.score ?? -1) || y.wins - x.wins);
}
function discTally(P) {
  const t = { D: 0, I: 0, S: 0, C: 0 }; let n = 0;
  DISC_PAIRS.forEach((p, i) => { const v = P.energy.disc[i]; if (v === "a") { t[p.a[0]]++; n++; } else if (v === "b") { t[p.b[0]]++; n++; } });
  const x = n ? ((t.D + t.I) - (t.S + t.C)) / n : 0;
  const y = n ? ((t.D + t.C) - (t.I + t.S)) / n : 0;
  const top = n ? Object.entries(t).sort((a, b) => b[1] - a[1]).filter((e, i, arr) => e[1] === arr[0][1]).map((e) => e[0]) : [];
  return { t, n, x, y, top };
}
function chrono(P) {
  const c = P.energy.chrono || {}; const vals = CHRONO.map((q) => c[q.id]).filter((v) => v != null);
  if (!vals.length) return null;
  const s = sum(vals) / vals.length;
  return { s, n: vals.length, label: s >= 3.8 ? "아침형" : s <= 2.4 ? "저녁형" : "중간형" };
}
function wheelStats(P) {
  return WHEEL.map((w) => {
    const a = P.wheel.areas[w.id] || {};
    const sat = a.sat ?? null, imp = a.imp ?? null;
    const gap = sat != null && imp != null ? imp * 2 - sat : null;
    return { ...w, sat, imp, gap, note: a.note || "" };
  });
}
function energyLists(P) {
  const r = { c: [], n: [], d: [] };
  ACTS.forEach((a) => { const v = P.energy.acts[a.id]; if (v) r[v].push(a); });
  return r;
}
function allLoveItems(P) {
  const out = [];
  LOVE_CATS.forEach((c) => (P.loves.cats[c.id]?.items || []).forEach((it) => out.push({ ...it, cat: c.id })));
  return out;
}

/* ---------------- progress ---------------- */
function chProgress(P, id) {
  switch (id) {
    case "basics": { const b = P.basics; const f = ["name", "birthYear", "region", "family", "job"].filter((k) => b[k]).length; return Math.round((f / 5) * 80 + (b.confirmed ? 20 : 0)); }
    case "wheel": return Math.round((WHEEL.filter((w) => { const a = P.wheel.areas[w.id]; return a && a.sat != null && a.imp != null; }).length / WHEEL.length) * 100);
    case "ipip": return Math.round((Object.keys(P.ipip.answers).length / IPIP.length) * 100);
    case "values": return Math.round((Object.keys(P.values.picks).length / DILEMMAS.length) * 100);
    case "energy": {
      const e = P.energy;
      const a = Object.keys(e.acts).length / ACTS.length;
      const f = (e.flowRecent || e.flowLast ? 0.5 : 0) + (e.flowChild ? 0.5 : 0);
      const c = Object.keys(e.chrono || {}).length / CHRONO.length;
      const d = Object.keys(e.disc).length / DISC_PAIRS.length;
      return Math.round((a * 0.45 + f * 0.15 + c * 0.15 + d * 0.25) * 100);
    }
    case "loves": {
      const withItems = LOVE_CATS.filter((c) => (P.loves.cats[c.id]?.items || []).length).length;
      const seen = LOVE_CATS.filter((c) => P.loves.seen[c.id]).length;
      return Math.round((withItems / 7) * 60 + (seen / 7) * 40);
    }
    case "thoughts": { const it = P.thoughts.items; return it.length ? Math.round((it.filter((x) => x.status).length / it.length) * 100) : 0; }
    case "wants": { const it = P.wants.items; return it.length ? Math.round((it.filter((x) => x.rv).length / it.length) * 100) : 0; }
    case "timeline": { const ev = P.timeline.events; return ev.length ? Math.round((ev.filter((x) => !x.est && x.s).length / ev.length) * 100) : 0; }
  }
  return 0;
}
function chState(P, id) { if (P.done[id]) return "done"; return chProgress(P, id) > 0 ? "doing" : "todo"; }
function overall(P) {
  const base = avg(CH.map((c) => (P.done[c.id] ? 100 : chProgress(P, c.id) * 0.9)));
  const ivFacts = P.facts.filter((f) => f.src === "interview").length;
  const extra = (S.AI.portrait ? 5 : 0) + (S.AI.map ? 3 : 0) + Math.min(7, ivFacts);
  return Math.round(base * 0.85 + extra);
}
function nextAction(P) {
  const ch = CH.find((c) => !P.done[c.id]);
  if (ch) {
    const st = chState(P, ch.id);
    return { kind: "ch", ch, label: (st === "doing" ? "이어서 하기 · " : "시작하기 · ") + "CH." + ch.code + " " + ch.name, desc: ch.title, href: "#journey/" + ch.id };
  }
  if (!S.AI.portrait) return { kind: "portrait", label: "자기 초상 그리기", desc: "여정을 모두 마쳤어요. Claude가 한 장의 초상으로 정리합니다.", href: "#portrait" };
  return { kind: "interview", label: "시운전 · AI 인터뷰", desc: "빈 곳을 대화로 채워 초상을 더 선명하게 만들어요.", href: "#interview" };
}
function bumpRev(note) {
  const P = S.P; P.rev = (P.rev || 0) + 1;
  P.revLog.push({ rev: P.rev, at: nowISO(), note });
  if (P.revLog.length > 60) P.revLog = P.revLog.slice(-60);
}
const revStr = () => "REV." + pad2(S.P?.rev || 0);

/* ---------------- persistence ---------------- */
const DOCS = { profile: () => S.P, ai: () => S.AI, chat: () => S.CHAT, log: () => S.LOG };
const dirty = new Set();
let writing = Promise.resolve();
function docPath(name) { return "data/users/" + S.uid + "/" + name; }
function markDirty(...names) {
  names.forEach((n) => dirty.add(n));
  if (S.P) S.P.updatedAt = nowISO();
  trackProgress();
  flushSoon();
}
const flushSoon = debounce(flush, 900);
function setSave(st) { S.saveState = st; $$(".save-state").forEach((el) => { el.className = "save-state " + st; const t = el.querySelector("span"); if (t) t.textContent = { idle: "저장됨", saving: "저장 중", off: "저장 안 됨(미리보기)", err: "저장 실패" }[st] || st; }); }
function flush() {
  if (S.mode !== "cloud" || !S.db || !S.uid) { dirty.clear(); return; }
  const names = Array.from(dirty); dirty.clear();
  if (!names.length) return;
  setSave("saving");
  writing = writing.then(async () => {
    for (const n of names) {
      try { await S.db.doc(docPath(n)).set(clone(DOCS[n]())); }
      catch (e) {
        if (e && e.code === "unavailable") { try { await new Promise((r) => setTimeout(r, 800 + Math.random() * 600)); await S.db.doc(docPath(n)).set(clone(DOCS[n]())); continue; } catch (e2) { e = e2; } }
        setSave("err"); toast("저장하지 못했어요 (" + ((e && e.code) || "오류") + "). 잠시 후 다시 시도해 주세요.");
        dirty.add(n); return;
      }
    }
    setSave("idle");
  });
}
window.addEventListener("beforeunload", () => { if (dirty.size) flush(); });
function trackProgress() {
  const P = S.P; if (!P) return;
  const d = localDate(); const p = overall(P);
  const last = P.progressLog[P.progressLog.length - 1];
  if (last && last.d === d) last.p = p; else P.progressLog.push({ d, p });
  if (P.progressLog.length > 400) P.progressLog = P.progressLog.slice(-400);
}

async function withTimeout(p, ms, fallback) {
  let t; const timer = new Promise((r) => { t = setTimeout(() => r(fallback), ms); });
  const v = await Promise.race([p, timer]); clearTimeout(t); return v;
}
async function boot() {
  const c = window.claude;
  if (!c || typeof c.use !== "function") {
    S.mode = "local"; S.P = ensureShape(blankProfile());
    return;
  }
  const [db, user, sample] = await Promise.all([
    withTimeout(c.use("db").catch(() => null), 12000, null),
    withTimeout(c.use("user").catch(() => null), 12000, null),
    withTimeout(c.use("sample").catch(() => null), 12000, null),
  ]);
  S.db = db; S.user = user; S.sample = sample;
  if (user) {
    try { S.uid = await user.id(); } catch (e) { S.uid = null; }
    try { S.isOwner = await user.isOwner(); } catch (e) { S.isOwner = false; }
  }
  if (!db || !S.uid) { S.mode = db ? "noid" : "local"; S.P = ensureShape(blankProfile()); return; }
  S.mode = "cloud";
  try {
    const [p, ai, chat, log] = await Promise.all(["profile", "ai", "chat", "log"].map((n) => db.doc(docPath(n)).get()));
    const blankish = (d) => !d || (!(d.basics && d.basics.name) && !(d.facts || []).length && !(d.rev) && !((d.thoughts && d.thoughts.items) || []).length && !Object.keys((d.ipip && d.ipip.answers) || {}).length);
    if (p.exists && !(S.isOwner && blankish(p.data()) && !(log.exists && (log.data().items || []).length))) {
      S.P = ensureShape(p.data());
      if (ai.exists) S.AI = Object.assign({ portrait: null, map: null, insights: {} }, ai.data());
      if (chat.exists) S.CHAT = Object.assign({ turns: [], topic: "auto" }, chat.data());
      if (log.exists) S.LOG = Object.assign({ items: [] }, log.data());
    } else {
      let seeded = false;
      if (S.isOwner) {
        try {
          const sd = await db.doc("seed/owner").get();
          if (sd.exists) { const d = sd.data(); S.P = ensureShape(clone(d.profile)); S.LOG = clone(d.log || { items: [] }); seeded = true; }
        } catch (e) { /* no seed */ }
      }
      if (!seeded) S.P = ensureShape(blankProfile());
      S.P.createdAt = nowISO();
      trackProgress();
      markDirty("profile", "log", "ai", "chat");
      S.firstRun = true; S.seeded = seeded;
    }
  } catch (e) {
    S.mode = "noid"; S.P = ensureShape(blankProfile());
    S.bootErr = (e && e.code) || "load";
  }
}

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
    empty_completion: "빈 답이 돌아왔어요. 다시 시도해 주세요.",
    cancelled: "중단했어요.",
  })[c] || "연결이 불안정해 답을 받지 못했어요. 다시 시도해 주세요.";
}
const PERMANENT = new Set(["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"]);
function aiAvailable() { return !!S.sample && !S.aiOff; }
async function aiJSON(prompt, opts) {
  if (!aiAvailable()) throw { code: "capability_disabled" };
  try { return await S.sample.json(prompt, Object.assign({ modelTier: "default" }, opts || {})); }
  catch (e) { if (e && PERMANENT.has(e.code)) S.aiOff = e.code; throw e; }
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
    '응답은 반드시 JSON 하나: {"reply": "사용자에게 할 말(마지막은 질문 하나)", "facts": [{"area": "basics|wheel|traits|values|energy|work|family|loves|thoughts|wants|timeline", "text": "사용자가 이번 메시지에서 직접 말한 사실, 3인칭 한 문장"}], "wants": [{"type": "have|do|be|learn|give", "text": "...", "horizon": "1y|3y|5y|10y|someday"}], "events": [{"year": "YYYY 또는 YYYY-MM", "label": "...", "lane": "me|family|work|home"}]}\n' +
    "- facts, wants, events는 사용자가 이번 메시지에서 실제로 말한 것만. 추측 금지. 없으면 빈 배열. 이미 알려진 사실과 같은 내용은 넣지 않는다.\n\n" +
    "[이번 인터뷰 초점] " + focus + "\n\n[프로필 요약]\n" + digest(P, { facts: 50, log: 6 });
}
/* opening=true: ask the first question. Otherwise the caller has already appended the user's turn to S.CHAT.turns. */
async function aiInterviewTurn(opening) {
  const P = S.P;
  const rules = interviewRules(P, S.CHAT.topic || "auto");
  let input;
  if (opening) input = [{ role: "user", content: rules + "\n\n인터뷰를 시작합니다. 짧게 인사하고, 초점에 맞는 첫 질문을 해 주세요." }];
  else {
    let hist = S.CHAT.turns.slice(-24).map((t) => ({ role: t.role, content: String(t.content) }));
    while (hist.length && hist[hist.length - 1].role !== "user") hist.pop();
    input = [{ role: "user", content: rules + "\n\n(여기까지가 지침입니다. 이어지는 것이 실제 대화입니다.)" }].concat(hist);
  }
  const r = await aiJSON(input, { cache: false });
  if (!r || !r.reply) throw { code: "invalid_json" };
  return r;
}

/* ============================================================ SVG chart helpers (themed via inline style + CSS vars) */
const st = (o) => 'style="' + Object.entries(o).map(([k, v]) => k + ":" + v).join(";") + '"';

/* radar: axes=[{label}], series=[{name,color,vals:[0..max|null]}] */
function radarSVG(axes, series, o) {
  o = Object.assign({ size: 320, max: 10, rings: [0.25, 0.5, 0.75, 1], labels: true, pad: 58 }, o || {});
  const W = o.size, cx = W / 2, cy = W / 2, R = W / 2 - o.pad, n = axes.length;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i, f) => [cx + Math.cos(ang(i)) * R * f, cy + Math.sin(ang(i)) * R * f];
  let g = "";
  o.rings.forEach((f) => { g += '<polygon points="' + axes.map((_, i) => pt(i, f).map((v) => v.toFixed(1)).join(",")).join(" ") + '" ' + st({ fill: "none", stroke: "var(--rule)", "stroke-width": "1" }) + "/>"; });
  axes.forEach((_, i) => { const [x, y] = pt(i, 1); g += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" ' + st({ stroke: "var(--rule)", "stroke-width": "1" }) + "/>"; });
  series.forEach((s) => {
    const pts = s.vals.map((v, i) => pt(i, clamp((v ?? 0) / o.max, 0, 1)));
    g += '<polygon points="' + pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ") + '" ' + st({ fill: s.color, "fill-opacity": ".10", stroke: s.color, "stroke-width": "2", "stroke-linejoin": "round" }) + "/>";
    pts.forEach((p, i) => {
      const has = s.vals[i] != null;
      g += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (o.dot || 4) + '" ' + st({ fill: has ? s.color : "var(--sheet)", stroke: has ? "var(--sheet)" : s.color, "stroke-width": "2" }) + "><title>" + esc(axes[i].label + " · " + s.name + " " + (has ? s.vals[i] : "미응답")) + "</title></circle>";
    });
  });
  if (o.labels) axes.forEach((a, i) => {
    const [x, y] = pt(i, 1); const dx = Math.cos(ang(i)), dy = Math.sin(ang(i));
    const tx = x + dx * 20, ty = y + dy * 18 + 4;
    const anchor = Math.abs(dx) < 0.25 ? "middle" : dx > 0 ? "start" : "end";
    g += '<text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" text-anchor="' + anchor + '" ' + st({ fill: "var(--ink-2)", "font-size": (o.fs || 12) + "px", "font-weight": "600" }) + ">" + esc(a.label) + "</text>";
    if (a.sub) g += '<text x="' + tx.toFixed(1) + '" y="' + (ty + 14).toFixed(1) + '" text-anchor="' + anchor + '" class="tick">' + esc(a.sub) + "</text>";
  });
  return '<svg viewBox="0 0 ' + W + " " + W + '" width="100%" style="max-width:' + W + 'px;display:block;margin:0 auto" role="img" aria-label="' + esc(o.aria || "레이더 차트") + '">' + g + "</svg>";
}

/* line (single series over time). pts=[{t:Date|num, y}] */
function lineSVG(pts, o) {
  o = Object.assign({ w: 560, h: 170, ymax: 100, color: "var(--accent)", yTicks: [0, 50, 100], suffix: "%" }, o || {});
  const L = 34, Rr = 44, T = 12, B = 24, W = o.w, H = o.h;
  if (!pts.length) return "";
  const xs = pts.map((p) => +p.t); let x0 = Math.min(...xs), x1 = Math.max(...xs);
  if (x1 === x0) { x0 -= 86400000 * 3; x1 += 86400000 * 3; }
  const X = (t) => L + ((+t - x0) / (x1 - x0)) * (W - L - Rr), Y = (v) => T + (1 - v / o.ymax) * (H - T - B);
  let g = "";
  o.yTicks.forEach((v) => { g += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" ' + st({ stroke: "var(--rule-2)", "stroke-width": "1" }) + '/><text x="' + (L - 6) + '" y="' + (Y(v) + 3) + '" text-anchor="end" class="tick">' + v + "</text>"; });
  const d = pts.map((p, i) => (i ? "L" : "M") + X(p.t).toFixed(1) + " " + Y(p.y).toFixed(1)).join(" ");
  g += '<path d="' + d + " L" + X(pts[pts.length - 1].t).toFixed(1) + " " + Y(0) + " L" + X(pts[0].t).toFixed(1) + " " + Y(0) + ' Z" ' + st({ fill: o.color, "fill-opacity": ".10" }) + "/>";
  g += '<path d="' + d + '" ' + st({ fill: "none", stroke: o.color, "stroke-width": "2", "stroke-linejoin": "round", "stroke-linecap": "round" }) + "/>";
  const last = pts[pts.length - 1];
  g += '<circle cx="' + X(last.t) + '" cy="' + Y(last.y) + '" r="4.5" ' + st({ fill: o.color, stroke: "var(--sheet)", "stroke-width": "2" }) + "/>";
  g += '<text x="' + (X(last.t) + 8) + '" y="' + (Y(last.y) + 4) + '" ' + st({ fill: "var(--ink)", "font-size": "12px", "font-weight": "600" }) + ">" + last.y + o.suffix + "</text>";
  const fd = (t) => { const dd = new Date(t); return dd.getMonth() + 1 + "." + dd.getDate(); };
  g += '<text x="' + L + '" y="' + (H - 6) + '" class="tick">' + fd(x0) + '</text><text x="' + (W - Rr) + '" y="' + (H - 6) + '" text-anchor="end" class="tick">' + fd(x1) + "</text>";
  pts.forEach((p) => { g += '<circle cx="' + X(p.t) + '" cy="' + Y(p.y) + '" r="10" fill="transparent"><title>' + esc(fd(p.t) + " · " + p.y + o.suffix) + "</title></circle>"; });
  return '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" role="img" aria-label="' + esc(o.aria || "추이") + '">' + g + "</svg>";
}

/* DISC quadrant */
function quadSVG(dt, size) {
  size = size || 260; const p = 30, R = (size - p * 2) / 2, c = size / 2;
  let g = '<rect x="' + p + '" y="' + p + '" width="' + (size - 2 * p) + '" height="' + (size - 2 * p) + '" ' + st({ fill: "var(--sheet-2)", stroke: "var(--rule)" }) + "/>";
  g += '<line x1="' + c + '" y1="' + p + '" x2="' + c + '" y2="' + (size - p) + '" ' + st({ stroke: "var(--rule)" }) + '/><line x1="' + p + '" y1="' + c + '" x2="' + (size - p) + '" y2="' + c + '" ' + st({ stroke: "var(--rule)" }) + "/>";
  const q = [["C", "신중형", p + 8, p + 18, "start"], ["D", "주도형", size - p - 8, p + 18, "end"], ["S", "안정형", p + 8, size - p - 10, "start"], ["I", "사교형", size - p - 8, size - p - 10, "end"]];
  q.forEach(([k, n, x, y, a]) => { const on = dt.top.includes(k); g += '<text x="' + x + '" y="' + y + '" text-anchor="' + a + '" ' + st({ fill: on ? "var(--ink)" : "var(--ink-3)", "font-size": "11.5px", "font-weight": on ? "700" : "500" }) + ">" + k + " " + n + (dt.n ? " " + dt.t[k] : "") + "</text>"; });
  g += '<text x="' + c + '" y="' + (p - 10) + '" text-anchor="middle" class="tick">과제 중심</text><text x="' + c + '" y="' + (size - p + 18) + '" text-anchor="middle" class="tick">사람 중심</text>';
  g += '<text x="' + (p - 4) + '" y="' + (c + 3) + '" text-anchor="end" class="tick">신중</text>';
  g += '<text x="' + (size - p + 4) + '" y="' + (c + 3) + '" text-anchor="start" class="tick">속도</text>';
  if (dt.n) {
    const x = c + dt.x * R * 0.92, y = c - dt.y * R * 0.92;
    g += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="14" ' + st({ fill: "var(--c-energy)", "fill-opacity": ".15" }) + "/>";
    g += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="6" ' + st({ fill: "var(--c-energy)", stroke: "var(--sheet)", "stroke-width": "2" }) + "><title>나의 위치 (" + dt.n + "문항)</title></circle>";
  }
  return '<svg viewBox="0 0 ' + size + " " + size + '" width="100%" style="max-width:' + size + 'px;display:block;margin:0 auto" role="img" aria-label="업무 스타일 사분면">' + g + "</svg>";
}

/* trait bars (Big Five) as HTML */
function traitRows(tr, withDesc) {
  return TRAIT_ORDER.map((k) => {
    const T = TRAITS[k], s = tr[k].score, L2 = lvl(s);
    const pct = s == null ? 0 : ((s - 1) / 4) * 100;
    return '<div class="trait"><div class="nm">' + T.name + "<small>" + T.lo + " ↔ " + T.hi + '</small></div><div class="track"><span class="mid"></span><i ' + st({ width: pct + "%", background: "var(--c-traits)", opacity: s == null ? ".25" : "1" }) + '></i></div><div class="v">' + (s == null ? "–" : s.toFixed(1)) + "</div>" +
      (withDesc && s != null ? '<div class="trait-desc"><b>' + LVL_KO[L2] + "</b> · " + T.d[L2] + "</div>" : "") + "</div>";
  }).join("");
}

/* wheel dumbbell (satisfaction vs importance×2), sorted by gap */
function wheelDumbbell(ws) {
  const rows = ws.filter((w) => w.sat != null && w.imp != null).sort((a, b) => b.gap - a.gap);
  if (!rows.length) return '<div class="empty">라이프 휠을 채우면 영역별 차이가 보여요.</div>';
  const W = 560, rowH = 30, L = 70, Rr = 40, T = 22;
  const H = T + rows.length * rowH + 16;
  const X = (v) => L + (v / 10) * (W - L - Rr);
  let g = "";
  [0, 5, 10].forEach((v) => { g += '<line x1="' + X(v) + '" x2="' + X(v) + '" y1="' + (T - 6) + '" y2="' + (H - 12) + '" ' + st({ stroke: "var(--rule-2)" }) + '/><text x="' + X(v) + '" y="' + (T - 10) + '" text-anchor="middle" class="tick">' + v + "</text>"; });
  rows.forEach((w, i) => {
    const y = T + i * rowH + rowH / 2; const a = X(w.sat), b = X(w.imp * 2);
    g += '<text x="' + (L - 10) + '" y="' + (y + 4) + '" text-anchor="end" ' + st({ fill: "var(--ink)", "font-size": "12.5px", "font-weight": i < 3 && w.gap > 0 ? "700" : "500" }) + ">" + esc(w.name) + "</text>";
    g += '<line x1="' + Math.min(a, b) + '" x2="' + Math.max(a, b) + '" y1="' + y + '" y2="' + y + '" ' + st({ stroke: w.gap > 0 ? "var(--signal)" : "var(--ink-4)", "stroke-width": "2", "stroke-opacity": ".55" }) + "/>";
    g += '<circle cx="' + b + '" cy="' + y + '" r="5" ' + st({ fill: "var(--c-loves)", stroke: "var(--sheet)", "stroke-width": "2" }) + "><title>" + esc(w.name + " 중요도 " + w.imp + "/5") + "</title></circle>";
    g += '<circle cx="' + a + '" cy="' + y + '" r="5" ' + st({ fill: "var(--c-values)", stroke: "var(--sheet)", "stroke-width": "2" }) + "><title>" + esc(w.name + " 만족도 " + w.sat + "/10") + "</title></circle>";
    g += '<text x="' + (W - 6) + '" y="' + (y + 4) + '" text-anchor="end" class="tick" ' + st({ fill: w.gap > 0 ? "var(--signal)" : "var(--ink-3)" }) + ">" + (w.gap > 0 ? "+" : "") + w.gap + "</text>";
  });
  return '<div class="legend" style="margin-bottom:6px"><span><i class="dot" style="background:var(--c-values)"></i>만족도(0~10)</span><span><i class="dot" style="background:var(--c-loves)"></i>중요도(×2)</span><span class="muted">오른쪽 숫자 = 중요도×2 − 만족도, 클수록 손볼 곳</span></div>' +
    '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" role="img" aria-label="라이프 휠 만족도와 중요도 비교">' + g + "</svg>";
}

/* value ranking HTML */
function valueRows(vs, topN) {
  const max = 1;
  return '<div class="vrank">' + vs.map((v, i) => '<div class="vrow' + (i < (topN || 3) && v.score != null ? " top" : "") + '"><span class="i">' + pad2(i + 1) + '</span><span class="nm">' + VAL_BY[v.id].name + '</span><span class="b"><i style="width:' + (v.score == null ? 0 : (v.score / max) * 100) + '%"></i></span><span class="v">' + (v.n ? v.wins + "/" + v.n : "–") + "</span></div>").join("") + "</div>";
}

/* compact previews for home cards */
function miniRadar(P) {
  const ws = wheelStats(P);
  if (!ws.some((w) => w.sat != null)) return placeholderSVG("라이프 휠 대기");
  return radarSVG(ws.map((w) => ({ label: w.name })), [{ name: "만족", color: "var(--c-values)", vals: ws.map((w) => w.sat) }], { size: 150, pad: 22, labels: false, dot: 2.5 });
}
function placeholderSVG(t) {
  return '<svg viewBox="0 0 200 120" width="200"><rect x="40" y="20" width="120" height="80" rx="3" ' + st({ fill: "none", stroke: "var(--rule)", "stroke-dasharray": "4 4" }) + '/><text x="100" y="64" text-anchor="middle" class="tick">' + esc(t) + "</text></svg>";
}

/* ============================================================ HOME · 종합 현황판 */
function titleBlock(cells) {
  return '<div class="tblock">' + cells.map(([k, v]) => "<div><b>" + esc(k) + "</b><span>" + v + "</span></div>").join("") + "</div>";
}
function hullNo(P) { return "LD-" + (P.basics.birthYear || "0000"); }

function viewHome() {
  const P = S.P, pct = overall(P), na = nextAction(P);
  const b = P.basics, name = b.nick || b.name || "나";
  const doneN = CH.filter((c) => P.done[c.id]).length;
  const ivFacts = P.facts.filter((f) => f.src === "interview").length;
  const wantDoing = P.wants.items.filter((w) => w.status === "doing").length;
  const pr = S.AI.portrait;

  let banners = "";
  if (S.mode !== "cloud") banners += '<div class="banner" style="margin-bottom:14px"><b>미리보기 모드</b><span>이 화면에서는 저장소에 연결되지 않아 입력한 내용이 저장되지 않아요. Claude 앱에서 열면 저장돼요.</span></div>';
  if (S.firstRun && S.seeded && !P.dismissSeedNote) banners += '<div class="banner info" style="margin-bottom:14px;align-items:center"><span style="flex:1"><b>기존 기록으로 미리 채워 두었어요.</b> 엑셀 메모 18개 시트와 지금까지의 대화에서 좋아하는 것 ' + allLoveItems(P).length + "개, 마음속 주제 " + P.thoughts.items.length + "개, 원하는 것 " + P.wants.items.length + "개, 기록 " + S.LOG.items.length + '건을 옮겼어요. 추정한 연도에는 <span class="tag est">추정</span> 표시가 있어요. 여정을 따라가며 확인하고 고쳐 주세요.</span><button class="btn sm ghost" data-act="dismissSeed">닫기</button></div>';

  // progress trend
  const pl = P.progressLog.map((x) => ({ t: new Date(x.d + "T12:00:00"), y: x.p }));
  const trend = pl.length >= 2 ? lineSVG(pl, { h: 150, aria: "공정률 추이" }) :
    '<div class="empty" style="padding:26px 8px">오늘부터 매일의 공정률이 기록돼요.<br>내일 다시 열면 추이선이 그려집니다.</div>';

  // stage track
  const stagesAll = CH.map((c) => ({ id: c.id, code: c.code, stage: c.stage, name: c.name, st: chState(P, c.id), go: "openCh" }))
    .concat([{ id: "interview", code: "09", stage: "시운전", name: "AI 인터뷰", st: ivFacts >= 5 ? "done" : ivFacts ? "doing" : "todo", go: "interview" },
      { id: "portrait", code: "10", stage: "인도", name: "자기 초상", st: pr ? "done" : "todo", go: "portrait" }]);
  const nextIdx = stagesAll.findIndex((x) => x.st !== "done");
  const doneRun = stagesAll.findIndex((x) => x.st !== "done");
  const fillPct = ((doneRun === -1 ? stagesAll.length - 1 : Math.max(0, doneRun - 0.5)) / (stagesAll.length - 1)) * (100 - 100 / 11);
  const stages = '<div class="stages" role="list">' + '<span class="fill" style="width:' + (doneRun <= 0 ? 0 : fillPct) + '%"></span>' + stagesAll.map((x, i) =>
    '<a role="listitem" href="#" class="stg ' + x.st + (i === nextIdx ? " next" : "") + '" data-act="' + (x.go === "openCh" ? "openCh" : "go") + '" data-id="' + x.id + '" data-view="' + x.go + '"><span class="dia"></span><span class="c">' + x.code + '</span><span class="n">' + esc(x.stage) + '</span><span class="s">' + esc(x.name) + "</span></a>").join("") + "</div>";

  const recent = S.LOG.items.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.at).localeCompare(String(a.at))).slice(0, 5);
  const recFacts = P.facts.slice().sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 5);

  return '<div class="page-head"><div><div class="eyebrow">Dock status · 종합 현황판</div><h1>' + esc(name) + '의 라이프 독</h1><p class="lede">나를 짓고, 점검하고, 고쳐 쓰는 곳. 여정으로 뼈대를 세우고, 인터뷰와 기록으로 계속 보수합니다.</p></div>' +
    titleBlock([["HULL NO.", esc(hullNo(P))], ["OWNER", esc(b.name || "-")], ["REV", revStr()], ["UPDATED", fmtDot(P.updatedAt)], ["CHAPTERS", doneN + "/9"], ["SCALE", "1 : 1"]]) + "</div>" +
    banners +
    '<section class="sheet dock-hero lift"><div class="l">' +
      '<div class="eyebrow">자기 이해 공정률</div>' +
      '<div class="hero-num"><div class="n">' + pct + '<small>%</small></div><div class="cap">9개 챕터 · 시운전 인터뷰 · 초상과 지도를 합친 진척도</div></div>' +
      '<div class="meter"><i style="width:' + pct + '%"></i></div>' +
      (pr ? '<div><div class="eyebrow" style="margin-bottom:4px">현재 초상 ' + '<span class="mono">REV.' + pad2(pr.rev || 0) + '</span></div><div class="archetype">' + esc(pr.archetype) + '</div><div class="archetype-sub">' + esc(pr.headline || "") + "</div></div>"
        : '<div><div class="eyebrow" style="margin-bottom:4px">현재 초상</div><div class="archetype" style="color:var(--ink-3)">아직 그려지지 않았어요</div><div class="archetype-sub">여정을 마치면 Claude가 당신을 한 장의 초상으로 정리합니다.</div></div>') +
      '<div class="next-card"><div><div class="eyebrow" style="color:var(--accent)">다음 작업</div><div class="t">' + esc(na.label) + '</div><div class="d">' + esc(na.desc) + '</div></div><button class="btn accent" data-act="' + (na.kind === "ch" ? "openCh" : "go") + '" data-id="' + (na.ch ? na.ch.id : "") + '" data-view="' + na.kind + '">' + (na.kind === "ch" ? "열기" : "이동") + I.arrow + "</button></div>" +
    '</div><div class="r"><div class="row" style="justify-content:space-between"><div class="eyebrow">공정률 추이</div><span class="mono muted" style="font-size:11px">' + pl.length + "일 기록</span></div>" + trend +
      '<div class="stack" style="gap:6px;margin-top:auto"><div class="eyebrow">개정 이력</div>' + (P.revLog.length ? P.revLog.slice(-3).reverse().map((r) => '<div class="row" style="gap:8px;font-size:12.5px;flex-wrap:nowrap"><span class="rev-tri">' + pad2(r.rev) + '</span><span style="flex:1">' + esc(r.note) + '</span><span class="mono muted" style="font-size:10.5px">' + fmtDot(r.at) + "</span></div>").join("") : '<div class="muted" style="font-size:12.5px">챕터를 마치거나 초상을 그리면 REV가 올라가요.</div>') + "</div>" +
    "</div></section>" +
    '<section class="sheet kpis">' +
      kpi("완료 챕터", doneN + " / 9", "진행 중 " + CH.filter((c) => chState(P, c.id) === "doing").length) +
      kpi("알게 된 사실", P.facts.length, "인터뷰에서 " + ivFacts) +
      kpi("원하는 것", P.wants.items.length, "진행 중 " + wantDoing) +
      kpi("정비 일지", S.LOG.items.length, "최근 " + fmtYM(recent[0]?.date || "")) +
    "</section>" +
    '<section class="sheet" style="margin-top:14px;padding:14px 16px 10px"><div class="row" style="justify-content:space-between"><div class="eyebrow">건조 공정 · 11 stages</div><span class="muted" style="font-size:12px">◆ 완료 · ◈ 진행 · ◇ 대기</span></div>' + stages + "</section>" +
    '<div class="row" style="justify-content:space-between;margin:26px 0 10px"><h3 style="font-size:16px">도면</h3><span class="muted" style="font-size:12px">쌓인 데이터로 자동으로 그려지는 네 장의 도면</span></div>' +
    '<div class="dwg-cards">' +
      dwgCard("portrait", "LD-01", "자기 초상", pr ? "REV." + pad2(pr.rev || 0) : "미작성", miniPortrait(P)) +
      dwgCard("map", "LD-02", "살아있는 지도", S.AI.map ? "주제 " + S.AI.map.themes.length : "노드 " + mapNodeCount(P), miniMap(P)) +
      dwgCard("gantt", "LD-03", "인생 공정표", P.timeline.events.length + "개 이정표", miniGantt(P)) +
      dwgCard("metrics", "LD-04", "지표", "휠·성격·가치", miniRadar(P)) +
    "</div>" +
    '<div class="grid2" style="margin-top:26px">' +
      '<section class="sheet pad"><div class="row" style="justify-content:space-between;margin-bottom:6px"><h3 style="font-size:15px">최근 정비 일지</h3><a href="#log" data-act="go" data-view="log" style="font-size:12.5px">전체 보기</a></div><ul class="list-plain">' +
        (recent.length ? recent.map((r) => '<li><span class="ltype" style="min-width:52px"><i class="dot" style="background:' + (RT_BY[r.type]?.color || "var(--ink-3)") + '"></i>' + esc(RT_BY[r.type]?.name || "") + '</span><span style="flex:1">' + esc(cut(r.text, 90)) + '</span><span class="mono muted" style="font-size:11px">' + esc(fmtYM(r.date)) + "</span></li>").join("") : '<li class="muted">아직 기록이 없어요.</li>') +
      '</ul></section><section class="sheet pad"><div class="row" style="justify-content:space-between;margin-bottom:6px"><h3 style="font-size:15px">최근에 알게 된 것</h3><a href="#interview" data-act="go" data-view="interview" style="font-size:12.5px">인터뷰로 더 채우기</a></div><ul class="list-plain">' +
        (recFacts.length ? recFacts.map((f) => '<li><span class="tag" style="min-width:64px;justify-content:center">' + esc(AREAS[f.area] || f.area) + '</span><span style="flex:1">' + esc(f.text) + "</span></li>").join("") : '<li class="muted">아직 없어요.</li>') +
      "</ul></section></div>";
}
function kpi(l, v, d) { return '<div class="kpi"><div class="l">' + esc(l) + '</div><div class="v">' + esc(v) + '</div><div class="d">' + esc(d) + "</div></div>"; }
function dwgCard(view, no, name, meta, preview) {
  return '<a href="#' + view + '" class="sheet dwg-card" data-act="go" data-view="' + view + '"><div class="pv">' + preview + '</div><div class="meta"><div><div class="mono muted" style="font-size:10.5px">' + no + "</div><b>" + esc(name) + '</b></div><span class="tag">' + esc(meta) + "</span></div></a>";
}
function miniPortrait(P) {
  const pr = S.AI.portrait;
  if (!pr) return placeholderSVG("초상 미작성");
  return '<div style="padding:14px 18px;text-align:left;width:100%"><div class="mono muted" style="font-size:9.5px;letter-spacing:.14em">' + esc(hullNo(P)) + '</div><div style="font-family:var(--f-serif);font-size:22px;font-weight:700;line-height:1.25;margin:6px 0">' + esc(pr.archetype) + '</div><div style="font-size:11.5px;color:var(--ink-2);line-height:1.5">' + esc(cut(pr.headline, 60)) + "</div></div>";
}
function miniMap(P) {
  const counts = { values: valueScores(P).filter((v) => v.n).length ? 5 : 0, loves: allLoveItems(P).length, energy: energyLists(P).c.length, thoughts: P.thoughts.items.length, wants: P.wants.items.length, life: 4, traits: ipipScores(P).O.n ? 5 : 0 };
  const W = 200, H = 130, cx = 100, cy = 65; let g = "";
  DOMAINS.forEach((d, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / DOMAINS.length; const x = cx + Math.cos(a) * 44, y = cy + Math.sin(a) * 42;
    g += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" ' + st({ stroke: "var(--rule)" }) + "/>";
    const n = Math.min(8, Math.ceil((counts[d.id] || 0) / 4));
    for (let k = 0; k < n; k++) { const b = a + (k - (n - 1) / 2) * 0.28; const x2 = cx + Math.cos(b) * 62, y2 = cy + Math.sin(b) * 56; g += '<line x1="' + x.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" ' + st({ stroke: "var(--rule)" }) + '/><circle cx="' + x2.toFixed(1) + '" cy="' + y2.toFixed(1) + '" r="2.4" ' + st({ fill: d.color }) + "/>"; }
    g += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="5" ' + st({ fill: d.color, stroke: "var(--sheet-2)", "stroke-width": "2" }) + "/>";
  });
  g += '<circle cx="' + cx + '" cy="' + cy + '" r="7" ' + st({ fill: "var(--ink)" }) + "/>";
  return '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '">' + g + "</svg>";
}
function mapNodeCount(P) { return buildGraph(P).nodes.length; }
function miniGantt(P) {
  const ev = P.timeline.events.filter((e) => e.s);
  const by = P.basics.birthYear || 1980; const x0 = by, x1 = by + 100, W = 200, H = 120;
  const X = (v) => 10 + ((v - x0) / (x1 - x0)) * (W - 20);
  let g = ""; const lanes = LANES.slice(0, 4);
  lanes.forEach((l, i) => {
    const y = 18 + i * 22;
    g += '<line x1="10" x2="' + (W - 10) + '" y1="' + (y + 5) + '" y2="' + (y + 5) + '" ' + st({ stroke: "var(--rule-2)" }) + "/>";
    ev.filter((e) => e.lane === l.id).forEach((e) => {
      const a = ym2num(e.s), bb = ym2num(e.e);
      if (bb) g += '<rect x="' + X(a).toFixed(1) + '" y="' + y + '" width="' + Math.max(2, X(bb) - X(a)).toFixed(1) + '" height="10" rx="2" ' + st({ fill: "var(--accent)", opacity: e.est ? ".45" : ".9" }) + "/>";
      else g += '<rect x="' + (X(a) - 3).toFixed(1) + '" y="' + (y + 2) + '" width="6" height="6" transform="rotate(45 ' + X(a).toFixed(1) + " " + (y + 5) + ')" ' + st({ fill: "var(--ink)" }) + "/>";
    });
  });
  const t = X(nowYear());
  g += '<line x1="' + t.toFixed(1) + '" x2="' + t.toFixed(1) + '" y1="8" y2="' + (H - 12) + '" ' + st({ stroke: "var(--signal)", "stroke-width": "1.5" }) + "/>";
  return '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '">' + g + "</svg>";
}

/* ============================================================ JOURNEY · 안내된 여정 */
function curCh() {
  if (!S.ui.ch || !CH_BY[S.ui.ch]) { const n = CH.find((c) => !S.P.done[c.id]); S.ui.ch = (n || CH[0]).id; }
  return CH_BY[S.ui.ch];
}
function srcTag(src) { return src ? '<span class="tag seed" title="출처">' + esc(src) + "</span>" : ""; }
function hint(label, text) { return text ? '<div class="qhint"><b>' + esc(label) + "</b><span>" + esc(text) + "</span></div>" : ""; }

/* ---------------- steps per chapter ---------------- */
const STEPS = {
  basics: () => [{ label: "제원", html: stepBasics, ok: () => true }],
  wheel: () => [0, 1, 2, 3].map((k) => ({ label: WHEEL.slice(k * 2, k * 2 + 2).map((w) => w.name).join("·"), html: () => stepWheel(k), ok: () => WHEEL.slice(k * 2, k * 2 + 2).every((w) => { const a = S.P.wheel.areas[w.id]; return a && a.sat != null && a.imp != null; }) })),
  ipip: () => [0, 1, 2, 3, 4].map((k) => ({ label: k * 4 + 1 + "–" + (k * 4 + 4), html: () => stepIpip(k), ok: () => IPIP.slice(k * 4, k * 4 + 4).every((x) => S.P.ipip.answers[x.n] != null) })),
  values: () => DILEMMAS.map((d, i) => ({ label: "", html: () => stepDilemma(i), ok: () => !!S.P.values.picks[i] })),
  energy: () => [
    { label: "활동 1", html: () => stepActs(0), ok: () => ACTS.slice(0, 10).every((a) => S.P.energy.acts[a.id]) },
    { label: "활동 2", html: () => stepActs(1), ok: () => ACTS.slice(10).every((a) => S.P.energy.acts[a.id]) },
    { label: "몰입", html: stepFlow, ok: () => true },
    { label: "리듬", html: stepChrono, ok: () => CHRONO.every((q) => S.P.energy.chrono[q.id] != null) },
    { label: "일하는 방식", html: stepDisc, ok: () => DISC_PAIRS.every((_, i) => S.P.energy.disc[i]) },
  ],
  loves: () => [{ label: "탐색", html: stepLoves, ok: () => true }],
  thoughts: () => [{ label: "재검토", html: stepThoughts, ok: () => true }],
  wants: () => [{ label: "목적지", html: stepWants, ok: () => true }],
  timeline: () => [{ label: "이정표", html: stepTimeline, ok: () => true }],
};

function viewJourney() {
  const P = S.P, ch = curCh(), steps = STEPS[ch.id]();
  if (S.ui.step > steps.length) S.ui.step = steps.length;
  const onResult = S.ui.step === steps.length;
  const idx = '<nav class="jr-index sheet" aria-label="챕터 목록"><ol>' + CH.map((c) => {
    const stt = chState(P, c.id), pr = P.done[c.id] ? 100 : chProgress(P, c.id);
    return '<li class="' + stt + '"><a href="#journey" class="' + (c.id === ch.id ? "on" : "") + '" data-act="openCh" data-id="' + c.id + '"><span class="dia"></span><span class="t">' + c.code + " " + esc(c.name) + "<small>" + esc(c.stage) + '</small></span><span class="p">' + (stt === "done" ? "완료" : pr + "%") + "</span></a></li>";
  }).join("") + "</ol></nav>";

  const pr = P.done[ch.id] ? 100 : chProgress(P, ch.id);
  const head = '<div class="ch-head"><div class="code">CH.' + ch.code + " · " + esc(ch.stage) + '</div><h2>' + esc(ch.title) + '</h2><p class="why">' + esc(ch.why) + '</p><div class="meta"><span class="tag">' + esc(ch.frame) + '</span><span class="tag">약 ' + ch.mins + '분</span><span class="state ' + chState(P, ch.id) + '">' + ({ done: "완료", doing: "진행 " + pr + "%", todo: "대기" })[chState(P, ch.id)] + "</span>" + (P.done[ch.id] && P.chapterAt[ch.id] ? '<span class="tag">완료 ' + fmtDot(P.chapterAt[ch.id]) + "</span>" : "") + "</div></div>";
  const body = '<div class="ch-body">' + (onResult ? chapterResult(ch.id) : steps[S.ui.step].html()) + "</div>";
  const cur = steps[S.ui.step];
  const canNext = onResult || !cur || cur.ok();
  const dots = steps.map((s, i) => '<i class="' + (i < S.ui.step ? "on" : i === S.ui.step ? "cur" : "") + '" title="' + esc(s.label) + '"></i>').join("") + '<i class="' + (onResult ? "cur" : "") + '" title="결과"></i>';
  const stepLabel = onResult ? "결과" : (steps.length > 1 ? (S.ui.step + 1) + " / " + steps.length + (cur.label ? " · " + esc(cur.label) : "") : esc(cur.label));
  let foot = '<div class="ch-foot"><div class="steps">' + dots + '<span class="mono muted" style="font-size:11px;margin-left:6px">' + stepLabel + "</span></div>";
  if (S.ui.step > 0) foot += '<button class="btn ghost" data-act="stepPrev">' + I.back + "이전</button>";
  if (!onResult) foot += '<button class="btn primary" data-act="stepNext" ' + (canNext ? "" : "disabled") + ">" + (S.ui.step === steps.length - 1 ? "결과 보기" : "다음") + I.arrow + "</button>";
  else {
    if (!P.done[ch.id]) foot += '<button class="btn signal" data-act="chDone">챕터 완료</button>';
    const ni = CH.findIndex((c) => c.id === ch.id);
    if (ni < CH.length - 1) foot += '<button class="btn ' + (P.done[ch.id] ? "primary" : "") + '" data-act="openCh" data-id="' + CH[ni + 1].id + '">다음 챕터 · ' + esc(CH[ni + 1].name) + I.arrow + "</button>";
    else foot += '<button class="btn ' + (P.done[ch.id] ? "primary" : "") + '" data-act="go" data-view="interview">시운전(AI 인터뷰)으로' + I.arrow + "</button>";
  }
  foot += "</div>";
  const needHint = !onResult && cur && !canNext ? '<p class="muted" style="font-size:12px;text-align:right;margin-top:8px">모든 문항에 답하면 다음으로 넘어갈 수 있어요.</p>' : "";

  return '<div class="page-head"><div><div class="eyebrow">Journey · 설계와 건조</div><h1>안내된 여정</h1><p class="lede">아홉 개의 챕터를 차례로 지나며 나라는 배의 뼈대를 세웁니다. 순서를 건너뛰어도 괜찮아요. 모든 답은 바로 저장돼요.</p></div></div>' +
    '<div class="jr">' + idx + '<section class="sheet lift" id="chSheet">' + head + body + foot + "</section></div>" + needHint;
}

/* ---------------- CH00 basics ---------------- */
function stepBasics() {
  const b = S.P.basics;
  const f = (k, label, ph, type) => '<div class="field"><label for="b_' + k + '">' + label + '</label><input class="input" id="b_' + k + '" ' + (type === "num" ? 'inputmode="numeric" data-type="num"' : "") + ' data-bind="P.basics.' + k + '" value="' + esc(b[k] ?? "") + '" placeholder="' + esc(ph || "") + '"></div>';
  const t = (k, label, ph) => '<div class="field"><label for="b_' + k + '">' + label + '</label><textarea class="input" id="b_' + k + '" rows="3" data-bind="P.basics.' + k + '" placeholder="' + esc(ph || "") + '">' + esc(b[k] || "") + "</textarea></div>";
  return '<div class="stack">' +
    (b.seeded && !b.confirmed ? '<div class="banner info">기존 메모에서 채운 내용이에요. 출생년도와 자녀 나이는 메모 속 나이 기록으로 추정했어요. 틀린 곳을 고치고 아래 버튼을 눌러 주세요.</div>' : "") +
    '<div class="grid2">' + f("name", "이름") + f("nick", "불리고 싶은 호칭 (선택)", "예: 성문") + f("birthYear", "출생년도" + (b.birthEst ? ' <span class="tag est">추정</span>' : ""), "예: 1982", "num") + f("region", "사는 곳") + "</div>" +
    f("job", "하는 일", "회사, 직무, 직책") + t("family", "가족", "함께 사는 사람, 가까운 가족") + t("career", "일의 이력 (선택)", "어떤 일을 해 왔는지") + t("intro", "나를 한 문장으로 소개한다면 (선택)", "지금 떠오르는 대로") +
    '<div class="row"><button class="btn ' + (b.confirmed ? "" : "primary") + '" data-act="basicsConfirm">' + (b.confirmed ? "확인 완료 ✓" : "이 내용이 맞아요") + "</button>" + (b.confirmed ? '<span class="muted" style="font-size:12.5px">언제든 다시 고칠 수 있어요.</span>' : "") + "</div></div>";
}

/* ---------------- CH01 wheel ---------------- */
function stepWheel(k) {
  const P = S.P; const hints = (P.hints && P.hints.wheel) || {};
  return '<p class="muted" style="margin-bottom:6px">두 가지를 따로 매겨 주세요. <b style="color:var(--ink)">만족도</b>는 지금 이 영역이 얼마나 채워져 있다고 느끼는지(0~10), <b style="color:var(--ink)">중요도</b>는 나에게 이 영역이 얼마나 중요한지(1~5)예요.</p>' +
    WHEEL.slice(k * 2, k * 2 + 2).map((w) => {
      const a = P.wheel.areas[w.id] || {};
      const sat = '<div class="scale-row"><span class="flabel">만족도</span><div class="scale" role="group" aria-label="' + w.name + ' 만족도">' + Array.from({ length: 11 }, (_, v) => '<button class="' + (a.sat === v ? "on" : "") + '" data-act="wheelSat" data-a="' + w.id + '" data-v="' + v + '">' + v + "</button>").join("") + '</div><div class="scale-cap"><span>전혀 채워지지 않음</span><span>충분히 채워짐</span></div></div>';
      const imp = '<div class="scale-row"><span class="flabel">중요도</span><div class="scale imp" role="group" aria-label="' + w.name + ' 중요도">' + [1, 2, 3, 4, 5].map((v) => '<button class="' + (a.imp === v ? "on" : "") + '" data-act="wheelImp" data-a="' + w.id + '" data-v="' + v + '">' + v + "</button>").join("") + '</div><div class="scale-cap" style="max-width:190px"><span>덜 중요</span><span>매우 중요</span></div></div>';
      return '<div class="wa"><div class="nm">' + w.name + "<small>" + w.sub + '</small></div><div class="stack" style="gap:12px">' + hint("참고", hints[w.id]) + sat + imp +
        '<div class="field"><label for="wn_' + w.id + '">그렇게 매긴 이유 (선택)</label><textarea class="input" rows="2" id="wn_' + w.id + '" data-bind="P.wheel.areas.' + w.id + '.note" placeholder="한 줄이면 충분해요">' + esc(a.note || "") + "</textarea></div></div></div>";
    }).join("");
}

/* ---------------- CH02 ipip ---------------- */
function stepIpip(k) {
  return '<p class="muted" style="margin-bottom:4px">평소의 나를 떠올리며 답해 주세요. 되고 싶은 모습이 아니라 지금의 모습 그대로요.</p>' +
    IPIP.slice(k * 4, k * 4 + 4).map((x) => {
      const v = S.P.ipip.answers[x.n];
      return '<div class="lk"><div class="q"><small>' + pad2(x.n) + "</small>" + esc(x.q) + '</div><div class="opts" role="group">' + LIKERT.map((l, i) => '<button class="' + (v === i + 1 ? "on" : "") + '" data-act="ipip" data-n="' + x.n + '" data-v="' + (i + 1) + '">' + l + "</button>").join("") + "</div></div>";
    }).join("");
}

/* ---------------- CH03 values ---------------- */
function stepDilemma(i) {
  const d = DILEMMAS[i], p = S.P.values.picks[i];
  const prior = S.P.prior && S.P.prior.valuesTop3 && i === 0 ? '<div class="qhint"><b>참고</b><span>지난번에 10개 가치 중 직접 고른 Top 3는 ' + S.P.prior.valuesTop3.map((id) => VAL_BY[id]?.name).join(" · ") + "였어요. 이번엔 고르는 대신 선택으로 드러나는 순위를 봅니다. 결과에서 둘을 비교해요.</span></div>" : "";
  return '<div class="dl">' + prior + '<div class="sc">DILEMMA ' + pad2(i + 1) + " / " + DILEMMAS.length + '</div><div class="q">' + esc(d.q) + '</div><div class="opts">' +
    [["a", d.a], ["b", d.b]].map(([k, o]) => '<button class="opt ' + (p === k ? "on" : "") + '" data-act="dilemma" data-i="' + i + '" data-v="' + k + '"><span class="k">' + k.toUpperCase() + '</span><span class="t">' + esc(o[1]) + "</span></button>").join("") +
    '</div><p class="muted" style="font-size:12.5px">둘 다 끌려도 굳이 하나를 고르면? 고르면 다음 문제로 넘어가요.</p></div>';
}

/* ---------------- CH04 energy ---------------- */
function stepActs(part) {
  const list = part === 0 ? ACTS.slice(0, 10) : ACTS.slice(10);
  return '<p class="muted" style="margin-bottom:12px">이 활동을 하고 나면 보통 어떤가요? <b style="color:var(--c-energy)">충전</b>은 하고 나면 힘이 나는 것, <b style="color:var(--crit)">방전</b>은 잘하더라도 진이 빠지는 것.</p><div class="acts">' +
    list.map((a) => { const v = S.P.energy.acts[a.id]; return '<div class="act ' + (v || "") + '"><span class="nm">' + esc(a.t) + '</span><span class="seg">' + [["c", "충전"], ["n", "보통"], ["d", "방전"]].map(([k, l]) => '<button class="' + k + (v === k ? " on" : "") + '" data-act="act" data-a="' + a.id + '" data-v="' + k + '">' + l + "</button>").join("") + "</span></div>"; }).join("") + "</div>";
}
function stepFlow() {
  const e = S.P.energy, h = (S.P.hints && S.P.hints.energy) || {};
  const ta = (k, label, ph) => '<div class="field"><label for="fl_' + k + '">' + label + '</label><textarea class="input" rows="3" id="fl_' + k + '" data-bind="P.energy.' + k + '" placeholder="' + esc(ph) + '">' + esc(e[k] || "") + "</textarea></div>";
  return '<div class="stack">' + hint("참고", h.flowRecent) +
    ta("flowRecent", "최근에 시간 가는 줄 몰랐던 순간", "언제, 무엇을 하고 있었나요? 작은 것도 괜찮아요") +
    ta("flowLast", "없다면, 마지막으로 그랬던 때는 언제였나요?", "몇 년 전이어도 좋아요") +
    ta("flowChild", "어릴 때 가장 빠져 있던 것", "누가 시키지 않아도 하던 것") + "</div>";
}
function stepChrono() {
  const c = S.P.energy.chrono, h = (S.P.hints && S.P.hints.energy) || {};
  return '<div class="stack">' + hint("참고", h.chrono) + CHRONO.map((q) => '<div class="field"><span class="flabel" style="font-size:14px;color:var(--ink)">' + esc(q.q) + '</span><div class="seg3" role="group">' + q.o.map(([l, v]) => '<button class="' + (c[q.id] === v ? "on" : "") + '" data-act="chrono" data-q="' + q.id + '" data-v="' + v + '">' + l + "</button>").join("") + "</div></div>").join("") + "</div>";
}
function stepDisc() {
  const d = S.P.energy.disc;
  const migrated = Object.keys(d).length && S.P.prior && S.P.prior.valuesTop3 ? '<div class="qhint" style="margin-bottom:14px"><b>이어받음</b><span>지난 버전에서 답한 8문항을 그대로 가져왔어요. 바꾸고 싶은 답만 다시 눌러 주세요.</span></div>' : "";
  return migrated + '<p class="muted" style="margin-bottom:12px">두 문장 중 일할 때의 나에 더 가까운 쪽을 고르세요.</p>' + DISC_PAIRS.map((p, i) => '<div class="pair">' + [["a", p.a], ["b", p.b]].map(([k, o]) => '<button class="' + (d[i] === k ? "on" : "") + '" data-act="disc" data-i="' + i + '" data-v="' + k + '">' + esc(o[1]) + "</button>").join("") + "</div>").join("");
}

/* ---------------- CH05 loves (drill-down) ---------------- */
function stepLoves() {
  const P = S.P, cat = S.ui.lovesCat;
  if (!cat) {
    return '<p class="muted" style="margin-bottom:14px">큰 분류를 골라 들어가세요. 들어간 분류는 <span class="tag">확인함</span>으로 표시돼요.</p><div class="tiles">' + LOVE_CATS.map((c, i) => {
      const x = P.loves.cats[c.id]; const n = x.items.length;
      return '<button class="tile" data-act="loveCat" data-id="' + c.id + '"><span class="bar" style="background:var(--c-loves);opacity:' + (n ? 1 : 0.25) + '"></span><span class="ic">' + pad2(i + 1) + '</span><span class="nm">' + c.name + '</span><span class="ds">' + c.d + '</span><span class="ct ' + (n ? "has" : "") + '">항목 ' + n + " · 세부 " + x.subs.length + (P.loves.seen[c.id] ? " · 확인함" : "") + "</span></button>";
    }).join("") + "</div>";
  }
  const C = LOVE_CATS.find((c) => c.id === cat), x = P.loves.cats[cat];
  const subs = Array.from(new Set(C.subs.concat(x.subs)));
  const items = x.items.map((it, i) => '<div class="it love"><input class="input" style="font-weight:600" aria-label="이름" data-bind="P.loves.cats.' + cat + ".items." + i + '.name" value="' + esc(it.name) + '"><input class="input why" aria-label="좋아하는 이유" data-bind="P.loves.cats.' + cat + ".items." + i + '.why" value="' + esc(it.why || "") + '" placeholder="왜 좋은가요? 맛, 분위기, 추억, 누구와…"><div class="ops">' + srcTag(it.src) + '<button class="btn sm ghost" data-act="loveDel" data-i="' + i + '" aria-label="삭제">' + I.trash + "</button></div></div>").join("");
  return '<div class="crumbs"><button data-act="loveCat" data-id="">좋아하는 것</button><span class="sep">›</span><b style="color:var(--ink)">' + C.name + "</b></div>" +
    '<div class="stack"><div><div class="flabel" style="margin-bottom:8px">중분류 · 끌리는 것을 모두 켜 주세요</div><div class="row" style="gap:6px">' + subs.map((s) => '<button class="chip ' + (x.subs.includes(s) ? "on" : "") + '" data-act="loveSub" data-v="' + esc(s) + '">' + esc(s) + "</button>").join("") +
    '<span class="row" style="gap:6px"><input class="input" id="newSub" placeholder="직접 추가" style="width:130px;padding:5px 9px;font-size:12.5px"><button class="btn sm" data-act="loveSubAdd">추가</button></span></div></div>' +
    '<div><div class="flabel" style="margin-bottom:8px">소분류 · 구체적으로 좋아하는 것과 그 이유</div><div class="items">' + (items || '<div class="empty">아직 없어요. 아래에서 추가해 보세요.</div>') + "</div></div>" +
    '<div class="adder"><input class="input" id="newLoveName" placeholder="좋아하는 것 (예: 진주냉면)"><input class="input" id="newLoveWhy" placeholder="이유 (선택)"><button class="btn primary" data-act="loveAdd">' + I.plus + "추가</button></div>" +
    '<div class="row" style="justify-content:space-between;margin-top:6px"><button class="btn ghost" data-act="loveCat" data-id="">' + I.back + "분류 목록</button>" + nextCatBtn(cat) + "</div></div>";
}
function nextCatBtn(cat) { const i = LOVE_CATS.findIndex((c) => c.id === cat); const n = LOVE_CATS[i + 1]; return n ? '<button class="btn" data-act="loveCat" data-id="' + n.id + '">다음 분류 · ' + n.name + I.arrow + "</button>" : ""; }

/* ---------------- CH06 thoughts (drill-down) ---------------- */
function stepThoughts() {
  const P = S.P, g = S.ui.thGroup, itId = S.ui.thItem, items = P.thoughts.items;
  if (itId) {
    const it = items.find((x) => x.id === itId); if (!it) { S.ui.thItem = null; return stepThoughts(); }
    const G = THOUGHT_GROUPS.find((x) => x.id === it.group); const sibs = items.filter((x) => x.group === it.group); const k = sibs.indexOf(it);
    const idx = items.indexOf(it);
    return '<div class="crumbs"><button data-act="thGroup" data-id="">마음속 주제</button><span class="sep">›</span><button data-act="thGroup" data-id="' + it.group + '">' + esc(G ? G.name : "") + '</button><span class="sep">›</span><b style="color:var(--ink)">' + esc(it.label) + "</b></div>" +
      '<div class="stack">' +
      (it.memo || (it.links || []).length ? '<div class="memo"><span class="yr">예전 메모' + (it.src ? " · " + esc(it.src) : "") + "</span>" + (it.memo ? esc(it.memo) : '<span class="muted" style="font-family:var(--f-sans);font-size:13px">연관어만 적혀 있어요</span>') + ((it.links || []).length ? '<div class="row" style="gap:5px;margin-top:10px">' + it.links.map((l) => '<span class="tag">' + esc(l) + "</span>").join("") + "</div>" : "") + "</div>" : "") +
      '<div class="field"><span class="flabel">지금 이 주제는</span><div class="seg3" role="group">' + TH_STATUS.map(([v, l]) => '<button class="' + (it.status === v ? "on" : "") + '" data-act="thStatus" data-v="' + v + '">' + l + "</button>").join("") + "</div></div>" +
      '<div class="field"><span class="flabel">마음을 차지하는 비중</span><div class="mini-seg">' + [[1, "가볍게"], [2, "자주"], [3, "크게"]].map(([v, l]) => '<button class="' + (it.weight === v ? "on" : "") + '" data-act="thWeight" data-v="' + v + '">' + l + "</button>").join("") + "</div></div>" +
      '<div class="field"><label for="thNow">지금의 생각</label><textarea class="input" id="thNow" rows="4" data-bind="P.thoughts.items.' + idx + '.now" placeholder="예전과 무엇이 같고 무엇이 달라졌나요?">' + esc(it.now || "") + "</textarea></div>" +
      '<div class="row" style="justify-content:space-between">' + (k > 0 ? '<button class="btn ghost" data-act="thItem" data-id="' + sibs[k - 1].id + '">' + I.back + esc(sibs[k - 1].label) + "</button>" : "<span></span>") + (k < sibs.length - 1 ? '<button class="btn" data-act="thItem" data-id="' + sibs[k + 1].id + '">' + esc(sibs[k + 1].label) + I.arrow + "</button>" : '<button class="btn" data-act="thGroup" data-id="">다른 그룹 보기' + I.arrow + "</button>") + "</div></div>";
  }
  if (!g) {
    return '<p class="muted" style="margin-bottom:14px">예전에 적어 둔 생각의 뿌리들이에요. 그룹에 들어가 하나씩 지금의 눈으로 다시 봐 주세요.</p><div class="tiles">' + THOUGHT_GROUPS.map((G, i) => {
      const xs = items.filter((x) => x.group === G.id); const rv = xs.filter((x) => x.status).length; const hv = xs.filter((x) => x.status === "heavy").length;
      return '<button class="tile" data-act="thGroup" data-id="' + G.id + '"><span class="bar" style="background:var(--c-thoughts);opacity:' + (xs.length ? 1 : 0.25) + '"></span><span class="ic">' + pad2(i + 1) + '</span><span class="nm">' + G.name + '</span><span class="ds">' + (xs.slice(0, 5).map((x) => esc(x.label)).join(" · ") || G.d) + '</span><span class="ct ' + (rv ? "has" : "") + '">주제 ' + xs.length + " · 검토 " + rv + (hv ? " · 무거움 " + hv : "") + "</span></button>";
    }).join("") + "</div>";
  }
  const G = THOUGHT_GROUPS.find((x) => x.id === g); const xs = items.filter((x) => x.group === g);
  return '<div class="crumbs"><button data-act="thGroup" data-id="">마음속 주제</button><span class="sep">›</span><b style="color:var(--ink)">' + G.name + "</b></div>" +
    '<div class="items">' + (xs.length ? xs.map((x) => '<button class="it" style="text-align:left;cursor:pointer" data-act="thItem" data-id="' + x.id + '"><span class="n">' + esc(x.label) + '</span><span>' + (x.status ? '<span class="tag' + (x.status === "heavy" ? " est" : "") + '">' + (TH_STATUS.find((s) => s[0] === x.status) || [0, ""])[1] + "</span>" : '<span class="tag">미검토</span>') + '</span><span class="w">' + esc(x.now ? "지금: " + cut(x.now, 80) : x.memo ? cut(x.memo, 80) : (x.links || []).join(" · ")) + "</span></button>").join("") : '<div class="empty">아직 주제가 없어요.</div>') + "</div>" +
    '<div class="adder" style="grid-template-columns:minmax(0,1fr) auto;margin-top:12px"><input class="input" id="newTh" placeholder="이 그룹에 새 주제 추가 (예: 몰입)"><button class="btn primary" data-act="thAdd">' + I.plus + "추가</button></div>";
}

/* ---------------- CH07 wants (drill-down) ---------------- */
function stepWants() {
  const P = S.P, t = S.ui.wantType, items = P.wants.items;
  if (!t) {
    return '<p class="muted" style="margin-bottom:14px">다섯 종류의 목적지예요. 들어가서 시기·중요도·상태를 확인해 주세요. 확인한 항목이 공정표의 미래 구간이 됩니다.</p><div class="tiles">' + WANT_TYPES.map((T) => {
      const xs = items.filter((w) => w.type === T.id); const rv = xs.filter((w) => w.rv).length;
      return '<button class="tile" data-act="wantType" data-id="' + T.id + '"><span class="bar" style="background:var(--c-wants);opacity:' + (xs.length ? 1 : 0.25) + '"></span><span class="ic" style="font-size:9px">' + T.en + '</span><span class="nm">' + T.name + '</span><span class="ds">' + (xs.sort((a, b) => (b.prio || 0) - (a.prio || 0)).slice(0, 3).map((w) => esc(cut(w.text, 18))).join(" · ") || T.d) + '</span><span class="ct ' + (rv ? "has" : "") + '">' + xs.length + "개 · 확인 " + rv + "</span></button>";
    }).join("") + "</div>";
  }
  const T = WT_BY[t];
  const xs = items.map((w, i) => ({ w, i })).filter((o) => o.w.type === t).sort((a, b) => (b.w.prio || 0) - (a.w.prio || 0));
  return '<div class="crumbs"><button data-act="wantType" data-id="">원하는 것</button><span class="sep">›</span><b style="color:var(--ink)">' + T.name + ' <span class="mono muted" style="font-size:11px">' + T.en + "</span></b></div>" +
    '<div class="items">' + (xs.length ? xs.map(({ w, i }) =>
      '<div class="want"><div><div class="n">' + esc(w.text) + (w.rv ? ' <span class="tag" style="margin-left:4px">확인</span>' : "") + '</div><input class="input" style="margin-top:6px;font-size:12.5px;padding:5px 9px" data-bind="P.wants.items.' + i + '.why" data-mark="rv:' + i + '" value="' + esc(w.why || "") + '" placeholder="왜 원하나요? (선택)"></div><div class="ops">' + srcTag(w.src) + '<button class="btn sm ghost" data-act="wantDel" data-i="' + i + '" aria-label="삭제">' + I.trash + "</button></div>" +
      '<div class="ctl"><span><span class="lab">시기</span><span class="mini-seg">' + HORIZONS.map(([v, l]) => '<button class="' + (w.horizon === v ? "on" : "") + '" data-act="wantSet" data-i="' + i + '" data-k="horizon" data-v="' + v + '">' + l + "</button>").join("") + '</span></span><span><span class="lab">중요도</span><span class="stars">' + [1, 2, 3].map((v) => '<button class="' + ((w.prio || 0) >= v ? "on" : "") + '" data-act="wantSet" data-i="' + i + '" data-k="prio" data-v="' + v + '" aria-label="중요도 ' + v + '">★</button>').join("") + '</span></span><span><span class="lab">상태</span><span class="mini-seg">' + W_STATUS.map(([v, l]) => '<button class="' + (w.status === v ? "on" : "") + '" data-act="wantSet" data-i="' + i + '" data-k="status" data-v="' + v + '">' + l + "</button>").join("") + "</span></span></div></div>").join("") : '<div class="empty">아직 없어요.</div>') + "</div>" +
    '<div class="adder" style="grid-template-columns:minmax(0,1fr) auto auto;margin-top:12px"><input class="input" id="newWant" placeholder="새 ' + T.name + ' 추가"><select class="input" id="newWantHz" style="width:auto">' + HORIZONS.map(([v, l]) => '<option value="' + v + '"' + (v === "3y" ? " selected" : "") + ">" + l + "</option>").join("") + '</select><button class="btn primary" data-act="wantAdd">' + I.plus + "추가</button></div>" +
    '<div class="row" style="justify-content:space-between;margin-top:12px"><button class="btn ghost" data-act="wantType" data-id="">' + I.back + '종류 목록</button><button class="btn" data-act="wantConfirmAll">이 목록 모두 확인</button></div>';
}

/* ---------------- CH08 timeline ---------------- */
function stepTimeline() {
  const P = S.P, ev = P.timeline.events;
  const order = ev.map((e, i) => ({ e, i })).sort((a, b) => (ym2num(a.e.s) ?? 9999) - (ym2num(b.e.s) ?? 9999));
  const missing = order.filter((o) => !o.e.s);
  const row = ({ e, i }) => '<div class="it" style="grid-template-columns:90px minmax(0,1fr) 108px 108px auto;align-items:center">' +
    '<select class="input" data-bind="P.timeline.events.' + i + '.lane" data-rerender="1" aria-label="구분">' + LANES.filter((l) => l.id !== "plan").map((l) => '<option value="' + l.id + '"' + (e.lane === l.id ? " selected" : "") + ">" + l.name + "</option>").join("") + "</select>" +
    '<input class="input" data-bind="P.timeline.events.' + i + '.label" value="' + esc(e.label) + '" aria-label="이름">' +
    '<input class="input mono" data-bind="P.timeline.events.' + i + '.s" data-ym="1" data-rerender="1" value="' + esc(e.s || "") + '" placeholder="YYYY-MM" aria-label="시작">' +
    '<input class="input mono" data-bind="P.timeline.events.' + i + '.e" data-ym="1" data-rerender="1" value="' + esc(e.e || "") + '" placeholder="끝 (기간이면)" aria-label="끝">' +
    '<div class="ops">' + (e.est ? '<button class="btn sm" data-act="evOk" data-i="' + i + '" title="추정을 확정으로">맞아요</button>' : '<span class="tag" style="background:transparent">확정</span>') + '<button class="btn sm ghost" data-act="evDel" data-i="' + i + '" aria-label="삭제">' + I.trash + "</button></div>" +
    (e.est || e.note || e.src ? '<div class="w">' + (e.est ? '<span class="tag est">추정</span> ' : "") + esc(e.note || "") + (e.src ? ' <span class="src">· ' + esc(e.src) + "</span>" : "") + "</div>" : "") + "</div>";
  return '<p class="muted" style="margin-bottom:12px">연도는 <span class="mono">2017</span> 또는 <span class="mono">2017-05</span>처럼 적어 주세요. 끝을 적으면 기간(막대), 비우면 이정표(◆)가 됩니다. 원하는 것(CH.07)의 시기는 자동으로 미래 구간에 들어가요.</p>' +
    (missing.length ? '<div class="banner" style="margin-bottom:12px">연도가 비어 있는 이정표가 ' + missing.length + '개 있어요: ' + missing.map((o) => "<b>" + esc(o.e.label) + "</b>").join(", ") + "</div>" : "") +
    '<div style="overflow-x:auto"><div class="items" style="min-width:640px">' + order.map(row).join("") + "</div></div>" +
    '<div class="adder" style="grid-template-columns:90px minmax(0,1fr) 108px 108px auto;margin-top:12px;overflow-x:auto"><select class="input" id="evLane">' + LANES.filter((l) => l.id !== "plan").map((l) => '<option value="' + l.id + '">' + l.name + "</option>").join("") + '</select><input class="input" id="evLabel" placeholder="새 이정표 (예: 입사)"><input class="input mono" id="evS" placeholder="YYYY-MM"><input class="input mono" id="evE" placeholder="끝 (선택)"><button class="btn primary" data-act="evAdd">' + I.plus + "추가</button></div>";
}

/* ---------------- results ---------------- */
function insightBox(id) {
  const ins = S.AI.insights[id], busy = S.ui.busy["ins_" + id];
  let inner;
  if (busy) inner = '<div class="typing"><span class="spinner"></span>Claude가 이 챕터를 읽고 있어요. 30초~1분 정도 걸려요.</div>';
  else if (ins) inner = '<div class="body">' + esc(ins.insight) + "</div>" + (ins.question ? '<div class="q">' + esc(ins.question) + "</div>" : "") + '<div class="row" style="justify-content:space-between"><span class="mono muted" style="font-size:10.5px">' + fmtDot(ins.at) + " · REV." + pad2(ins.rev || 0) + "</span>" + (aiAvailable() ? '<button class="btn sm ghost" data-act="insight" data-id="' + id + '">다시 해석</button>' : "") + "</div>";
  else if (aiAvailable()) inner = '<p style="font-size:13.5px;color:var(--ink-2)">이 결과를 다른 챕터와 메모에 비추어 해석하고, 스스로 던져 볼 질문을 하나 만들어 드려요.</p><div><button class="btn accent" data-act="insight" data-id="' + id + '">' + I.spark + "Claude의 해석 받기</button></div>";
  else inner = '<p class="muted" style="font-size:13px">' + (S.aiOff ? esc(aiErrMsg({ code: S.aiOff })) : "이 화면에서는 Claude 연결을 쓸 수 없어요. Claude 앱에서 열면 해석을 받을 수 있어요.") + "</p>";
  return '<div class="insight"><div class="h">' + I.spark.replace("<svg", '<svg width="15" height="15"') + "Claude의 해석</div>" + inner + "</div>";
}
function chapterResult(id) {
  const P = S.P; let h = "";
  switch (id) {
    case "basics": {
      const b = P.basics, age = b.birthYear ? new Date().getFullYear() - b.birthYear : null;
      const rows = [["이름", b.name, "NAME"], ["호칭", b.nick, "CALL SIGN"], ["출생년도", b.birthYear ? b.birthYear + (age ? " (만 " + (age - 1) + "~" + age + "세)" : "") + (b.birthEst ? " · 추정" : "") : "", "BUILT"], ["사는 곳", b.region, "PORT"], ["하는 일", b.job, "CLASS"], ["가족", b.family, "CREW"], ["일의 이력", b.career, "SERVICE"], ["한 문장 소개", b.intro, "REMARKS"]];
      h = '<div class="res-grid"><div><div class="eyebrow" style="margin-bottom:10px">Principal particulars · 제원표</div><table style="width:100%;border-collapse:collapse;font-size:13.5px">' + rows.map(([k, v, e]) => '<tr><td style="padding:9px 10px 9px 0;border-bottom:1px solid var(--rule-2);width:120px;vertical-align:top"><div style="font-weight:600">' + k + '</div><div class="mono muted" style="font-size:9.5px;letter-spacing:.1em">' + e + '</div></td><td style="padding:9px 0;border-bottom:1px solid var(--rule-2)">' + (v ? esc(v) : '<span class="muted">—</span>') + "</td></tr>").join("") + "</table></div>" +
        '<div class="stack"><div class="qhint"><b>다음</b><span>이제 ' + (P.basics.confirmed ? "" : "위 내용을 확인하고 ") + '지금의 상태를 점검합니다. CH.01은 삶의 여덟 영역을 두 번씩 매기는 5분짜리 점검이에요.</span></div>' + (b.confirmed ? "" : '<button class="btn primary" data-act="basicsConfirm">이 내용이 맞아요</button>') + "</div></div>";
      break;
    }
    case "wheel": {
      const ws = wheelStats(P);
      const focus = ws.filter((w) => w.gap != null && w.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 3);
      const strong = ws.filter((w) => w.sat != null && w.sat >= 7).sort((a, b) => b.sat - a.sat).slice(0, 3);
      h = '<div class="res-grid"><div>' + radarSVG(ws.map((w) => ({ label: w.name, sub: w.sat != null ? w.sat + "/10" : "" })), [{ name: "중요도×2", color: "var(--c-loves)", vals: ws.map((w) => (w.imp != null ? w.imp * 2 : null)) }, { name: "만족도", color: "var(--c-values)", vals: ws.map((w) => w.sat) }], { size: 340, aria: "라이프 휠" }) +
        '<div class="legend" style="justify-content:center"><span><i class="ln" style="background:var(--c-values)"></i>만족도</span><span><i class="ln" style="background:var(--c-loves)"></i>중요도(×2)</span></div></div>' +
        '<div class="stack"><div><div class="col-h"><i class="dot" style="background:var(--signal)"></i>지금 손봐야 할 곳</div>' + (focus.length ? '<ol style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px">' + focus.map((w) => "<li><b>" + w.name + "</b> — 중요도 " + w.imp + "/5인데 만족도는 " + w.sat + "/10" + (w.note ? '<div class="muted" style="font-size:12.5px">' + esc(w.note) + "</div>" : "") + "</li>").join("") + "</ol>" : '<p class="muted">중요도보다 만족도가 낮은 영역이 없어요.</p>') + "</div>" +
        (strong.length ? '<div><div class="col-h"><i class="dot" style="background:var(--good)"></i>잘 채워진 곳</div><p style="font-size:13.5px">' + strong.map((w) => w.name + " " + w.sat).join(" · ") + "</p></div>" : "") +
        insightBox("wheel") + "</div></div>" + '<div style="margin-top:20px">' + wheelDumbbell(ws) + "</div>";
      break;
    }
    case "ipip": {
      const tr = ipipScores(P);
      h = '<div class="res-grid"><div><div class="eyebrow" style="margin-bottom:6px">5요인 점수 (1~5, 가운데 선 = 3)</div>' + traitRows(tr, true) + '<p class="muted" style="font-size:11.5px;margin-top:10px">Mini-IPIP 20문항 간이 척도예요. 진단이 아니라 자기 탐색을 위한 참고 자료입니다.</p></div><div class="stack">' + comboNotes(tr) + insightBox("ipip") + "</div></div>";
      break;
    }
    case "values": {
      const vs = valueScores(P); const top = vs.filter((v) => v.n).slice(0, 3); const prior = (P.prior && P.prior.valuesTop3) || [];
      const same = top.filter((v) => prior.includes(v.id)).map((v) => VAL_BY[v.id].name);
      h = '<div class="res-grid"><div><div class="eyebrow" style="margin-bottom:10px">선택으로 드러난 가치 순위 (이긴 횟수 / 등장 횟수)</div>' + valueRows(vs) + '</div><div class="stack">' +
        '<div class="grid3" style="grid-template-columns:repeat(3,1fr)">' + top.map((v, i) => '<div class="sheet" style="padding:12px"><div class="mono muted" style="font-size:10.5px">TOP ' + (i + 1) + '</div><div style="font-weight:700;font-size:16px;margin:2px 0">' + VAL_BY[v.id].name + '</div><div style="font-size:12px;color:var(--ink-2)">' + VAL_BY[v.id].d + "</div></div>").join("") + "</div>" +
        (prior.length ? '<div class="qhint"><b>비교</b><span>직접 고른 Top 3: ' + prior.map((id) => VAL_BY[id]?.name).join(" · ") + ". 선택으로 드러난 Top 3: " + top.map((v) => VAL_BY[v.id].name).join(" · ") + ". " + (same.length ? "겹치는 것: " + same.join(", ") + "." : "겹치는 게 없어요. 머리로 중요하다고 여기는 것과 실제로 고르는 것이 다를 수 있어요.") + "</span></div>" : "") +
        insightBox("values") + "</div></div>";
      break;
    }
    case "energy": {
      const el = energyLists(P), dt = discTally(P), cr = chrono(P);
      h = '<div class="res-grid"><div class="stack"><div class="cols2"><div><div class="col-h"><i class="dot" style="background:var(--c-energy)"></i>충전 ' + el.c.length + '</div><ul class="list-plain">' + (el.c.map((a) => "<li>" + esc(a.t) + "</li>").join("") || '<li class="muted">없음</li>') + '</ul></div><div><div class="col-h"><i class="dot" style="background:var(--crit)"></i>방전 ' + el.d.length + '</div><ul class="list-plain">' + (el.d.map((a) => "<li>" + esc(a.t) + "</li>").join("") || '<li class="muted">없음</li>') + "</ul></div></div>" +
        (P.energy.flowRecent || P.energy.flowLast || P.energy.flowChild ? '<div><div class="col-h">몰입의 흔적</div><div style="font-size:13.5px;display:flex;flex-direction:column;gap:6px">' + [["최근", P.energy.flowRecent], ["마지막", P.energy.flowLast], ["어릴 때", P.energy.flowChild]].filter((x) => x[1]).map((x) => '<div><span class="tag">' + x[0] + "</span> " + esc(x[1]) + "</div>").join("") + "</div></div>" : "") +
        "</div><div class=\"stack\">" + quadSVG(dt, 260) + '<div style="font-size:13.5px">' + (dt.n ? "<b>" + dt.top.map((k) => k + " " + DISC[k].name).join(" · ") + "</b> — " + dt.top.map((k) => DISC[k].d).join(" ") : "") + (cr ? '<div style="margin-top:6px"><span class="tag">하루 리듬</span> <b>' + cr.label + "</b></div>" : "") + "</div>" + insightBox("energy") + "</div></div>";
      break;
    }
    case "loves": {
      h = '<div class="res-grid"><div class="stack">' + LOVE_CATS.map((c) => { const x = P.loves.cats[c.id]; return x.items.length || x.subs.length ? '<div><div class="col-h"><i class="dot" style="background:var(--c-loves)"></i>' + c.name + '</div><div class="pt-tags">' + x.items.map((i) => '<span title="' + esc(i.why || "") + '">' + esc(i.name) + "</span>").join("") + x.subs.filter((s) => !x.items.some((i) => i.name.includes(s))).map((s) => '<span style="background:transparent;color:var(--ink-3)">' + esc(s) + "</span>").join("") + "</div></div>" : ""; }).join("") +
        '</div><div class="stack"><div><div class="col-h">좋아하는 이유들</div><ul class="list-plain">' + (allLoveItems(P).filter((i) => i.why).slice(0, 10).map((i) => "<li><b style=\"min-width:110px\">" + esc(i.name) + "</b><span class=\"muted\">" + esc(cut(i.why, 70)) + "</span></li>").join("") || '<li class="muted">이유를 적으면 여기에 모여요.</li>') + "</ul></div>" + insightBox("loves") + "</div></div>";
      break;
    }
    case "thoughts": {
      const it = P.thoughts.items; const col = (k, name, color) => { const xs = it.filter((x) => x.status === k).sort((a, b) => (b.weight || 0) - (a.weight || 0)); return '<div><div class="col-h"><i class="dot" style="background:' + color + '"></i>' + name + " " + xs.length + '</div><div class="pt-tags">' + (xs.map((x) => "<span>" + esc(x.label) + (x.weight ? " " + "●".repeat(x.weight) : "") + "</span>").join("") || '<span class="muted" style="border:0;background:none">없음</span>') + "</div></div>"; };
      const un = it.filter((x) => !x.status).length;
      h = '<div class="res-grid"><div class="stack">' + col("heavy", "여전히 무겁다", "var(--signal)") + col("changed", "생각이 바뀌었다", "var(--c-values)") + col("dropped", "내려놓았다", "var(--ink-4)") + (un ? '<p class="muted" style="font-size:12.5px">아직 검토하지 않은 주제 ' + un + "개</p>" : "") + '</div><div class="stack">' + insightBox("thoughts") + "</div></div>";
      break;
    }
    case "wants": {
      const W = P.wants.items; const hz = HORIZONS.map((x) => x[0]);
      const cell = (t, z) => W.filter((w) => w.type === t && w.horizon === z).length;
      const max = Math.max(1, ...WANT_TYPES.flatMap((t) => hz.map((z) => cell(t.id, z))));
      const grid = '<div class="hm" style="grid-template-columns:110px repeat(' + hz.length + ',1fr)"><div></div>' + HORIZONS.map((x) => '<div class="hd">' + x[1] + "</div>").join("") + WANT_TYPES.map((t) => '<div class="rh">' + t.name + "</div>" + hz.map((z) => { const n = cell(t.id, z); return '<div class="cell" style="background:' + (n ? "color-mix(in srgb, var(--c-wants) " + Math.round(18 + (n / max) * 70) + "%, var(--sheet))" : "var(--sheet-2)") + ";color:" + (n / max > 0.6 ? "#fff" : "var(--ink)") + '" title="' + t.name + " · " + (HZ_BY[z][1]) + " " + n + '개">' + (n || "") + "</div>"; }).join("")).join("") + "</div>";
      const top = W.slice().sort((a, b) => (b.prio || 0) - (a.prio || 0) || (HZ_BY[a.horizon]?.[2] || 99) - (HZ_BY[b.horizon]?.[2] || 99)).slice(0, 7);
      h = '<div class="res-grid"><div class="stack"><div class="eyebrow">종류 × 시기</div>' + grid + '</div><div class="stack"><div><div class="col-h">가장 중요한 것</div><ul class="list-plain">' + top.map((w) => '<li><span class="tag" style="min-width:48px;justify-content:center">' + WT_BY[w.type].en + '</span><span style="flex:1">' + esc(w.text) + '</span><span class="mono muted" style="font-size:11px">' + (HZ_BY[w.horizon]?.[1] || "") + " ★" + (w.prio || 1) + "</span></li>").join("") + "</ul></div>" + insightBox("wants") + "</div></div>";
      break;
    }
    case "timeline": {
      h = '<div class="stack">' + ganttSVG(P, { compact: true }) + '<div class="row" style="justify-content:space-between"><span class="muted" style="font-size:12.5px">전체 공정표는 도면 LD-03에서 확대·편집할 수 있어요.</span><button class="btn" data-act="go" data-view="gantt">인생 공정표 열기' + I.arrow + "</button></div>" + insightBox("timeline") + "</div>";
      break;
    }
  }
  return '<div class="result">' + h + "</div>";
}
function comboNotes(tr) {
  const L = {}; TRAIT_ORDER.forEach((k) => (L[k] = lvl(tr[k].score)));
  const notes = [];
  if (L.C === "hi" && L.N === "lo") notes.push("계획대로 해내면서 흔들림도 적은 조합. 맡기면 끝까지 가는 사람으로 보이기 쉬워요.");
  if (L.C === "hi" && L.N === "hi") notes.push("기준이 높고 걱정도 많은 조합. 완성도를 끌어올리지만 스스로를 소진시키기 쉬워요.");
  if (L.O === "hi" && L.C === "lo") notes.push("아이디어는 많고 마무리는 힘든 조합. 떠오른 것을 붙잡아 둘 구조가 도움이 돼요.");
  if (L.O === "hi" && L.C === "hi") notes.push("상상한 것을 실제로 만들어 내는 조합. 설계자형에 가까워요.");
  if (L.E === "lo" && L.A === "hi") notes.push("조용하지만 사람을 세심하게 살피는 조합. 소수와의 깊은 관계에서 힘을 얻어요.");
  if (L.E === "hi" && L.A === "lo") notes.push("앞에 나서서 밀어붙이는 조합. 추진력은 크지만 주변의 감정을 놓칠 수 있어요.");
  if (L.E === "lo" && L.O === "hi") notes.push("혼자 깊이 파고드는 탐구자 조합. 회의보다 생각할 시간이 필요해요.");
  if (!notes.length) notes.push("어느 한쪽으로 크게 치우치지 않은 편이에요. 상황에 맞춰 모드를 바꾸는 유연함이 강점일 수 있어요.");
  return '<div><div class="col-h">조합으로 보면</div><ul class="list-plain">' + notes.map((n) => "<li>" + esc(n) + "</li>").join("") + "</ul></div>";
}

/* ============================================================ INTERVIEW · 시운전 */
function viewInterview() {
  const P = S.P, turns = S.CHAT.turns, busy = S.ui.busy.iv;
  const factById = Object.fromEntries(P.facts.map((f) => [f.id, f]));
  let log = "";
  if (!turns.length && !busy) {
    log = '<div style="margin:auto;max-width:460px;text-align:center;display:flex;flex-direction:column;gap:14px;align-items:center;padding:30px 10px">' +
      '<div class="eyebrow">Sea trial</div><h2 style="font-size:22px">빈 곳을 대화로 채웁니다</h2>' +
      '<p class="muted">Claude가 지금까지의 프로필을 읽고, 가장 비어 있거나 서로 어긋나 보이는 곳부터 한 번에 하나씩 묻습니다. 답에서 드러난 사실은 자동으로 프로필에 쌓이고, 원하지 않으면 바로 지울 수 있어요.</p>' +
      (aiAvailable() ? '<button class="btn accent" data-act="ivStart">' + I.chat + "인터뷰 시작</button>" : '<p class="banner">' + esc(S.aiOff ? aiErrMsg({ code: S.aiOff }) : "이 화면에서는 Claude 연결을 쓸 수 없어요. Claude 앱에서 열어 주세요.") + "</p>") + "</div>";
  } else {
    log = turns.map((t, ti) => {
      if (t.role === "user" && t.meta) return '<div class="muted" style="align-self:center;font-size:11.5px">— 다른 질문 요청 —</div>';
      if (t.role === "user") return '<div class="msg u"><span class="who">나 · ' + fmtTime(t.at) + '</span><div class="bub">' + esc(t.content) + "</div></div>";
      const fx = (t.facts || []).map((id) => factById[id]).filter(Boolean);
      const add = [t.added && t.added.wants ? "원하는 것 +" + t.added.wants : "", t.added && t.added.events ? "연대기 +" + t.added.events : ""].filter(Boolean).join(" · ");
      return '<div class="msg a"><span class="who">CLAUDE · ' + fmtTime(t.at) + '</span><div class="bub">' + esc(t.content) + "</div>" +
        (fx.length || add ? '<div class="facts">' + fx.map((f) => '<span class="fact-chip"><b>' + esc(AREAS[f.area] || f.area) + "</b>" + esc(f.text) + '<button data-act="factDel" data-id="' + f.id + '" aria-label="이 사실 지우기" title="지우기">×</button></span>').join("") + (add ? '<span class="tag ai">' + add + "</span>" : "") + "</div>" : "") + "</div>";
    }).join("");
    if (busy) log += '<div class="msg a"><span class="who">CLAUDE</span><div class="bub typing"><span class="spinner"></span><span id="ivElapsed">답을 생각하는 중</span></div></div>';
    if (S.ui.ivErr) log += '<div class="banner" style="align-self:stretch;align-items:center"><span style="flex:1">' + esc(S.ui.ivErr) + '</span><button class="btn sm" data-act="ivRetry">다시 보내기</button></div>';
  }
  const lastUser = turns.length && turns[turns.length - 1].role === "user";
  const inputDisabled = busy || !aiAvailable() || !turns.length;
  const chat = '<section class="sheet chat lift"><div class="chat-log" id="chatLog">' + log + '</div><div class="chat-in"><div class="row"><textarea class="input" id="ivInput" rows="2" placeholder="' + (turns.length ? "생각나는 대로 답해 주세요. Enter로 보내고 Shift+Enter로 줄을 바꿔요." : "먼저 인터뷰를 시작해 주세요.") + '" ' + (inputDisabled ? "disabled" : "") + '>' + esc(S.ui.ivDraft || "") + '</textarea><button class="btn primary" data-act="ivSend" ' + (inputDisabled ? "disabled" : "") + ' aria-label="보내기">' + I.send + '</button></div><div class="row" style="justify-content:space-between"><span class="muted" style="font-size:11.5px">' + (lastUser && !busy ? "마지막 메시지에 아직 답이 없어요." : "대화는 나만 볼 수 있게 저장돼요.") + '</span><span class="row" style="gap:6px">' + (turns.length ? '<button class="btn sm ghost" data-act="ivNewTopic">주제 바꿔 새 질문</button><button class="btn sm ghost" data-act="ivClear">대화 비우기</button>' : "") + "</span></div></div></section>";

  const gaps = gapList(P).slice(0, 6);
  const sessionFacts = P.facts.filter((f) => f.src === "interview");
  const side = '<aside class="stack"><section class="sheet side-card"><h4>인터뷰 초점</h4><div class="topics">' + TOPICS.map(([k, l]) => '<button class="chip ' + ((S.CHAT.topic || "auto") === k ? "on" : "") + '" data-act="ivTopic" data-v="' + k + '">' + l + "</button>").join("") + '</div><p class="muted" style="font-size:11.5px;margin-top:8px">초점을 바꾸면 다음 질문부터 반영돼요.</p></section>' +
    '<section class="sheet side-card"><h4>가장 비어 있는 곳</h4>' + gaps.map((g) => '<div class="gap-row"><span>' + esc(g.name) + '</span><span class="b"><i style="width:' + g.p + "%;background:" + (g.p < 30 ? "var(--signal)" : "var(--accent)") + '"></i></span><span class="v">' + g.p + "%</span></div>").join("") + "</section>" +
    '<section class="sheet side-card"><h4>인터뷰로 알게 된 것 <span class="mono muted" style="font-size:11px">' + sessionFacts.length + '</span></h4><ul class="list-plain">' + (sessionFacts.slice(-6).reverse().map((f) => '<li style="padding:7px 0;font-size:12.5px"><span class="tag">' + esc(AREAS[f.area] || f.area) + "</span><span>" + esc(f.text) + "</span></li>").join("") || '<li class="muted" style="font-size:12.5px">아직 없어요.</li>') + "</ul></section></aside>";

  return '<div class="page-head"><div><div class="eyebrow">Sea trial · 시운전</div><h1>AI 인터뷰</h1><p class="lede">여정이 뼈대라면 인터뷰는 시운전입니다. 실제로 움직여 보며 빈 곳과 어긋난 곳을 찾아요.</p></div></div><div class="iv">' + chat + side + "</div>";
}
function fmtTime(iso) { if (!iso) return ""; const d = new Date(iso); return d.getMonth() + 1 + "/" + d.getDate() + " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes()); }
function afterInterview() {
  const lg = $("#chatLog"); if (lg) lg.scrollTop = lg.scrollHeight;
  const inp = $("#ivInput"); if (inp && !inp.disabled && S.ui.focusIv) { inp.focus(); S.ui.focusIv = false; }
}
let ivTimer = null;
function ivBusy(on) {
  S.ui.busy.iv = on; clearInterval(ivTimer);
  if (on) { const t0 = Date.now(); ivTimer = setInterval(() => { const el = $("#ivElapsed"); if (el) el.textContent = "답을 생각하는 중 · " + Math.round((Date.now() - t0) / 1000) + "초"; }, 1000); }
}
async function ivRun(opening) {
  S.ui.ivErr = null; ivBusy(true); render();
  try {
    const r = await aiInterviewTurn(opening);
    const P = S.P, ids = [];
    (Array.isArray(r.facts) ? r.facts : []).forEach((f) => {
      if (!f || !f.text) return; const area = AREAS[f.area] ? f.area : "basics";
      if (P.facts.some((x) => x.text === f.text)) return;
      const id = uid("f"); P.facts.push({ id, area, text: String(f.text), src: "interview", at: nowISO() }); ids.push(id);
    });
    let nw = 0, ne = 0;
    (Array.isArray(r.wants) ? r.wants : []).forEach((w) => { if (!w || !w.text || !WT_BY[w.type]) return; P.wants.items.push({ id: uid("w"), type: w.type, text: String(w.text), horizon: HZ_BY[w.horizon] ? w.horizon : "someday", prio: 2, status: "idea", why: "", src: "AI 인터뷰" }); nw++; });
    (Array.isArray(r.events) ? r.events : []).forEach((e) => { if (!e || !e.label || !/^\d{4}(-\d{2})?$/.test(String(e.year || ""))) return; P.timeline.events.push({ id: uid("e"), lane: LANE_BY[e.lane] && e.lane !== "plan" ? e.lane : "me", label: String(e.label), s: String(e.year), e: null, kind: "milestone", est: false, src: "AI 인터뷰", note: "" }); ne++; });
    S.CHAT.turns.push({ role: "assistant", content: String(r.reply), at: nowISO(), facts: ids, added: { wants: nw, events: ne } });
    if (S.CHAT.turns.length > 120) S.CHAT.turns = S.CHAT.turns.slice(-120);
    const ivN = P.facts.filter((f) => f.src === "interview").length;
    if (ids.length && Math.floor(ivN / 5) > Math.floor((ivN - ids.length) / 5)) bumpRev("시운전 인터뷰 · 사실 " + ivN + "개");
    markDirty("chat", "profile");
    S.ui.focusIv = true;
  } catch (e) {
    S.ui.ivErr = aiErrMsg(e);
  }
  ivBusy(false); render();
}

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

/* ============================================================ DRAWINGS common + LD-01 PORTRAIT */
const DWGS = [["portrait", "LD-01", "자기 초상"], ["map", "LD-02", "살아있는 지도"], ["gantt", "LD-03", "인생 공정표"], ["metrics", "LD-04", "지표"]];
function drawingHead(active, lede) {
  const d = DWGS.find((x) => x[0] === active);
  return '<div class="page-head"><div><div class="eyebrow">Drawings · 도면 ' + d[1] + "</div><h1>" + d[2] + '</h1><p class="lede">' + lede + "</p></div></div>" +
    '<nav class="dwg-tabs" aria-label="도면">' + DWGS.map(([v, no, n]) => '<a href="#' + v + '" class="' + (v === active ? "on" : "") + '" data-act="go" data-view="' + v + '"><span class="mono">' + no + "</span>" + n + "</a>").join("") + "</nav>";
}
function drawingFoot(no, title, rev, date, drawn) {
  return '<div class="dwg-foot">' + titleBlock([["DWG NO.", no], ["TITLE", esc(title)], ["REV", rev], ["DATE", date], ["DRAWN", esc(drawn)], ["CHECKED", esc(S.P.basics.name || "본인")]]) + "</div>";
}
function sinceCount(iso) {
  if (!iso) return 0; const t = String(iso);
  const P = S.P;
  return P.facts.filter((f) => String(f.at) > t).length + S.LOG.items.filter((r) => String(r.at) > t).length + P.wants.items.filter((w) => w.src === "AI 인터뷰").length * 0;
}

function viewPortrait() {
  const P = S.P, pr = S.AI.portrait, busy = S.ui.busy.portrait, pct = overall(P);
  const b = P.basics;
  const tr = ipipScores(P), vs = valueScores(P).filter((v) => v.n), el = energyLists(P), ws = wheelStats(P);
  const hasTr = TRAIT_ORDER.some((k) => tr[k].n);
  const topWants = P.wants.items.slice().sort((a, c) => (c.prio || 0) - (a.prio || 0) || (HZ_BY[a.horizon]?.[2] || 99) - (HZ_BY[c.horizon]?.[2] || 99)).slice(0, 5);

  let bar = '<div class="dwg-bar">';
  if (busy) bar += '<span class="typing"><span class="spinner"></span>Claude가 프로필 전체를 읽고 초상을 그리는 중이에요. 1~2분 걸릴 수 있어요.</span>';
  else if (aiAvailable()) bar += '<button class="btn ' + (pr ? "" : "accent") + '" data-act="drawPortrait">' + I.spark + (pr ? "다시 그리기" : "초상 그리기") + "</button>";
  else bar += '<span class="muted" style="font-size:12.5px">' + esc(S.aiOff ? aiErrMsg({ code: S.aiOff }) : "Claude 연결이 있는 화면에서 초상을 그릴 수 있어요.") + "</span>";
  const since = pr ? sinceCount(pr.at) : 0;
  if (pr && since) bar += '<span class="tag est"><span class="rev-tri">' + pad2((pr.rev || 0) + 1) + "</span>초상 이후 새로 쌓인 기록·사실 " + since + "개</span>";
  bar += '<span class="muted" style="font-size:12px;margin-left:auto">자기 이해 공정률 ' + pct + "% · 채울수록 정확해져요</span></div>";

  const headName = '<div class="pt-name">' + esc(hullNo(P)) + " · " + esc(b.name || "이름 없음") + (b.birthYear ? " · " + b.birthYear : "") + (b.region ? " · " + esc(b.region) : "") + (b.job ? " · " + esc(b.job) : "") + "</div>";
  const head = pr ? '<div class="pt-head">' + headName + '<div class="pt-arche">' + esc(pr.archetype) + '</div><div class="pt-line">' + esc(pr.headline || "") + "</div></div>"
    : '<div class="pt-head">' + headName + '<div class="pt-arche" style="color:var(--ink-4)">아직 이름 붙지 않은 초상</div><div class="pt-line">지금까지 쌓인 응답으로 뼈대만 그렸어요. "초상 그리기"를 누르면 Claude가 전체를 읽고 한 문장과 이름을 붙입니다.</div></div>';
  const sec = (t, body) => '<section class="pt-sec"><h5>' + t + "</h5>" + body + "</section>";
  const list = (xs, cls) => '<ul class="pt-list ' + (cls || "") + '">' + xs.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>";

  let left = "";
  if (pr) {
    left += sec("ESSENCE · 본질", '<p class="pt-essence">' + esc(pr.essence || "") + "</p>");
    if ((pr.strengths || []).length) left += sec("STRENGTHS · 강점", list(pr.strengths));
    if ((pr.shadows || []).length) left += sec("WATCH · 주의할 패턴", list(pr.shadows, "shadow"));
    if ((pr.drives || []).length) left += sec("DRIVES · 나를 움직이는 것", '<div class="pt-tags">' + pr.drives.map((x) => "<span>" + esc(x) + "</span>").join("") + "</div>");
    if (pr.nowFocus) left += sec("NOW · 지금 돌봐야 할 것", '<p style="font-size:15px;line-height:1.7">' + esc(pr.nowFocus) + "</p>");
    if (pr.question) left += '<div class="pt-q" style="margin-top:8px">' + esc(pr.question) + "</div>";
    if (pr.gaps) left += '<p class="muted" style="font-size:12px">근거가 약한 부분 · ' + esc(pr.gaps) + "</p>";
  } else {
    left += sec("ESSENCE · 본질", '<p class="muted">초상을 그리면 성격·가치·에너지·원하는 것이 어떻게 맞물리는지 서너 문장으로 정리돼요.</p>');
    const facts = P.facts.filter((f) => f.area === "traits").slice(0, 4).map((f) => f.text);
    if (facts.length) left += sec("SELF-NOTES · 스스로 적은 나", list(facts));
    const heavy = P.thoughts.items.filter((x) => x.status === "heavy").map((x) => x.label);
    if (heavy.length) left += sec("CARGO · 마음을 차지하는 주제", '<div class="pt-tags">' + heavy.map((x) => "<span>" + esc(x) + "</span>").join("") + "</div>");
  }
  let right = "";
  right += sec("TRAITS · 성격", hasTr ? traitRows(tr, false) : '<p class="muted" style="font-size:13px">CH.02를 마치면 채워져요.</p>');
  right += sec("VALUES · 가치 순위", vs.length ? '<div class="vrank">' + vs.slice(0, 5).map((v, i) => '<div class="vrow' + (i < 3 ? " top" : "") + '"><span class="i">' + pad2(i + 1) + '</span><span class="nm">' + VAL_BY[v.id].name + '</span><span class="b"><i style="width:' + v.score * 100 + '%"></i></span><span class="v">' + v.wins + "/" + v.n + "</span></div>").join("") + "</div>"
    : P.prior && P.prior.valuesTop3 ? '<div class="pt-tags">' + P.prior.valuesTop3.map((id) => "<span>" + VAL_BY[id]?.name + "</span>").join("") + '</div><p class="muted" style="font-size:12px">직접 고른 Top 3 · CH.03을 마치면 순위가 생겨요</p>' : '<p class="muted" style="font-size:13px">CH.03을 마치면 채워져요.</p>');
  right += sec("ENERGY · 충전과 방전", el.c.length || el.d.length ? '<div class="pt-ener"><div><b><i class="dot" style="background:var(--c-energy)"></i>충전</b>' + (el.c.slice(0, 5).map((a) => esc(a.t)).join("<br>") || "-") + '</div><div><b><i class="dot" style="background:var(--crit)"></i>방전</b>' + (el.d.slice(0, 5).map((a) => esc(a.t)).join("<br>") || "-") + "</div></div>" : '<p class="muted" style="font-size:13px">CH.04를 마치면 채워져요.</p>');
  const dna = pr && (pr.tasteDNA || []).length ? pr.tasteDNA : [];
  right += sec("TASTE · 취향", (dna.length ? '<div class="pt-tags" style="margin-bottom:8px">' + dna.map((x) => '<span style="background:var(--sheet);border-color:var(--ink-4);font-weight:600">' + esc(x) + "</span>").join("") + "</div>" : "") + '<div class="pt-tags">' + allLoveItems(P).filter((i) => i.why).slice(0, 10).map((i) => "<span>" + esc(i.name) + "</span>").join("") + "</div>");
  right += sec("BALANCE · 지금의 균형", ws.some((w) => w.sat != null) ? radarSVG(ws.map((w) => ({ label: w.name })), [{ name: "만족도", color: "var(--c-values)", vals: ws.map((w) => w.sat) }], { size: 250, pad: 40, fs: 11 }) : '<p class="muted" style="font-size:13px">CH.01을 마치면 채워져요.</p>');
  right += sec("HEADING · 원하는 것", '<ul class="pt-list">' + topWants.map((w) => "<li><span><b>" + esc(w.text) + '</b> <span class="muted" style="font-size:12px">' + WT_BY[w.type].en + " · " + (HZ_BY[w.horizon]?.[1] || "") + "</span></span></li>").join("") + "</ul>");

  return drawingHead("portrait", "한 사람을 한 장으로. 응답과 기록 전체를 Claude가 읽고 이름과 문장을 붙입니다. 아래의 수치와 목록은 당신의 응답에서 바로 계산돼요.") + bar +
    '<article class="drawing"><div class="pt">' + head + '<div class="stack" style="gap:22px">' + left + '</div><div class="stack" style="gap:22px">' + right + "</div></div>" +
    drawingFoot("LD-01", "자기 초상", pr ? "REV." + pad2(pr.rev || 0) : "—", pr ? fmtDot(pr.at) : fmtDot(nowISO()), pr ? "Claude" : "자동 계산") + "</article>";
}

/* ============================================================ LD-02 LIVING MAP */
function shortAct(t) { return t.replace(/\s*\(.*?\)\s*/g, "").trim(); }
function buildGraph(P) {
  const nodes = [], links = [];
  const me = { id: "me", label: P.basics.nick || P.basics.name || "나", kind: "center", dom: null };
  nodes.push(me);
  DOMAINS.forEach((d) => { nodes.push({ id: "h_" + d.id, label: d.name, kind: "hub", dom: d.id }); links.push({ s: "me", t: "h_" + d.id, k: "hub" }); });
  const leaf = (dom, id, label, detail, w) => { nodes.push({ id, label, detail: detail || "", kind: "leaf", dom, w: w || 1 }); links.push({ s: "h_" + dom, t: id, k: "leaf" }); };
  // values
  const vs = valueScores(P).filter((v) => v.n);
  if (vs.length) vs.slice(0, 5).forEach((v, i) => leaf("values", "v_" + v.id, VAL_BY[v.id].name, VAL_BY[v.id].d + " · 순위 " + (i + 1), 3 - Math.min(2, i)));
  else ((P.prior && P.prior.valuesTop3) || []).forEach((id) => leaf("values", "v_" + id, VAL_BY[id].name, VAL_BY[id].d + " · 직접 고른 가치", 2));
  // traits
  const tr = ipipScores(P);
  TRAIT_ORDER.forEach((k) => { const s = tr[k].score; if (s == null) return; const L2 = lvl(s); if (L2 === "mid") return; leaf("traits", "t_" + k, TRAITS[k].name + " " + LVL_KO[L2], TRAITS[k].d[L2], 2); });
  // energy
  energyLists(P).c.slice(0, 7).forEach((a) => leaf("energy", "e_" + a.id, shortAct(a.t), "하고 나면 충전되는 활동", 2));
  const dt = discTally(P); if (dt.n) leaf("energy", "e_disc", "일하는 방식: " + dt.top.map((k) => DISC[k].name).join("·"), dt.top.map((k) => DISC[k].d).join(" "), 2);
  if (P.energy.flowChild) leaf("energy", "e_flowchild", "어릴 적 몰입", P.energy.flowChild, 1);
  // loves
  allLoveItems(P).sort((a, b) => (b.why ? 1 : 0) - (a.why ? 1 : 0)).slice(0, 16).forEach((it) => leaf("loves", "l_" + it.id, it.name, it.why || LOVE_CATS.find((c) => c.id === it.cat).name, it.why ? 2 : 1));
  // thoughts
  P.thoughts.items.filter((x) => x.status !== "dropped").sort((a, b) => (b.weight || (b.status === "heavy" ? 2 : 0) || (b.memo ? 1 : 0)) - (a.weight || (a.status === "heavy" ? 2 : 0) || (a.memo ? 1 : 0))).slice(0, 12)
    .forEach((x) => leaf("thoughts", "th_" + x.id, x.label, x.now || x.memo || (x.links || []).join(", "), x.weight || (x.status === "heavy" ? 3 : 1)));
  // wants
  P.wants.items.filter((w) => w.status !== "done").sort((a, b) => (b.prio || 0) - (a.prio || 0)).slice(0, 12).forEach((w) => leaf("wants", "w_" + w.id, cut(w.text, 16), WT_BY[w.type].name + " · " + (HZ_BY[w.horizon]?.[1] || "") + (w.why ? " · " + w.why : ""), w.prio || 1));
  // life: wheel focus + family
  wheelStats(P).filter((w) => w.gap != null && w.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 3).forEach((w) => leaf("life", "lf_" + w.id, w.name + "(손볼 곳)", "중요도 " + w.imp + "/5, 만족도 " + w.sat + "/10" + (w.note ? " · " + w.note : ""), 2));
  if (P.basics.family) leaf("life", "lf_family", "가족", P.basics.family, 2);
  if (P.basics.job) leaf("life", "lf_job", cut(P.basics.job, 14), P.basics.career || P.basics.job, 2);
  // AI overlays
  const ids = new Set(nodes.map((n) => n.id));
  const ai = S.AI.map;
  if (ai) {
    (ai.themes || []).forEach((t, i) => {
      const mem = t.members.filter((m) => ids.has(m)); if (!mem.length) return;
      const id = "theme_" + i; nodes.push({ id, label: t.name, detail: t.desc, kind: "theme", dom: null });
      mem.forEach((m) => links.push({ s: id, t: m, k: "theme" }));
    });
    (ai.links || []).forEach((l) => { if (ids.has(l.a) && ids.has(l.b)) links.push({ s: l.a, t: l.b, k: "ai", why: l.why }); });
  }
  return { nodes, links };
}

let d3Loading = null;
function ensureD3() {
  if (window.d3) return Promise.resolve(window.d3);
  if (d3Loading) return d3Loading;
  const srcs = ["https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js", "https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"];
  d3Loading = new Promise((res, rej) => {
    const tryLoad = (k) => {
      if (k >= srcs.length) { d3Loading = null; rej(new Error("d3")); return; }
      const s = document.createElement("script"); s.src = srcs[k]; s.async = true;
      s.onload = () => (window.d3 ? res(window.d3) : tryLoad(k + 1)); s.onerror = () => tryLoad(k + 1);
      document.head.appendChild(s);
    };
    tryLoad(0);
  });
  return d3Loading;
}

function viewMap() {
  const P = S.P, g = buildGraph(P), ai = S.AI.map, busy = S.ui.busy.map;
  const leafN = g.nodes.filter((n) => n.kind === "leaf").length;
  let bar = '<div class="dwg-bar"><div class="map-legend">' + DOMAINS.map((d) => { const n = g.nodes.filter((x) => x.dom === d.id && x.kind === "leaf").length; return '<button class="chip ' + (S.ui.mapHide[d.id] ? "" : "on") + '" data-act="mapToggle" data-v="' + d.id + '" style="' + (S.ui.mapHide[d.id] ? "" : "border-color:" + d.color + ";color:var(--ink);background:var(--sheet)") + '"><i class="dot" style="background:' + d.color + '"></i>' + d.name + " " + n + "</button>"; }).join("") + "</div>";
  bar += '<span style="margin-left:auto" class="row">';
  if (busy) bar += '<span class="typing"><span class="spinner"></span>Claude가 숨은 연결을 찾는 중이에요. 1분 정도 걸려요.</span>';
  else if (aiAvailable()) bar += '<button class="btn ' + (ai ? "" : "accent") + '" data-act="drawMap">' + I.spark + (ai ? "다시 해석" : "지도 해석하기") + "</button>";
  bar += "</span></div>";
  const themes = ai && ai.themes.length ? '<div class="row" style="justify-content:space-between;margin:20px 0 10px"><h3 style="font-size:15px">Claude가 찾은 주제</h3><span class="mono muted" style="font-size:11px">' + fmtDot(ai.at) + " · REV." + pad2(ai.rev || 0) + '</span></div><div class="themes">' + ai.themes.map((t, i) => '<button class="theme" style="text-align:left" data-act="mapSel" data-id="theme_' + i + '"><b>' + esc(t.name) + "</b><p>" + esc(t.desc) + '</p><span class="mono muted" style="font-size:10.5px">' + t.members.length + "개 노드</span></button>").join("") + "</div>" :
    '<p class="muted" style="margin-top:14px;font-size:13px">' + (aiAvailable() ? '"지도 해석하기"를 누르면 서로 다른 영역 사이의 숨은 연결과 3~5개의 주제를 찾아 지도 위에 겹쳐 그려요.' : "지금은 영역별 연결만 보여요. Claude 연결이 있는 화면에서 숨은 연결을 찾을 수 있어요.") + "</p>";
  const tbl = '<details class="tbl"><summary>표로 보기 (노드 ' + g.nodes.length + " · 연결 " + g.links.length + ')</summary><table><thead><tr><th>영역</th><th>노드</th><th>설명</th></tr></thead><tbody>' + g.nodes.filter((n) => n.kind === "leaf").map((n) => "<tr><td>" + esc(DOM_BY[n.dom].name) + "</td><td>" + esc(n.label) + "</td><td>" + esc(cut(n.detail, 80)) + "</td></tr>").join("") + "</tbody></table>" +
    (ai && ai.links.length ? '<table style="margin-top:10px"><thead><tr><th>연결</th><th>이유</th></tr></thead><tbody>' + ai.links.map((l) => { const a = g.nodes.find((n) => n.id === l.a), c = g.nodes.find((n) => n.id === l.b); return a && c ? "<tr><td>" + esc(a.label) + " ↔ " + esc(c.label) + "</td><td>" + esc(l.why) + "</td></tr>" : ""; }).join("") + "</tbody></table>" : "") + "</details>";
  return drawingHead("map", "성격·가치·에너지·취향·마음속 주제·원하는 것을 하나의 지도에. 노드를 끌거나 눌러 보세요. 가운데의 나에서 가까울수록 자주 연결된 것들이에요.") + bar +
    '<div class="map-wrap" id="mapWrap"><svg id="mapSvg" aria-label="관계 지도 (노드 ' + leafN + '개)"></svg><div class="map-side" id="mapSide" hidden></div><div id="mapMsg" class="empty" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">지도 엔진을 불러오는 중…</div></div>' + themes + tbl +
    '<div class="dwg-foot">' + titleBlock([["DWG NO.", "LD-02"], ["TITLE", "살아있는 지도"], ["REV", ai ? "REV." + pad2(ai.rev || 0) : "—"], ["NODES", String(leafN)], ["LINKS", String(ai ? ai.links.length : 0) + " AI"], ["SCALE", "FREE"]]) + "</div>";
}

let mapSim = null;
function afterMap() {
  ensureD3().then((d3) => drawMapD3(d3)).catch(() => { const m = $("#mapMsg"); if (m) m.textContent = "지도 엔진(d3)을 불러오지 못했어요. 네트워크를 확인한 뒤 새로고침해 주세요. 아래 표로도 볼 수 있어요."; });
}
function drawMapD3(d3) {
  const svgEl = $("#mapSvg"); if (!svgEl) return;
  const msg = $("#mapMsg"); if (msg) msg.remove();
  if (mapSim) { mapSim.stop(); mapSim = null; }
  const P = S.P, G = buildGraph(P);
  const hidden = S.ui.mapHide;
  const nodes = G.nodes.filter((n) => !(n.dom && hidden[n.dom])).map((n) => Object.assign({}, n));
  const nid = new Set(nodes.map((n) => n.id));
  const links = G.links.filter((l) => nid.has(l.s) && nid.has(l.t)).map((l) => ({ source: l.s, target: l.t, k: l.k, why: l.why }));
  // drop theme nodes that lost all members
  const W = svgEl.clientWidth || 900, H = svgEl.clientHeight || 640;
  const color = (n) => (n.kind === "center" ? cssVar("--ink") : n.kind === "theme" ? cssVar("--signal") : cssVar(DOM_BY[n.dom].color.slice(4, -1)));
  const R = (n) => (n.kind === "center" ? 18 : n.kind === "hub" ? 11 : n.kind === "theme" ? 8 : 4 + (n.w || 1) * 1.4);
  const hubAngle = {}; DOMAINS.forEach((d, i) => (hubAngle["h_" + d.id] = -Math.PI / 2 + (i * 2 * Math.PI) / DOMAINS.length));
  nodes.forEach((n) => {
    if (n.kind === "center") { n.fx = W / 2; n.fy = H / 2; }
    else if (n.kind === "hub") { n.x = W / 2 + Math.cos(hubAngle[n.id]) * 150; n.y = H / 2 + Math.sin(hubAngle[n.id]) * 130; }
    else if (n.dom) { const a = hubAngle["h_" + n.dom] + (Math.random() - 0.5) * 0.8; n.x = W / 2 + Math.cos(a) * 260; n.y = H / 2 + Math.sin(a) * 220; }
  });
  const svg = d3.select(svgEl); svg.selectAll("*").remove();
  const root = svg.append("g");
  const link = root.append("g").selectAll("line").data(links).join("line")
    .attr("stroke", (l) => (l.k === "ai" ? cssVar("--signal") : l.k === "theme" ? cssVar("--signal") : cssVar("--rule")))
    .attr("stroke-opacity", (l) => (l.k === "ai" ? 0.38 : l.k === "theme" ? 0.22 : 1))
    .attr("stroke-width", (l) => (l.k === "ai" ? 1.2 : l.k === "hub" ? 1.5 : 1))
    .attr("stroke-dasharray", (l) => (l.k === "theme" ? "3 4" : null));
  const node = root.append("g").selectAll("g").data(nodes).join("g").attr("class", "nd").style("cursor", "pointer");
  node.each(function (n) {
    const g = d3.select(this);
    if (n.kind === "theme") g.append("rect").attr("x", -7).attr("y", -7).attr("width", 14).attr("height", 14).attr("transform", "rotate(45)").attr("fill", cssVar("--sheet")).attr("stroke", color(n)).attr("stroke-width", 2);
    else g.append("circle").attr("r", R(n)).attr("fill", color(n)).attr("stroke", cssVar("--sheet-2")).attr("stroke-width", 2);
    g.append("circle").attr("r", Math.max(12, R(n) + 6)).attr("fill", "transparent");
    g.append("text").attr("class", "node-label" + (n.kind === "hub" || n.kind === "center" ? " hub" : "") + (n.kind === "theme" ? " theme-l" : ""))
      .attr("x", n.kind === "center" ? 0 : R(n) + 5).attr("y", n.kind === "center" ? 34 : 4).attr("text-anchor", n.kind === "center" ? "middle" : "start").text(n.label);
  });
  const nb = {}; links.forEach((l) => { (nb[l.source] = nb[l.source] || new Set()).add(l.target); (nb[l.target] = nb[l.target] || new Set()).add(l.source); });
  const focus = (id) => {
    if (!id) { node.style("opacity", 1); link.style("opacity", 1).attr("stroke-opacity", (l) => (l.k === "ai" ? 0.38 : l.k === "theme" ? 0.22 : 1)); return; }
    const set = nb[id] || new Set();
    node.style("opacity", (n) => (n.id === id || set.has(n.id) ? 1 : 0.18));
    link.style("opacity", (l) => { const s = l.source.id || l.source, t = l.target.id || l.target; return s === id || t === id ? 1 : 0.08; })
      .attr("stroke-opacity", (l) => { const s = l.source.id || l.source, t = l.target.id || l.target; return (s === id || t === id) && l.k === "ai" ? 0.95 : l.k === "ai" ? 0.38 : l.k === "theme" ? 0.22 : 1; });
  };
  node.on("mouseenter", (ev, n) => { if (!S.ui.mapSel) focus(n.id); }).on("mouseleave", () => { if (!S.ui.mapSel) focus(null); })
    .on("click", (ev, n) => { ev.stopPropagation(); S.ui.mapSel = n.id; focus(n.id); showMapSide(n, links, nodes); });
  svg.on("click", () => { S.ui.mapSel = null; focus(null); const s = $("#mapSide"); if (s) s.hidden = true; });
  node.call(d3.drag().on("start", (ev, n) => { if (!ev.active) sim.alphaTarget(0.2).restart(); n.fx = n.x; n.fy = n.y; })
    .on("drag", (ev, n) => { n.fx = ev.x; n.fy = ev.y; })
    .on("end", (ev, n) => { if (!ev.active) sim.alphaTarget(0); if (n.kind !== "center") { n.fx = null; n.fy = null; } }));
  const sim = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((n) => n.id).distance((l) => (l.k === "hub" ? 230 : l.k === "leaf" ? 80 : l.k === "theme" ? 120 : 200)).strength((l) => (l.k === "hub" ? 0.9 : l.k === "leaf" ? 0.8 : l.k === "theme" ? 0.05 : 0.02)))
    .force("charge", d3.forceManyBody().strength((n) => (n.kind === "hub" ? -900 : n.kind === "theme" ? -260 : -170)).distanceMax(420))
    .force("collide", d3.forceCollide().radius((n) => R(n) + (n.kind === "center" ? 30 : Math.min(62, 10 + n.label.length * 4.2))).strength(0.9))
    .force("x", d3.forceX(W / 2).strength(0.02)).force("y", d3.forceY(H / 2).strength(0.03));
  mapSim = sim;
  const tick = () => {
    link.attr("x1", (l) => l.source.x).attr("y1", (l) => l.source.y).attr("x2", (l) => l.target.x).attr("y2", (l) => l.target.y);
    node.attr("transform", (n) => "translate(" + n.x + "," + n.y + ")");
  };
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  sim.stop(); for (let i = 0; i < 320; i++) sim.tick(); tick();
  // fit everything into view
  const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y);
  const bx0 = Math.min(...xs) - 30, bx1 = Math.max(...xs) + 150, by0 = Math.min(...ys) - 30, by1 = Math.max(...ys) + 40;
  const k = Math.min(1.2, W / (bx1 - bx0), H / (by1 - by0));
  const zoom = d3.zoom().scaleExtent([0.3, 3]).on("zoom", (ev) => root.attr("transform", ev.transform));
  svg.call(zoom).call(zoom.transform, d3.zoomIdentity.translate(W / 2 - ((bx0 + bx1) / 2) * k, H / 2 - ((by0 + by1) / 2) * k).scale(k));
  if (!reduce) { sim.alpha(0.08).restart(); sim.on("tick", tick); }
  if (S.ui.mapSel) { const n = nodes.find((x) => x.id === S.ui.mapSel); if (n) { focus(n.id); showMapSide(n, links, nodes); } else S.ui.mapSel = null; }
}
function showMapSide(n, links, nodes) {
  const side = $("#mapSide"); if (!side) return;
  const byId = Object.fromEntries(nodes.map((x) => [x.id, x]));
  const rel = links.filter((l) => l.k === "ai" && ((l.source.id || l.source) === n.id || (l.target.id || l.target) === n.id)).map((l) => { const o = byId[(l.source.id || l.source) === n.id ? (l.target.id || l.target) : (l.source.id || l.source)]; return o ? "<div><b>↔ " + esc(o.label) + "</b><br>" + esc(l.why || "") + "</div>" : ""; }).join("");
  const members = n.kind === "theme" ? links.filter((l) => (l.source.id || l.source) === n.id).map((l) => byId[l.target.id || l.target]).filter(Boolean) : [];
  const dom = n.dom ? DOM_BY[n.dom] : null;
  side.innerHTML = '<div class="row" style="justify-content:space-between"><span class="k">' + (n.kind === "theme" ? "THEME · 주제" : n.kind === "hub" ? "DOMAIN · 영역" : n.kind === "center" ? "CENTER" : esc(dom ? dom.name : "")) + '</span><button class="btn sm ghost" data-act="mapClose" aria-label="닫기">×</button></div><h4>' + esc(n.label) + "</h4>" + (n.detail ? '<p style="font-size:13px;color:var(--ink-2)">' + esc(n.detail) + "</p>" : "") +
    (members.length ? '<div class="pt-tags">' + members.map((m) => "<span>" + esc(m.label) + "</span>").join("") + "</div>" : "") +
    (rel ? '<div class="k" style="margin-top:4px">숨은 연결</div><div class="rel">' + rel + "</div>" : n.kind === "leaf" && S.AI.map ? '<p class="muted" style="font-size:12px">다른 영역과 연결되지 않았어요.</p>' : "");
  side.hidden = false;
}

/* ============================================================ LD-03 LIFE GANTT */
function wantYear(w) { const h = HZ_BY[w.horizon]; if (!h || h[2] == null) return null; return new Date().getFullYear() + h[2]; }
function ganttRows(P, compact) {
  const rows = [];
  ["me", "family", "work", "home"].forEach((ln) => {
    const evs = P.timeline.events.filter((e) => e.lane === ln && e.s).sort((a, b) => ym2num(a.s) - ym2num(b.s));
    if (!evs.length) return;
    rows.push({ t: "lane", lane: ln });
    evs.forEach((e, i) => rows.push({ t: "ev", ev: e, code: LANE_BY[ln].code.replace(".0", "") + "." + (i + 1) }));
  });
  let ws = P.wants.items.filter((w) => wantYear(w) && w.status !== "done");
  ws.sort((a, b) => wantYear(a) - wantYear(b) || (b.prio || 0) - (a.prio || 0));
  if (compact) ws = ws.filter((w) => (w.prio || 0) >= 2).slice(0, 8);
  else if (!S.ui.ganttAllWants) ws = ws.filter((w) => (w.prio || 0) >= 2);
  if (ws.length) {
    rows.push({ t: "lane", lane: "plan" });
    ws.forEach((w, i) => rows.push({ t: "want", w, code: "5." + (i + 1) }));
  }
  return rows;
}
function ganttRange(P, key) {
  const now = nowYear(); const evYears = P.timeline.events.map((e) => ym2num(e.s)).filter((v) => v);
  const by = P.basics.birthYear || (evYears.length ? Math.floor(Math.min(...evYears)) : Math.floor(now) - 40);
  if (key === "past") return [Math.floor(now) - 22, Math.floor(now) + 3];
  if (key === "next") return [Math.floor(now) - 2, Math.floor(now) + 23];
  return [by, by + 100];
}
function ganttSVG(P, o) {
  o = o || {}; const compact = !!o.compact;
  const [x0, x1] = ganttRange(P, compact ? "all" : S.ui.ganttRange);
  const rows = ganttRows(P, compact);
  if (!rows.length) return '<div class="empty">이정표가 아직 없어요.</div>';
  const LW = compact ? 190 : 250, PW = compact ? 620 : 900, W = LW + PW + 24, RH = compact ? 22 : 27, HH = 46;
  const H = HH + rows.length * RH + 10;
  const X = (v) => LW + ((clamp(v, x0, x1) - x0) / (x1 - x0)) * PW;
  const span = x1 - x0, step = span > 60 ? 10 : 5;
  const by = P.basics.birthYear;
  let g = "";
  // lane backgrounds
  rows.forEach((r, i) => { if (r.t === "lane") g += '<rect x="0" y="' + (HH + i * RH) + '" width="' + W + '" height="' + RH + '" ' + st({ fill: "var(--sheet-2)" }) + "/>"; });
  // grid + header
  for (let y = Math.ceil(x0 / step) * step; y <= x1; y += step) {
    const x = X(y);
    g += '<line x1="' + x + '" x2="' + x + '" y1="' + (HH - 6) + '" y2="' + (H - 6) + '" ' + st({ stroke: "var(--rule-2)" }) + "/>";
    g += '<text x="' + x + '" y="16" text-anchor="middle" class="tick" ' + st({ fill: "var(--ink-2)" }) + ">" + y + "</text>";
    if (by) g += '<text x="' + x + '" y="32" text-anchor="middle" class="tick">' + (y - by) + "세</text>";
  }
  if (!compact && step === 5) for (let y = Math.ceil(x0); y <= x1; y++) if (y % 5) g += '<line x1="' + X(y) + '" x2="' + X(y) + '" y1="' + (HH - 3) + '" y2="' + HH + '" ' + st({ stroke: "var(--rule)" }) + "/>";
  g += '<line x1="0" x2="' + W + '" y1="' + HH + '" y2="' + HH + '" ' + st({ stroke: "var(--rule)" }) + "/>";
  g += '<text x="10" y="16" class="tick">WBS</text><text x="46" y="16" class="tick">항목</text>' + (by ? '<text x="10" y="32" class="tick">나이(만)</text>' : "");
  const now = nowYear();
  rows.forEach((r, i) => {
    const y = HH + i * RH, cy = y + RH / 2;
    if (r.t === "lane") {
      const L = LANE_BY[r.lane];
      g += '<text x="10" y="' + (cy + 4) + '" class="tick" ' + st({ fill: "var(--ink)", "font-weight": "600" }) + ">" + L.code + '</text><text x="46" y="' + (cy + 4) + '" ' + st({ fill: "var(--ink)", "font-size": "12.5px", "font-weight": "700" }) + ">" + esc(L.name) + "</text>";
      return;
    }
    g += '<line x1="0" x2="' + W + '" y1="' + (y + RH) + '" y2="' + (y + RH) + '" ' + st({ stroke: "var(--rule-2)" }) + "/>";
    if (r.t === "ev") {
      const e = r.ev, a = ym2num(e.s), b2 = ym2num(e.e), lab = cut(e.label, compact ? 14 : 22);
      const tip = e.label + " · " + fmtYM(e.s) + (e.e ? " ~ " + fmtYM(e.e) : "") + (e.est ? " (추정)" : "") + (e.note ? " · " + e.note : "");
      g += '<g data-act="evEdit" data-id="' + e.id + '" style="cursor:pointer"><rect x="0" y="' + y + '" width="' + W + '" height="' + RH + '" fill="transparent"/>';
      g += '<text x="10" y="' + (cy + 4) + '" class="tick">' + r.code + '</text><text x="46" y="' + (cy + 4) + '" ' + st({ fill: e.est ? "var(--ink-3)" : "var(--ink)", "font-size": "12px" }) + ">" + esc(lab) + (e.est ? " ·추정" : "") + "</text>";
      if (a != null && a <= x1 && (b2 || a) >= x0) {
        if (b2) {
          const fut = a > now; const xa = X(a), xb = Math.max(X(b2), xa + 3);
          g += '<rect x="' + xa.toFixed(1) + '" y="' + (cy - 6) + '" width="' + (xb - xa).toFixed(1) + '" height="12" rx="3" ' + st(fut ? { fill: "var(--accent-2)", stroke: "var(--accent)", "stroke-width": "1.2" } : { fill: "var(--accent)", opacity: e.est ? ".45" : "1" }) + "><title>" + esc(tip) + "</title></rect>";
          if (!fut && b2 > now && a < now) g += '<rect x="' + X(now).toFixed(1) + '" y="' + (cy - 6) + '" width="' + (xb - X(now)).toFixed(1) + '" height="12" ' + st({ fill: "var(--accent-2)", stroke: "var(--accent)", "stroke-width": "1.2" }) + "/>";
        } else {
          const x = X(a), fut = a > now;
          g += '<rect x="' + (x - 5).toFixed(1) + '" y="' + (cy - 5) + '" width="10" height="10" transform="rotate(45 ' + x.toFixed(1) + " " + cy + ')" ' + st(fut ? { fill: "var(--sheet)", stroke: "var(--signal)", "stroke-width": "1.6" } : { fill: e.est ? "var(--ink-4)" : "var(--ink)", stroke: "var(--sheet)", "stroke-width": "1.5" }) + "><title>" + esc(tip) + "</title></rect>";
        }
      }
      g += "</g>";
    } else if (r.t === "want") {
      const w = r.w, yv = wantYear(w), x = X(yv + 0.5), lab = cut(w.text, compact ? 14 : 24);
      const tip = w.text + " · " + WT_BY[w.type].name + " · " + (HZ_BY[w.horizon]?.[1] || "") + " (" + yv + ") · ★" + (w.prio || 1) + " · " + (WS_BY[w.status] || "");
      g += '<text x="10" y="' + (cy + 4) + '" class="tick">' + r.code + '</text><text x="46" y="' + (cy + 4) + '" ' + st({ fill: "var(--ink)", "font-size": "12px" }) + ">" + esc(lab) + "</text>";
      const xs = X(now);
      if (w.status === "doing" || w.status === "plan") g += '<line x1="' + xs + '" x2="' + x + '" y1="' + cy + '" y2="' + cy + '" ' + st({ stroke: "var(--c-wants)", "stroke-width": "2", "stroke-opacity": ".5" }) + "/>";
      const filled = w.status === "doing";
      g += '<rect x="' + (x - 5).toFixed(1) + '" y="' + (cy - 5) + '" width="10" height="10" transform="rotate(45 ' + x.toFixed(1) + " " + cy + ')" ' + st({ fill: filled ? "var(--c-wants)" : "var(--sheet)", stroke: "var(--c-wants)", "stroke-width": "1.8" }) + "><title>" + esc(tip) + "</title></rect>";
    }
  });
  if (now >= x0 && now <= x1) {
    const x = X(now);
    g += '<line x1="' + x + '" x2="' + x + '" y1="' + (HH - 2) + '" y2="' + (H - 6) + '" ' + st({ stroke: "var(--signal)", "stroke-width": "1.6" }) + "/>";
    const lab = "오늘 " + curYM().replace("-", ".") + (by ? " · " + (new Date().getFullYear() - by) + "세" : "");
    const lw = lab.length * 6.4 + 12;
    g += '<rect x="' + (x - lw / 2) + '" y="' + (HH - 12) + '" width="' + lw + '" height="15" rx="3" ' + st({ fill: "var(--signal)" }) + '/><text x="' + x + '" y="' + (HH - 1.5) + '" text-anchor="middle" ' + st({ fill: "#fff", "font-size": "10px", "font-weight": "600", "font-family": "var(--f-mono)" }) + ">" + esc(lab) + "</text>";
  }
  return '<div class="gantt-shell"><div class="gantt-scroll"><svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '" style="min-width:' + W + 'px;display:block" role="img" aria-label="인생 공정표">' + g + "</svg></div></div>";
}

function viewGantt() {
  const P = S.P, rng = S.ui.ganttRange;
  const undated = P.timeline.events.filter((e) => !e.s);
  const ed = S.ui.editEvent ? P.timeline.events.find((e) => e.id === S.ui.editEvent) : null;
  let edit = "";
  if (ed) {
    const i = P.timeline.events.indexOf(ed);
    edit = '<section class="sheet pad" style="margin-bottom:14px;border-color:var(--accent)"><div class="row" style="justify-content:space-between;margin-bottom:10px"><b>이정표 편집</b><span class="row" style="gap:6px"><button class="btn sm ghost" data-act="evDel" data-i="' + i + '">' + I.trash + '삭제</button><button class="btn sm primary" data-act="evEditClose">완료</button></span></div><div class="g-edit">' +
      '<div class="field"><label>구분</label><select class="input" data-bind="P.timeline.events.' + i + '.lane" data-rerender="1">' + LANES.filter((l) => l.id !== "plan").map((l) => '<option value="' + l.id + '"' + (ed.lane === l.id ? " selected" : "") + ">" + l.name + "</option>").join("") + '</select></div>' +
      '<div class="field" style="grid-column:span 2"><label>이름</label><input class="input" data-bind="P.timeline.events.' + i + '.label" data-rerender="1" value="' + esc(ed.label) + '"></div>' +
      '<div class="field"><label>시작 (YYYY-MM)</label><input class="input mono" data-bind="P.timeline.events.' + i + '.s" data-ym="1" data-rerender="1" value="' + esc(ed.s || "") + '"></div>' +
      '<div class="field"><label>끝 (기간이면)</label><input class="input mono" data-bind="P.timeline.events.' + i + '.e" data-ym="1" data-rerender="1" value="' + esc(ed.e || "") + '"></div>' +
      '<div class="field"><label>상태</label>' + (ed.est ? '<button class="btn" data-act="evOk" data-i="' + i + '">추정 → 확정</button>' : '<span class="tag" style="padding:8px">확정</span>') + "</div>" +
      '<div class="field" style="grid-column:1/-1"><label>메모</label><input class="input" data-bind="P.timeline.events.' + i + '.note" value="' + esc(ed.note || "") + '"></div></div></section>';
  }
  return drawingHead("gantt", "태어난 해부터 100세까지를 하나의 공정표에. 지나온 기간은 막대, 이정표는 ◆, 앞으로의 계획은 빈 막대와 ◇로 그려요. 행을 누르면 편집할 수 있어요.") +
    '<div class="dwg-bar"><div class="row" style="gap:6px">' + [["all", "전 생애"], ["past", "지난 20년"], ["next", "앞으로 20년"]].map(([k, l]) => '<button class="chip ' + (rng === k ? "on" : "") + '" data-act="ganttRange" data-v="' + k + '">' + l + "</button>").join("") + '</div><div class="gantt-legend" style="margin-left:auto"><span><svg width="22" height="10"><rect width="22" height="10" rx="3" style="fill:var(--accent)"/></svg>지나온 기간</span><span><svg width="22" height="10"><rect x=".6" y=".6" width="20.8" height="8.8" rx="3" style="fill:var(--accent-2);stroke:var(--accent)"/></svg>앞으로</span><span><svg width="12" height="12"><rect x="2" y="2" width="8" height="8" transform="rotate(45 6 6)" style="fill:var(--ink)"/></svg>이정표</span><span><svg width="12" height="12"><rect x="2" y="2" width="8" height="8" transform="rotate(45 6 6)" style="fill:var(--sheet);stroke:var(--c-wants);stroke-width:1.8"/></svg>원하는 것</span><span><svg width="12" height="12"><rect x="2" y="2" width="8" height="8" transform="rotate(45 6 6)" style="fill:var(--ink-4)"/></svg>추정</span></div><button class="btn sm ghost" data-act="ganttWants">' + (S.ui.ganttAllWants ? "중요한 것만" : "원하는 것 모두") + '</button><button class="btn sm" data-act="evNew">' + I.plus + "이정표 추가</button></div>" +
    edit + ganttSVG(P) +
    (undated.length ? '<div class="banner" style="margin-top:12px">연도가 없어 표시되지 않은 이정표: ' + undated.map((e) => '<button class="chip" data-act="evEdit" data-id="' + e.id + '">' + esc(e.label) + "</button>").join(" ") + "</div>" : "") +
    '<details class="tbl"><summary>표로 보기</summary><table><thead><tr><th>구분</th><th>항목</th><th>시작</th><th>끝</th><th>상태</th></tr></thead><tbody>' + P.timeline.events.slice().sort((a, b) => (ym2num(a.s) ?? 9999) - (ym2num(b.s) ?? 9999)).map((e) => "<tr><td>" + esc(LANE_BY[e.lane]?.name) + "</td><td>" + esc(e.label) + "</td><td>" + esc(fmtYM(e.s)) + "</td><td>" + esc(e.e ? fmtYM(e.e) : "") + "</td><td>" + (e.est ? "추정" : "확정") + "</td></tr>").join("") + "</tbody></table></details>" +
    '<div class="dwg-foot">' + titleBlock([["DWG NO.", "LD-03"], ["TITLE", "인생 공정표"], ["REV", revStr()], ["DATE", fmtDot(nowISO())], ["ITEMS", String(P.timeline.events.length) + " + " + P.wants.items.filter((w) => wantYear(w)).length], ["SCALE", ({ all: "1Y=9px", past: "1Y=36px", next: "1Y=36px" })[rng]]]) + "</div>";
}

/* ============================================================ LD-04 METRICS */
function viewMetrics() {
  const P = S.P, pct = overall(P);
  const doneN = CH.filter((c) => P.done[c.id]).length;
  const ivF = P.facts.filter((f) => f.src === "interview").length;
  // chapter progress (EM style: actual vs 100)
  const chRows = CH.map((c) => { const p = P.done[c.id] ? 100 : chProgress(P, c.id); const s = chState(P, c.id); return '<div class="gap-row" style="grid-template-columns:130px minmax(0,1fr) 70px;padding:5px 0"><span style="font-size:12.5px"><span class="mono muted" style="font-size:10.5px">' + c.code + "</span> " + esc(c.name) + '</span><span class="b" style="height:10px"><i style="width:' + p + "%;background:" + (s === "done" ? "var(--good)" : "var(--accent)") + '"></i></span><span class="v"><span class="state ' + s + '" style="font-size:10.5px;padding:0 6px 0 4px">' + (s === "done" ? "완료" : p + "%") + "</span></span></div>"; }).join("");
  const chTbl = '<details class="tbl"><summary>표로 보기</summary><table><thead><tr><th>챕터</th><th>진도</th><th>상태</th></tr></thead><tbody>' + CH.map((c) => "<tr><td>" + c.code + " " + esc(c.name) + "</td><td>" + (P.done[c.id] ? 100 : chProgress(P, c.id)) + "%</td><td>" + ({ done: "완료", doing: "진행", todo: "대기" })[chState(P, c.id)] + "</td></tr>").join("") + "</tbody></table></details>";

  const ws = wheelStats(P);
  const tr = ipipScores(P); const vs = valueScores(P);
  const el = energyLists(P); const dt = discTally(P);
  const totA = el.c.length + el.n.length + el.d.length;
  const stack = totA ? '<div style="display:flex;height:14px;border-radius:0 4px 4px 0;overflow:hidden;gap:2px;margin:6px 0 8px">' + [["c", "var(--c-energy)"], ["n", "var(--ink-4)"], ["d", "var(--crit)"]].map(([k, c]) => el[k].length ? '<i title="' + ({ c: "충전", n: "보통", d: "방전" })[k] + " " + el[k].length + '" style="flex:' + el[k].length + ";background:" + c + '"></i>' : "").join("") + '</div><div class="legend"><span><i class="sq" style="background:var(--c-energy)"></i>충전 ' + el.c.length + '</span><span><i class="sq" style="background:var(--ink-4)"></i>보통 ' + el.n.length + '</span><span><i class="sq" style="background:var(--crit)"></i>방전 ' + el.d.length + "</span></div>" : '<div class="empty">CH.04를 채우면 보여요.</div>';

  // wants heatmap
  const W = P.wants.items, hz = HORIZONS.map((x) => x[0]);
  const cell = (t, z) => W.filter((w) => w.type === t && w.horizon === z).length;
  const max = Math.max(1, ...WANT_TYPES.flatMap((t) => hz.map((z) => cell(t.id, z))));
  const hm = '<div class="hm" style="grid-template-columns:96px repeat(' + hz.length + ',1fr)"><div></div>' + HORIZONS.map((x) => '<div class="hd">' + x[1] + "</div>").join("") + WANT_TYPES.map((t) => '<div class="rh">' + t.name + "</div>" + hz.map((z) => { const n = cell(t.id, z); return '<div class="cell" title="' + t.name + " · " + HZ_BY[z][1] + " " + n + '" style="background:' + (n ? "color-mix(in srgb, var(--c-wants) " + Math.round(18 + (n / max) * 70) + "%, var(--sheet))" : "var(--sheet-2)") + ";color:" + (n / max > 0.6 ? "#fff" : "var(--ink)") + '">' + (n || "") + "</div>"; }).join("")).join("") + '</div><div class="legend" style="margin-top:8px"><span>옅음 → 짙음 = 항목 수 (최대 ' + max + ")</span></div>";

  // progress trend
  const pl = P.progressLog.map((x) => ({ t: new Date(x.d + "T12:00:00"), y: x.p }));
  // records per year-month
  const byM = {}; S.LOG.items.forEach((r) => { const k = String(r.date || "").slice(0, 4) || "?"; byM[k] = byM[k] || {}; byM[k][r.type] = (byM[k][r.type] || 0) + 1; });
  const years = Object.keys(byM).sort();
  const maxY = Math.max(1, ...years.map((y) => sum(Object.values(byM[y]))));
  const recBars = years.length ? '<div class="stack" style="gap:6px">' + years.map((y) => { const tot = sum(Object.values(byM[y])); return '<div class="gap-row" style="grid-template-columns:44px minmax(0,1fr) 30px"><span class="mono" style="font-size:11.5px">' + y + '</span><span style="display:flex;height:12px;gap:2px;width:' + (tot / maxY) * 100 + '%">' + REC_TYPES.map((t) => byM[y][t.id] ? '<i title="' + t.name + " " + byM[y][t.id] + '" style="flex:' + byM[y][t.id] + ";background:" + t.color + ';border-radius:0 3px 3px 0"></i>' : "").join("") + '</span><span class="v">' + tot + "</span></div>"; }).join("") + '</div><div class="legend" style="margin-top:10px">' + REC_TYPES.map((t) => '<span><i class="sq" style="background:' + t.color + '"></i>' + t.name + "</span>").join("") + "</div>" : '<div class="empty">기록이 없어요.</div>';

  const revs = P.revLog.slice().reverse().slice(0, 8);

  return drawingHead("metrics", "숫자로 보는 나. 모든 수치는 여정의 응답에서 바로 계산돼요. 각 카드 아래의 '표로 보기'에서 원래 값을 확인할 수 있어요.") +
    '<div class="mx">' +
      '<section class="sheet mcard c3 stat"><div class="l">자기 이해 공정률</div><div class="v" style="font-size:44px">' + pct + '%</div><div class="d">챕터·인터뷰·도면을 합친 진척도</div></section>' +
      '<section class="sheet mcard c3 stat"><div class="l">완료 챕터</div><div class="v">' + doneN + ' / 9</div><div class="d">진행 중 ' + CH.filter((c) => chState(P, c.id) === "doing").length + "</div></section>" +
      '<section class="sheet mcard c3 stat"><div class="l">알게 된 사실</div><div class="v">' + P.facts.length + '</div><div class="d">인터뷰에서 ' + ivF + " · 기록에서 " + P.facts.filter((f) => f.src === "record").length + "</div></section>" +
      '<section class="sheet mcard c3 stat"><div class="l">개정 이력</div><div class="v">' + revStr() + '</div><div class="d">최근 ' + (P.revLog.length ? fmtDot(P.revLog[P.revLog.length - 1].at) : "없음") + "</div></section>" +
      '<section class="sheet mcard c6"><h4>챕터별 진도</h4><div class="sub">계획 100% 대비 실적 · 완료는 초록</div>' + chRows + chTbl + "</section>" +
      '<section class="sheet mcard c6"><h4>라이프 휠 · 만족도와 중요도의 차이</h4><div class="sub">차이가 큰 순서로 정렬</div>' + wheelDumbbell(ws) + '<details class="tbl"><summary>표로 보기</summary><table><thead><tr><th>영역</th><th>만족(0~10)</th><th>중요(1~5)</th><th>우선순위</th></tr></thead><tbody>' + ws.map((w) => "<tr><td>" + w.name + "</td><td>" + (w.sat ?? "–") + "</td><td>" + (w.imp ?? "–") + "</td><td>" + (w.gap ?? "–") + "</td></tr>").join("") + "</tbody></table></details></section>" +
      '<section class="sheet mcard c4"><h4>성격 5요인</h4><div class="sub">Mini-IPIP · 1~5 · 가운데 선 = 3</div>' + (TRAIT_ORDER.some((k) => tr[k].n) ? traitRows(tr, false) : '<div class="empty">CH.02를 채우면 보여요.</div>') + '<details class="tbl"><summary>표로 보기</summary><table><thead><tr><th>요인</th><th>점수</th><th>수준</th><th>응답</th></tr></thead><tbody>' + TRAIT_ORDER.map((k) => "<tr><td>" + TRAITS[k].name + "</td><td>" + (tr[k].score == null ? "–" : tr[k].score.toFixed(2)) + "</td><td>" + (tr[k].score == null ? "–" : LVL_KO[lvl(tr[k].score)]) + "</td><td>" + tr[k].n + "/4</td></tr>").join("") + "</tbody></table></details></section>" +
      '<section class="sheet mcard c4"><h4>가치 순위</h4><div class="sub">딜레마 ' + Object.keys(P.values.picks).length + "/" + DILEMMAS.length + "개 · 이긴 횟수/등장 횟수</div>" + (vs.some((v) => v.n) ? valueRows(vs) : '<div class="empty">CH.03을 채우면 보여요.</div>') + "</section>" +
      '<section class="sheet mcard c4"><h4>에너지 · 일하는 방식</h4><div class="sub">활동 ' + totA + "/" + ACTS.length + "개 응답</div>" + stack + '<div style="margin-top:14px">' + quadSVG(dt, 220) + "</div></section>" +
      '<section class="sheet mcard c6"><h4>원하는 것 · 종류 × 시기</h4><div class="sub">' + W.length + "개 · 진행 중 " + W.filter((w) => w.status === "doing").length + " · 이룸 " + W.filter((w) => w.status === "done").length + "</div>" + hm + "</section>" +
      '<section class="sheet mcard c6"><h4>공정률 추이</h4><div class="sub">하루 한 점, 그날의 마지막 값</div>' + (pl.length >= 2 ? lineSVG(pl, { h: 180 }) : '<div class="empty">이틀 이상 기록되면 추이선이 그려져요. 오늘 ' + pct + "%</div>") + "</section>" +
      '<section class="sheet mcard c6"><h4>기록 · 연도별</h4><div class="sub">정비 일지 ' + S.LOG.items.length + "건</div>" + recBars + "</section>" +
      '<section class="sheet mcard c6"><h4>개정 이력</h4><div class="sub">챕터 완료, 초상·지도 갱신, 인터뷰 누적 시 올라가요</div><ul class="list-plain">' + (revs.map((r) => '<li><span class="rev-tri">' + pad2(r.rev) + '</span><span style="flex:1">' + esc(r.note) + '</span><span class="mono muted" style="font-size:11px">' + fmtDot(r.at) + "</span></li>").join("") || '<li class="muted">아직 개정 이력이 없어요.</li>') + "</ul></section>" +
    "</div>" +
    '<div class="dwg-foot">' + titleBlock([["DWG NO.", "LD-04"], ["TITLE", "지표"], ["REV", revStr()], ["DATE", fmtDot(nowISO())], ["SOURCE", "응답 원값"], ["SCALE", "—"]]) + "</div>";
}

/* ============================================================ shell, router, events */
const ROUTES = { home: viewHome, journey: viewJourney, interview: viewInterview, log: viewLog, portrait: viewPortrait, map: viewMap, gantt: viewGantt, metrics: viewMetrics };
const AFTER = { interview: afterInterview, map: afterMap, log: applyLogSearch };
const DRAWING_VIEWS = ["portrait", "map", "gantt", "metrics"];

function buildShell() {
  const nav = (v, icon, label, code) => '<a href="#' + v + '" data-go="' + v + '">' + icon + "<span>" + label + "</span>" + (code ? '<span class="code">' + code + "</span>" : "") + "</a>";
  $("#app").innerHTML =
    '<div class="app"><aside class="rail"><div class="brand"><div class="brand-mark">' + I.logo + '<div><div class="brand-name">LIFE DOCK</div><div class="brand-sub">나를 짓고 고쳐 쓰는 곳</div></div></div><dl class="hull"><dt>HULL</dt><dd id="rHull"></dd><dt>OWNER</dt><dd id="rOwner"></dd><dt>REV</dt><dd id="rRev"></dd></dl></div>' +
    '<nav class="nav" aria-label="주 메뉴">' + nav("home", I.home, "현황판", "00") + nav("journey", I.route, "여정", "CH") + nav("interview", I.chat, "시운전 인터뷰", "AI") + nav("log", I.log, "정비 일지", "LOG") +
    '<div class="nav-label">DRAWINGS · 도면</div>' + nav("portrait", I.person, "자기 초상", "LD-01") + nav("map", I.map, "살아있는 지도", "LD-02") + nav("gantt", I.gantt, "인생 공정표", "LD-03") + nav("metrics", I.chart, "지표", "LD-04") + "</nav>" +
    '<div class="rail-foot"><div class="save-state"><i></i><span>저장됨</span></div><div>모든 변경은 자동으로 저장돼요.</div></div></aside>' +
    '<div class="main"><header class="topbar-m"><div class="brand-mark">' + I.logo + '<span class="brand-name">LIFE DOCK</span></div><div class="row" style="gap:10px"><span class="mono muted" id="mRev" style="font-size:11px"></span><span class="save-state"><i></i><span>저장됨</span></span></div></header><main class="page" id="page"></main></div>' +
    '<nav class="tabbar" aria-label="하단 메뉴">' + [["home", I.home, "현황"], ["journey", I.route, "여정"], ["interview", I.chat, "인터뷰"], ["log", I.log, "기록"], ["portrait", I.dwg, "도면"]].map(([v, ic, l]) => '<a href="#' + v + '" data-go="' + v + '" data-tab="' + v + '">' + ic + l + "</a>").join("") + "</nav></div>";
  setSave(S.mode === "cloud" ? "idle" : "off");
}
let lastView = null;
function render() {
  const v = S.ui.view;
  $$(".nav a[data-go]").forEach((a) => a.classList.toggle("on", a.dataset.go === v));
  $$(".tabbar a").forEach((a) => a.classList.toggle("on", a.dataset.tab === v || (a.dataset.tab === "portrait" && DRAWING_VIEWS.includes(v))));
  const P = S.P;
  const set = (id, t) => { const el = $("#" + id); if (el) el.textContent = t; };
  set("rHull", hullNo(P)); set("rOwner", P.basics.name || "-"); set("rRev", revStr() + " · " + fmtDot(P.updatedAt)); set("mRev", revStr());
  const page = $("#page");
  const y = window.scrollY;
  page.innerHTML = ROUTES[v]();
  if (lastView !== v) { window.scrollTo(0, 0); lastView = v; } else window.scrollTo(0, y);
  if (AFTER[v]) AFTER[v]();
}
function goView(v) {
  if (!ROUTES[v]) v = "home";
  if (v !== "map" && mapSim) { mapSim.stop(); mapSim = null; }
  S.ui.view = v;
  try { history.replaceState(null, "", "#" + v); } catch (e) { /* sandboxed */ }
  render();
}
window.addEventListener("hashchange", () => { const h = location.hash.replace("#", ""); if (ROUTES[h] && h !== S.ui.view) { S.ui.view = h; render(); } });

function setPath(path, v) {
  const parts = path.split("."); let o = S;
  for (let i = 0; i < parts.length - 1; i++) { const k = parts[i]; if (o[k] == null) o[k] = /^\d+$/.test(parts[i + 1]) ? [] : {}; o = o[k]; }
  o[parts[parts.length - 1]] = v;
}
function normYM(v) {
  v = String(v || "").trim(); if (!v) return { ok: true, v: null };
  const m = v.replace(/[./]/g, "-").match(/^(\d{4})(?:-(\d{1,2}))?$/);
  if (!m) return { ok: false };
  const mm = m[2] ? clamp(+m[2], 1, 12) : null;
  return { ok: true, v: m[1] + (mm ? "-" + pad2(mm) : "") };
}

/* ---------------- events ---------------- */
document.addEventListener("click", (e) => {
  const go = e.target.closest("[data-go]");
  if (go) { e.preventDefault(); goView(go.dataset.go); return; }
  const a = e.target.closest("[data-act]"); if (!a) return;
  const fn = ACT[a.dataset.act]; if (!fn) return;
  if (a.tagName === "A" || a.tagName === "BUTTON") e.preventDefault();
  fn(a, e);
});
document.addEventListener("input", (e) => {
  const el = e.target;
  if (el.id === "logQ") { S.ui.logQ = el.value; applyLogSearch(); return; }
  if (el.id === "logText") { S.ui.logDraft = el.value; return; }
  if (el.id === "ivInput") { S.ui.ivDraft = el.value; return; }
  if (!el.dataset || !el.dataset.bind) return;
  let v = el.value;
  if (el.dataset.type === "num") v = v.trim() === "" ? null : parseInt(v.replace(/\D/g, ""), 10) || null;
  if (el.dataset.ym) return; /* committed on change */
  setPath(el.dataset.bind, v);
  if (el.dataset.mark) { const [k, i] = el.dataset.mark.split(":"); if (k === "rv" && S.P.wants.items[+i]) S.P.wants.items[+i].rv = true; }
  markDirty("profile");
});
document.addEventListener("change", (e) => {
  const el = e.target; if (!el.dataset || !el.dataset.bind) return;
  if (el.dataset.ym) {
    const r = normYM(el.value);
    if (!r.ok) { toast("연도는 2017 또는 2017-05처럼 적어 주세요."); return; }
    setPath(el.dataset.bind, r.v);
    const m = el.dataset.bind.match(/^P\.timeline\.events\.(\d+)\./);
    if (m && r.v && S.P.timeline.events[+m[1]]) S.P.timeline.events[+m[1]].est = false;
    markDirty("profile");
  }
  if (el.dataset.rerender) render();
});
document.addEventListener("keydown", (e) => {
  const el = e.target; if (!el || e.isComposing || e.keyCode === 229) return;
  if (el.id === "ivInput" && e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ACT.ivSend(); return; }
  if (el.id === "logText" && e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); ACT.logAdd(); return; }
  if (e.key === "Enter") {
    const map = { newLoveName: "loveAdd", newLoveWhy: "loveAdd", newSub: "loveSubAdd", newTh: "thAdd", newWant: "wantAdd", evLabel: "evAdd" };
    if (map[el.id]) { e.preventDefault(); ACT[map[el.id]](); }
  }
});

function firstOpenStep(id) {
  const steps = STEPS[id]();
  if (S.P.done[id]) return steps.length;
  const k = steps.findIndex((s) => !s.ok());
  return k === -1 ? 0 : k;
}
async function runInsight(id) {
  if (!aiAvailable() || S.ui.busy["ins_" + id]) return;
  S.ui.busy["ins_" + id] = true; render();
  try { await aiChapterInsight(id); } catch (e) { toast(aiErrMsg(e), 4200); }
  S.ui.busy["ins_" + id] = false; render();
}
const needDirty = (...n) => { markDirty(...(n.length ? n : ["profile"])); };

const ACT = {
  go: (a) => goView(a.dataset.view === "ch" ? "journey" : a.dataset.view),
  openCh: (a) => { const id = a.dataset.id || (CH.find((c) => !S.P.done[c.id]) || CH[0]).id; S.ui.ch = id; S.ui.step = firstOpenStep(id); S.ui.lovesCat = null; S.ui.thGroup = null; S.ui.thItem = null; S.ui.wantType = null; lastView = null; goView("journey"); },
  stepPrev: () => { S.ui.step = Math.max(0, S.ui.step - 1); render(); scrollCh(); },
  stepNext: () => { const n = STEPS[curCh().id]().length; S.ui.step = Math.min(n, S.ui.step + 1); render(); scrollCh(); },
  chDone: () => {
    const id = curCh().id, P = S.P; P.done[id] = true; P.chapterAt[id] = nowISO();
    if (id === "wheel") { const snap = {}; WHEEL.forEach((w) => { const a = P.wheel.areas[w.id]; if (a) snap[w.id] = { sat: a.sat, imp: a.imp }; }); P.wheelHist.push({ at: nowISO(), v: snap }); }
    if (id === "basics") P.basics.confirmed = true;
    bumpRev("CH." + CH_BY[id].code + " " + CH_BY[id].name + " 완료");
    needDirty(); toast("CH." + CH_BY[id].code + " 완료 · " + revStr());
    if (id !== "basics" && aiAvailable() && !S.AI.insights[id]) runInsight(id); else render();
  },
  basicsConfirm: () => { S.P.basics.confirmed = true; S.P.basics.birthEst = false; needDirty(); render(); toast("제원을 확인했어요."); },
  wheelSat: (a) => { const P = S.P; P.wheel.areas[a.dataset.a] = Object.assign(P.wheel.areas[a.dataset.a] || {}, { sat: +a.dataset.v }); needDirty(); render(); },
  wheelImp: (a) => { const P = S.P; P.wheel.areas[a.dataset.a] = Object.assign(P.wheel.areas[a.dataset.a] || {}, { imp: +a.dataset.v }); needDirty(); render(); },
  ipip: (a) => { S.P.ipip.answers[a.dataset.n] = +a.dataset.v; needDirty(); render(); },
  dilemma: (a) => {
    const i = +a.dataset.i; S.P.values.picks[i] = a.dataset.v; needDirty(); render();
    setTimeout(() => { if (S.ui.view === "journey" && curCh().id === "values" && S.ui.step === i) { S.ui.step = Math.min(DILEMMAS.length, i + 1); render(); } }, 280);
  },
  act: (a) => { S.P.energy.acts[a.dataset.a] = a.dataset.v; needDirty(); render(); },
  chrono: (a) => { S.P.energy.chrono[a.dataset.q] = +a.dataset.v; needDirty(); render(); },
  disc: (a) => { S.P.energy.disc[a.dataset.i] = a.dataset.v; needDirty(); render(); },
  loveCat: (a) => { const id = a.dataset.id || null; S.ui.lovesCat = id; if (id && !S.P.loves.seen[id]) { S.P.loves.seen[id] = true; needDirty(); } render(); scrollCh(); },
  loveSub: (a) => { const x = S.P.loves.cats[S.ui.lovesCat]; const v = a.dataset.v; const i = x.subs.indexOf(v); if (i > -1) x.subs.splice(i, 1); else x.subs.push(v); needDirty(); render(); },
  loveSubAdd: () => { const el = $("#newSub"); const v = el && el.value.trim(); if (!v) return; const x = S.P.loves.cats[S.ui.lovesCat]; if (!x.subs.includes(v)) x.subs.push(v); needDirty(); render(); },
  loveAdd: () => { const n = $("#newLoveName"), w = $("#newLoveWhy"); const name = n && n.value.trim(); if (!name) { n && n.focus(); return; } S.P.loves.cats[S.ui.lovesCat].items.push({ id: uid("l"), name, why: (w && w.value.trim()) || "", src: "" }); needDirty(); render(); const nn = $("#newLoveName"); if (nn) nn.focus(); },
  loveDel: (a) => { S.P.loves.cats[S.ui.lovesCat].items.splice(+a.dataset.i, 1); needDirty(); render(); },
  thGroup: (a) => { S.ui.thGroup = a.dataset.id || null; S.ui.thItem = null; render(); scrollCh(); },
  thItem: (a) => { const it = S.P.thoughts.items.find((x) => x.id === a.dataset.id); if (!it) return; S.ui.thGroup = it.group; S.ui.thItem = it.id; render(); scrollCh(); },
  thStatus: (a) => { const it = S.P.thoughts.items.find((x) => x.id === S.ui.thItem); if (!it) return; it.status = it.status === a.dataset.v ? null : a.dataset.v; needDirty(); render(); },
  thWeight: (a) => { const it = S.P.thoughts.items.find((x) => x.id === S.ui.thItem); if (!it) return; it.weight = +a.dataset.v; needDirty(); render(); },
  thAdd: () => { const el = $("#newTh"); const v = el && el.value.trim(); if (!v) return; const it = { id: uid("t"), group: S.ui.thGroup, label: v, memo: "", links: [], now: "", status: null, weight: null, src: "" }; S.P.thoughts.items.push(it); S.ui.thItem = it.id; needDirty(); render(); },
  wantType: (a) => { S.ui.wantType = a.dataset.id || null; render(); scrollCh(); },
  wantSet: (a) => { const w = S.P.wants.items[+a.dataset.i]; if (!w) return; const k = a.dataset.k; w[k] = k === "prio" ? +a.dataset.v : a.dataset.v; w.rv = true; needDirty(); render(); },
  wantDel: (a) => { S.P.wants.items.splice(+a.dataset.i, 1); needDirty(); render(); },
  wantAdd: () => { const el = $("#newWant"), hz = $("#newWantHz"); const v = el && el.value.trim(); if (!v) return; S.P.wants.items.push({ id: uid("w"), type: S.ui.wantType, text: v, horizon: (hz && hz.value) || "3y", prio: 2, status: "idea", why: "", src: "", rv: true }); needDirty(); render(); const ne = $("#newWant"); if (ne) ne.focus(); },
  wantConfirmAll: () => { S.P.wants.items.forEach((w) => { if (w.type === S.ui.wantType) w.rv = true; }); needDirty(); render(); toast("이 목록을 모두 확인했어요."); },
  evOk: (a) => { const e = S.P.timeline.events[+a.dataset.i]; if (e) { e.est = false; needDirty(); render(); } },
  evDel: (a) => { const i = +a.dataset.i; const e = S.P.timeline.events[i]; if (!e) return; S.P.timeline.events.splice(i, 1); if (S.ui.editEvent === e.id) S.ui.editEvent = null; needDirty(); render(); toast("'" + e.label + "' 이정표를 지웠어요."); },
  evAdd: () => { const lb = $("#evLabel"); const label = lb && lb.value.trim(); if (!label) return; const s = normYM($("#evS").value), en = normYM($("#evE").value); if (!s.ok || !en.ok) { toast("연도는 2017 또는 2017-05처럼 적어 주세요."); return; } S.P.timeline.events.push({ id: uid("e"), lane: $("#evLane").value, label, s: s.v, e: en.v, kind: en.v ? "phase" : "milestone", est: false, src: "", note: "" }); needDirty(); render(); },
  evNew: () => { const e = { id: uid("e"), lane: "me", label: "새 이정표", s: curYM(), e: null, kind: "milestone", est: false, src: "", note: "" }; S.P.timeline.events.push(e); S.ui.editEvent = e.id; needDirty(); render(); },
  evEdit: (a) => { S.ui.editEvent = a.dataset.id; if (S.ui.view !== "gantt") goView("gantt"); else { render(); window.scrollTo({ top: 0, behavior: "smooth" }); } },
  evEditClose: () => { S.ui.editEvent = null; render(); },
  insight: (a) => runInsight(a.dataset.id),
  ivStart: () => { S.CHAT.turns = []; ivRun(true); },
  ivSend: () => {
    const el = $("#ivInput"); const text = el && el.value.trim();
    if (!text || S.ui.busy.iv) return;
    S.CHAT.turns.push({ role: "user", content: text, at: nowISO() }); S.ui.ivDraft = ""; markDirty("chat"); ivRun(false);
  },
  ivRetry: () => { const t = S.CHAT.turns; if (t.length && t[t.length - 1].role === "user") ivRun(false); else ivRun(!t.length); },
  ivTopic: (a) => { S.CHAT.topic = a.dataset.v; markDirty("chat"); render(); toast("다음 질문부터 '" + (TOPICS.find((t) => t[0] === a.dataset.v) || [0, ""])[1] + "'에 초점을 맞춰요."); },
  ivNewTopic: () => { if (S.ui.busy.iv) return; S.CHAT.turns.push({ role: "user", content: "(이 질문은 넘어가고, 현재 초점에 맞는 다른 질문을 해 주세요)", at: nowISO(), meta: true }); markDirty("chat"); ivRun(false); },
  ivClear: () => {
    if (!S.ui.confirmIvClear) { S.ui.confirmIvClear = true; toast("한 번 더 누르면 대화가 비워져요. 알게 된 사실은 남아요."); setTimeout(() => (S.ui.confirmIvClear = false), 3500); return; }
    S.ui.confirmIvClear = false; S.CHAT.turns = []; S.ui.ivErr = null; markDirty("chat"); render();
  },
  factDel: (a) => {
    const id = a.dataset.id; const P = S.P; const f = P.facts.find((x) => x.id === id);
    P.facts = P.facts.filter((x) => x.id !== id);
    S.CHAT.turns.forEach((t) => { if (t.facts) t.facts = t.facts.filter((x) => x !== id); });
    S.LOG.items.forEach((r) => { if (r.extracted) r.extracted = r.extracted.filter((x) => x !== id); });
    markDirty("profile", "chat", "log"); render(); if (f) toast("지웠어요: " + cut(f.text, 30));
  },
  logType: (a) => { const t = $("#logText"); if (t) S.ui.logDraft = t.value; S.ui.newType = a.dataset.v; render(); const t2 = $("#logText"); if (t2) { t2.value = S.ui.logDraft || ""; t2.focus(); } },
  logAdd: () => {
    const t = $("#logText"); const text = t && t.value.trim(); if (!text) { t && t.focus(); return; }
    const d = ($("#logDate") && $("#logDate").value) || localDate();
    S.LOG.items.push({ id: uid("r"), type: S.ui.newType || "thought", date: d, text, src: "", at: nowISO() });
    S.ui.logDraft = ""; markDirty("log"); render(); toast("기록했어요.");
  },
  logFilter: (a) => { S.ui.logFilter = a.dataset.v; render(); },
  recExtract: async (a) => {
    const r = S.LOG.items.find((x) => x.id === a.dataset.id); if (!r || S.ui.busy["rec_" + r.id]) return;
    S.ui.busy["rec_" + r.id] = true; render();
    try {
      const fs = await aiExtractFromRecord(r);
      r.extracted = []; fs.forEach((f) => { const id = uid("f"); S.P.facts.push({ id, area: f.area, text: String(f.text), src: "record", at: nowISO(), rec: r.id }); r.extracted.push(id); });
      r.extractedNone = !fs.length; markDirty("profile", "log");
      toast(fs.length ? "사실 " + fs.length + "개를 프로필에 더했어요." : "새로 뽑을 사실이 없었어요.");
    } catch (e) { toast(aiErrMsg(e), 4200); }
    S.ui.busy["rec_" + r.id] = false; render();
  },
  recDelAsk: (a) => { S.ui.confirmDel = a.dataset.id; render(); },
  recDelCancel: () => { S.ui.confirmDel = null; render(); },
  recDel: (a) => { S.LOG.items = S.LOG.items.filter((x) => x.id !== a.dataset.id); S.ui.confirmDel = null; markDirty("log"); render(); toast("기록을 지웠어요."); },
  drawPortrait: async () => {
    if (S.ui.busy.portrait) return; S.ui.busy.portrait = true; render();
    try { await aiPortrait(); toast("초상을 그렸어요 · " + revStr()); } catch (e) { toast(aiErrMsg(e), 4500); }
    S.ui.busy.portrait = false; render();
  },
  drawMap: async () => {
    if (S.ui.busy.map) return; S.ui.busy.map = true; render();
    try { const m = await aiMap(buildGraph(S.P).nodes); toast("주제 " + m.themes.length + "개, 숨은 연결 " + m.links.length + "개를 찾았어요."); } catch (e) { toast(aiErrMsg(e), 4500); }
    S.ui.busy.map = false; render();
  },
  mapToggle: (a) => { S.ui.mapHide[a.dataset.v] = !S.ui.mapHide[a.dataset.v]; render(); },
  mapSel: (a) => { S.ui.mapSel = a.dataset.id; render(); const w = $("#mapWrap"); if (w) w.scrollIntoView({ behavior: "smooth", block: "center" }); },
  mapClose: () => { S.ui.mapSel = null; render(); },
  ganttRange: (a) => { S.ui.ganttRange = a.dataset.v; render(); },
  ganttWants: () => { S.ui.ganttAllWants = !S.ui.ganttAllWants; render(); },
  dismissSeed: () => { S.P.dismissSeedNote = true; needDirty(); render(); },
};
function scrollCh() { const el = $("#chSheet"); if (el) { const top = el.getBoundingClientRect().top + window.scrollY - 70; if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" }); } }

/* ---------------- start ---------------- */
(async function main() {
  $("#app").innerHTML = '<div class="boot">' + I.logo.replace("<svg", '<svg width="40" height="40"') + "<span>LIFE DOCK · 도크를 여는 중</span></div>";
  const h = (location.hash || "").replace("#", ""); if (ROUTES[h]) S.ui.view = h;
  try { await boot(); } catch (e) { S.mode = "local"; S.P = ensureShape(blankProfile()); }
  buildShell(); render();
})();

})();