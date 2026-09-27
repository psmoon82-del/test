# Atlas (구 LIFE DOCK)

나에 대한 모든 것을 분류해 쌓고(Records), 선택형 탐구와 AI 인터뷰로 채우고, 용도별 Pack으로 꺼내 AI나 사람에게 건네는 개인 데이터 도구.
화면 이름(사용자 결정 2026-09): 앱 Atlas(부제 없음) · Records(raw data, 코드상 ledger) · Network(관계 그래프, 코드상 map) · Pack(코드상 export). 나머지는 한글: 개요·탐구·AI 인터뷰·기록·생각 나무·자화상·연표·지표. 번역투·감성 조어는 피한다.
claude.ai Artifact로 배포된다: https://claude.ai/artifact/AfkbQn3BB16ocdAapZ2oXU (소유자 전용, 런타임 contract 0.2.60)

## 구조 (3층)
- 기록층 **원장**(`08_ledger`): `P.ledger` 항목 {id, cat, sub, label, value, date, sens, conf, src, at, up}. 분류는 `01_data`의 `LEDGER_CATS`. 1년 넘게 안 고친 항목은 "확인 필요".
- 이해층: **탐구**(`06_journey`, 9장 선택형) · **AI 인터뷰**(`07_interview`) · **생각 나무**(`06_tree`, `P.tree.nodes` {id, parent, label, memo, now, status, weight, order, area?}). 맨 위 층만 표준(`TREE_AREAS`: 라이프 휠 8 + 의미·나 자신, id `area_<id>`), 그 아래는 자유. `ensureTreeAreas`가 한 번 적용하고(`meta.treeStd`), 옮긴 기록은 `meta.treeMove` → `#review`. 자동 채우기(사용자 결정 2026-09): 'AI로 채우기' 버튼과 인터뷰의 '마치고 생각 나무에 반영'이 `aiTreeTopics`→`treeFill`로 주제를 바로 넣는다(`ai: true`, 고치면 사라짐). 지운 주제는 `meta.treeRejected`에 남아 다시 제안하지 않고 되살릴 수 있다. 입력 칸은 이름+메모 하나(`now`는 `treeMergeNow`가 한 번 메모로 합침, `meta.treeMemo`), 상태·무게는 접어 둔다 · 지도 4장(`09_portrait` `10_map` `11_gantt` `12_metrics`).
- 내보내기층 **팩**(`12_export`): `PACKS` 용도별 Markdown, 전체 JSON, 엑셀(SheetJS 0.18.5 지연 로드) 저장·올리기(적용 전 미리보기). 내보낸 기록은 `P.meta.exports`.
- `02_backend.js` — 호스트 연결 층. 저장(loadAll/save), AI(aiJSON), 파일 저장(download)을 여기서만 호출한다. 독립 앱으로 옮길 때 이 파일만 바꾼다. 런타임이 없으면 localStorage로 동작.
- `src/js/*.js` — 번호·이름 순서로 이어 붙여 하나의 IIFE(모듈 없음, 전역 공유). `13_app`이 셸·라우터·이벤트 위임(`data-act`, `data-bind`, `data-go`)·액션.
- 렌더링: 뷰 함수가 HTML 문자열 → `#page` innerHTML 교체. 텍스트 입력은 `data-bind`로 상태만 갱신(포커스 유지). `data-rerender`는 change 때 다시 그림.
- 상황에 따라 달라지는 답(사용자 요청 2026-09): 성격 문항은 한 점(숫자) 또는 범위 `{lo, hi}`(`ipipRange`, 점수는 중간값, 띠로 표시, 메모 `ipip.notes`). 딜레마·DISC는 `a|b|m` + 강도 `values.str`/`energy.discStr`(2 확실, 1 가까움, m 상황에 따라=0.5씩, `leanW`) + 메모. `situational()`이 AI 요약·인터뷰·Pack에 "한 점으로 단정하지 말 것"으로 넘긴다. 이론적 근거: Fleeson(성격=상태의 분포), Mischel·Shoda(만약-그러면 패턴).
- 디자인: Atlas 팔레트(옅은 회녹 종이, 슬레이트 잉크, 딥 틸 강조, 황토 주의), 제목 Gowun Batang, 본문 IBM Plex Sans KR, 숫자 Plex Mono. 판 번호는 "N판"(`revStr`).

## 빌드 / 테스트 / 배포
- 빌드: `python3 build.py` → `dist/lifedock.html` (Artifact 스켈레톤이 감싸므로 doctype/html/body 없이 title+style+div+script만). `dist/app.check.js`로 `node --check` 가능.
- 테스트: `python3 test/run.py all|mobile|edge|heal` (Playwright, `test/mock_claude.js`가 window.claude의 db/user/sample을 흉내냄. 스크린샷은 `test/shots/`). 크로미움 경로가 필요하면 `CHROMIUM_PATH`.
  `seed/seed_owner.json`이 없으면(git 클론 직후) 시드 없이 돈다: `mobile|edge|heal`은 통과, `all`은 시드 항목을 클릭하므로 시드가 있어야 한다.
  클라우드 세션: `pip install playwright` 후 `CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (`playwright install` 금지).
  sync Playwright에서는 `time.sleep` 대신 `page.wait_for_timeout`을 써야 route 핸들러가 돈다.
  `python3 test/run.py tree` — 생각 나무 자동 채우기·지운 주제·되살리기·인터뷰 반영·메모 합치기. `python3 test/run.py flex` — 범위·기울기·상황에 따라 답과 AI 전달. `python3 test/run.py atlas` — v3→v4 이전, 이전 확인, 원장, 생각 나무, 팩, 엑셀 왕복, 주간 질문, 새로고침 복원.
- 배포: Artifact 도구로 같은 URL에 publish(`url` 지정). capabilities:
  `{"db":{"rules":[{"path":"seed","read":"owner","write":"owner"},{"path":"profile","read":"owner","write":"owner"}]},"sample":{},"user":{},"downloads":true}`

## 데이터(db)
- 사용자별 비공개 `data/users/<uid>/`: `a_core`(원장·분리 항목 외 전부) `a_taste` `a_tree` `a_goals` `a_history` `a_led_<분류>` `ai` `chat` `log` `nudge`.
  문서당 256KiB 제한 때문에 나눴다. `flush()`는 JSON이 바뀐 문서만 쓴다(`lastSaved`).
- `profile` — v3 단일 문서. `a_core`가 없고 `profile`이 있으면 부팅 때 `migrateV3`로 옮기고 원본은 백업으로 남긴다. 옮긴 사실은 `mig: true`, 확인 화면은 `#review`.
- `nudge` — 주간 점검(Routine)이 써 넣는 이번 주 질문 {at, questions:[{q, cat, label?, hint?, entry?}]}. 앱이 답을 원장에 넣고 `done`/`skip`을 표시한다.
- `seed/owner` — 소유자 전용 시드(v3 형식). `seed/build_seed.py`로 생성한 `seed/seed_owner.json`. 부팅 시 v4로 이전해 쓴다.
- 개인 데이터는 HTML에 하드코딩하지 않는다. 추정은 `conf: "est"` / `est: true`.
- 실제 런타임의 스냅샷 `data()`는 깊게 얼어 있다(frozen). 앱 상태로 쓸 때는 반드시 `clone()`한다. 목(mock)도 똑같이 얼려서 돌려준다.
- 화면의 "연결 상태"(레일 하단·개요 맨 아래)에 모드·권한·저장 성공 횟수·마지막 저장/AI/앱 오류가 보인다. 실제 환경 문제는 여기서부터 본다.

## 주의
- `seed/seed_owner.json`과 그 원본인 `seed/build_seed.py`에는 실제 개인정보가 들어 있다. 둘 다 `.gitignore`에 있다. 공개 저장소에 올리지 말 것.
- 사용자 결정(2026-09): 건강·의료, 재정·보험 정보도 기록하고 AI 요청에 항상 포함한다. 민감 분류 항목은 `sens: "sensitive"` 표시만 한다.
