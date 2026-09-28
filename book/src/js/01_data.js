/* ============================================================ data: areas, issue flow, interview slots, piece sections */
/* the whole-life map. Each area collects issue questions; the book's parts follow it. */
const AREAS = [
  { id: "work", name: "일" },
  { id: "money", name: "돈" },
  { id: "family", name: "가족" },
  { id: "parent", name: "부모·자녀" },
  { id: "people", name: "관계" },
  { id: "health", name: "건강" },
  { id: "decide", name: "결정" },
  { id: "learn", name: "배움" },
  { id: "time", name: "시간" },
  { id: "fail", name: "실패" },
  { id: "meaning", name: "행복·의미" },
];
const AREA_BY = Object.fromEntries(AREAS.map((a) => [a.id, a]));

/* an issue moves left to right. "ready" = the interview has enough to draft. */
const STATUS = [
  { id: "idea", name: "후보" },
  { id: "talk", name: "인터뷰 중" },
  { id: "ready", name: "초안 가능" },
  { id: "draft", name: "초안" },
  { id: "done", name: "완성" },
];
const STATUS_BY = Object.fromEntries(STATUS.map((s) => [s.id, s]));

/* what one issue interview has to pull out, in order. The principle is asked last. */
const SLOTS = [
  { id: "opinion", name: "의견", q: "이 문제를 어떻게 보는가" },
  { id: "reason", name: "이유", q: "무엇을 따졌고 무엇을 버렸나" },
  { id: "counter", name: "반론", q: "반대 의견에 어떻게 답하나" },
  { id: "cond", name: "조건", q: "이 생각이 통하지 않는 때" },
  { id: "principle", name: "원칙", q: "한 문장으로, 자기 말로" },
];
/* checked by Claude on every answer. All three pass → no need to dig into the life record. */
const CHECKS = [
  { id: "concrete", name: "구체적", d: "기준, 비교, 숫자가 있다" },
  { id: "fresh", name: "흔하지 않음", d: "누구나 할 말이 아니다" },
  { id: "robust", name: "반론을 견딤", d: "제기된 반론에 답이 된다" },
];
const IV_CAP = 12;        /* answers before Claude suggests moving to a draft */
const SHORT_ANSWER = 12;  /* characters; shorter answers switch the next question to choices or contrast */

/* one piece of the book */
const SECTIONS = [
  { id: "opinion", name: "의견" },
  { id: "process", name: "생각의 과정" },
  { id: "scene", name: "장면", opt: true },
  { id: "limits", name: "한계와 조건" },
  { id: "link", name: "연결" },
  { id: "reader", name: "독자에게" },
];

/* starter questions for someone opening the app with nothing yet. Claude suggests personal ones later. */
const STARTER = [
  ["work", "좋아하는 일을 찾아야 하나, 집중할 수 있는 일이면 되나?"],
  ["work", "말이 통하지 않는 상사와는 어떻게 일해야 하나?"],
  ["money", "빚을 내서 투자해도 되나?"],
  ["money", "얼마면 충분한가?"],
  ["family", "배우자와 서로의 관심사가 멀어질 때 어떻게 하나?"],
  ["parent", "아이 공부에 부모는 얼마나 개입해야 하나?"],
  ["people", "넓은 관계와 깊은 관계 중 무엇이 중요한가?"],
  ["health", "건강 경고를 들었을 때 무엇부터 바꾸나?"],
  ["decide", "확신이 없을 때 움직여야 하나, 기다려야 하나?"],
  ["decide", "남들이 안 된다고 할 때 무엇을 보고 판단하나?"],
  ["learn", "어른이 되어 새로 배울 때 무엇이 다른가?"],
  ["time", "여유는 시간이 많을 때 생기나?"],
  ["fail", "배수의 진은 언제 통하고 언제 안 통하나?"],
  ["meaning", "평범한 삶에서 의미는 어디서 오나?"],
];
