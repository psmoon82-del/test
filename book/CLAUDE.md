# 책 쓰기 (book/)

Atlas와 별개인 새 앱. 이슈 질문에 저자가 의견을 말하면 Claude가 묻고, 반론을 걸고, 초안을 쓴다. 저자가 초안을 고치며 자기 문체로 만든다.
Artifact: https://claude.ai/artifact/NkMde3fCDCmsfaJuNpccMU (Atlas URL과 다름. Atlas에는 쓰지 않는다)
배경과 결정 과정은 `HANDOFF.md`.

## 사용자 결정 (2026-09-28)
- 책 구조: **이슈 질문 중심**. 삶의 기록은 한켠에 두고, 의견의 논리가 충분하고 공감할 만하면 기록을 찾지 않는다(몽테뉴 『에세』, 달리오 『원칙』 방식).
- 글: AI가 인터뷰와 자료로 초안 → 저자가 피드백·수정. 갈수록 저자 문체가 드러나게.
- 첫 목표: 출간기획서 + 샘플 2꼭지. 범위는 삶 전반. 결과물은 앱 안 원고. 다른 사람도 쓰는 도구까지 고려.
- 저자가 말한 내용은 모두 재료로 쓰고, 개인적·도덕적으로 민감한 부분은 최종 정리 단계에서 저자가 빼거나 고친다.
- 장기 방향: Atlas(사실) + 이 앱(판단 방식) + Claude(지식) = 저자처럼 판단하는 개인 모델. **조언자로 시작한다**("당신이라면 이렇게 볼 것", 결정은 저자). 분야별로 적중률(Atlas AI 맞히기)이 높아진 곳만 나중에 대리인으로 올리고, 돈·건강·관계는 끝까지 승인을 거친다(자율주행 단계처럼 점진적으로).

## 다음 판에 넣을 것 (약속함)
1. 출간기획서 화면 (기획 의도·대상 독자·경쟁 도서(확인 필요)·목차·샘플·저자 소개)
2. 문체 노트: `draft.ai`와 `draft.cur`/`hist`의 차이에서 규칙을 뽑아 제안 → 저자가 확인한 것만 다음 초안에 반영
3. **원칙 카드**: 인터뷰에서 나온 원칙 + 조건 + 근거(이유·장면)를 이슈와 별도로 쌓는다. 나중에 콘텐츠·상담·결정 보조가 이 카드를 읽는다.
4. 첫 실제 인터뷰 뒤 저자 피드백(질문 방식, 초안 느낌)으로 프롬프트 고치기

## 구조
- `src/js/*.js` 번호순으로 이어 붙여 하나의 IIFE. `02_backend.js`는 Atlas와 같은 호스트 연결 층(+`remove`).
- 화면: 개요(`05_home`) · 이슈 지도(`06_issues`, `#map`) · 인터뷰(`07_interview`, `#iv/<id>`) · 원고(`08_draft`, `#draft/<id>`) · 나의 기록(`09_records`, `#rec`).
- 이슈 상태: 후보 → 인터뷰 중 → 초안 가능 → 초안 → 완성(`STATUS`).
- 인터뷰: 다섯 칸 `SLOTS`(의견·이유·반론·조건·원칙, 원칙은 마지막). 답마다 점검 `CHECKS`(구체적·흔하지 않음·반론을 견딤). 셋 다 통과하면 기록을 찾지 않는다. 부족하면 먼저 "예를 들면요?", 그래도 부족하고 답이 2번 이상일 때만 [나의 기록] 목록을 프롬프트에 넣어 장면 id를 제안받는다(붙이기/아니다). 짧은 답(`SHORT_ANSWER` 12자 이하) 다음에는 보기·대조 질문. 인용(`quotes`)은 토씨까지 원문. `done` 또는 `IV_CAP`(12)이면 초안 제안.
- 원고: 6칸 `SECTIONS`(의견·생각의 과정·장면(선택)·한계와 조건·연결·독자에게). 연결한 이론은 항상 "확인 필요". **내 문장 비율** = Claude 최신 초안에 없는 문장 + 다시 쓰기 전 저자가 쓴 문장(`draft.mine`). 판 기록 12개.
- Atlas 가져오기: Atlas Pack의 '전체 JSON'(`atlas.profile/4`)을 올리면 `atlasItems`가 짧은 글 목록으로(`b_atlas`, 180KB 상한).
- 문체 노트·출간기획서 화면은 다음 판. 고친 기록은 `draft.hist`와 `draft.ai`/`draft.cur` 차이로 남아 있다.

## 데이터 (`data/users/<uid>/`, 사용자별 비공개)
`b_book`(설정·지운 질문 `meta.rejected`) · `b_issues` · `b_scenes` · `b_atlas` · `b_p_<이슈 id>`(인터뷰 `iv` + 원고 `draft`, 꼭지마다 한 문서). 이슈를 지우면 그 꼭지 문서도 지운다. 첫 실행이면 `STARTER` 질문 14개.

## 빌드 / 테스트 / 배포
- `python3 book/build.py` → `book/dist/book.html`, `node --check book/dist/app.check.js`가 통과할 때만 publish.
- `CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome python3 book/test/run.py basic` (목: `book/test/mock_claude.js`).
- 배포: Artifact 도구로 위 URL에 publish. capabilities `{"db":{},"sample":{},"user":{},"downloads":true}`.
  다른 사람이 쓰려면 Artifact에서 Contributor 이상 권한이 있어야 자기 `data/users/<id>/`에 쓸 수 있다.
