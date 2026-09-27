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
