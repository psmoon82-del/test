# LIFE DOCK (라이프 독)

자기이해 도구. 안내된 여정(9챕터) → AI 인터뷰 → 도면 4장(자기 초상 / 살아있는 지도 / 인생 공정표 / 지표).
claude.ai Artifact로 배포된다: https://claude.ai/artifact/AfkbQn3BB16ocdAapZ2oXU (소유자 전용, 런타임 contract 0.2.60)

## 구조
- `src/styles.css` — 디자인 토큰(라이트/다크) + 전체 컴포넌트 스타일. 폰트: IBM Plex Sans KR / IBM Plex Mono / Gowun Batang(초상 전용).
- `src/js/*.js` — 번호 순서대로 이어 붙여 하나의 IIFE가 된다(모듈 시스템 없음, 전역 공유).
  - `00_util` 헬퍼·아이콘 / `01_data` 문항·상수(개인정보 없음) / `02_state` 상태·점수·진도·저장(db)·부팅
  - `03_ai` 프로필 요약(digest)·프롬프트·sample 호출 / `04_charts` SVG 차트
  - `05_home` `06_journey` `07_interview` `08_log` `09_portrait` `10_map`(d3 force) `11_gantt` `12_metrics` 뷰
  - `13_app` 셸·라우터·이벤트 위임(`data-act`, `data-bind`, `data-go`)·액션
- 렌더링: 뷰 함수가 HTML 문자열을 반환 → `#page` innerHTML 교체. 텍스트 입력은 `data-bind` 경로로 상태만 갱신하고 재렌더하지 않는다(포커스 유지).
- d3는 지도 뷰에서만 jsdelivr → cdnjs 순으로 지연 로드.

## 빌드 / 테스트 / 배포
- 빌드: `python3 build.py` → `dist/lifedock.html` (Artifact 스켈레톤이 감싸므로 doctype/html/body 없이 title+style+div+script만). `dist/app.check.js`로 `node --check` 가능.
- 테스트: `python3 test/run.py all|mobile|edge|heal` (Playwright, `test/mock_claude.js`가 window.claude의 db/user/sample을 흉내냄. 스크린샷은 `test/shots/`). 크로미움 경로가 필요하면 `CHROMIUM_PATH`.
  `seed/seed_owner.json`이 없으면(git 클론 직후) 시드 없이 돈다: `mobile|edge|heal`은 통과, `all`은 시드 항목을 클릭하므로 시드가 있어야 한다.
  클라우드 세션: `pip install playwright` 후 `CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (`playwright install` 금지).
  sync Playwright에서는 `time.sleep` 대신 `page.wait_for_timeout`을 써야 route 핸들러가 돈다.
- 배포: Artifact 도구로 같은 URL에 publish(`url` 지정). capabilities:
  `{"db":{"rules":[{"path":"seed","read":"owner","write":"owner"},{"path":"profile","read":"owner","write":"owner"}]},"sample":{},"user":{}}`

## 데이터(db)
- 사용자별 비공개: `data/users/<uid>/profile|ai|chat|log` (문서 4개).
- `seed/owner` — 소유자 전용 시드(엑셀 메모·대화에서 옮긴 개인 데이터). `seed/build_seed.py`로 생성한 `seed/seed_owner.json`. 소유자의 profile이 없거나 사실상 비어 있으면 부팅 시 시드를 복사한다.
- `profile/*` — v1/v2 시절 데이터(현재 미사용, 소유자 전용 규칙).
- 개인 데이터는 HTML에 하드코딩하지 않는다. 추정 연도는 `est: true`로 표시.
- 실제 런타임의 스냅샷 `data()`는 깊게 얼어 있다(frozen). 앱 상태로 쓸 때는 반드시 `clone()`한다. 목(mock)도 똑같이 얼려서 돌려준다.
- 화면의 "연결 상태"(레일 하단·현황판 맨 아래)에 모드·권한·저장 성공 횟수·마지막 저장/AI/앱 오류가 보인다. 실제 환경 문제는 여기서부터 본다.

## 주의
- `seed/seed_owner.json`과 그 원본인 `seed/build_seed.py`에는 실제 개인정보가 들어 있다. 둘 다 `.gitignore`에 있다. 공개 저장소에 올리지 말 것.
- 재정·투자 세부 숫자는 사용자 요청으로 프로필/프롬프트에서 제외.
