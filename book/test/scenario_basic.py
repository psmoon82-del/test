# first run → issue map → suggestions → record → interview → draft → edit → reload
BASE = "data/users/u_testuser000000000000000/"
fails = []
def ok(cond, msg):
    print(("PASS " if cond else "FAIL ") + msg)
    if not cond: fails.append(msg)

p, errs = mkpage(b)
p.wait_for_timeout(1200)
st = store(p)
ok(BASE + "b_issues" in st and len(st[BASE + "b_issues"]["items"]) == 14, "first run saves 14 starter issues")
ok("책 쓰기" in p.inner_text("#page"), "home renders")
shot(p, "01_home")

# issue map: add, suggest, delete, restore
p.click('.nav a[data-go="map"]')
p.select_option("#newArea", "work")
p.fill("#newQ", "회의에서 끝까지 설득할 일은 어떻게 고르나?")
p.press("#newQ", "Enter")
ok("회의에서 끝까지 설득할 일은" in p.inner_text("#page"), "add own issue with Enter")
p.click('[data-act="issueSuggest"]')
p.wait_for_selector('.tag.ai', timeout=5000)
txt = p.inner_text("#page")
ok("도전할지 말지는 무엇으로 정하나?" in txt and "근거: 공부방" in txt, "Claude suggestions added with reason")
ok(txt.count("빚을 내서 투자해도 되나?") == 1, "duplicate suggestion skipped")
sent = p.evaluate("window.__SENT__[window.__SENT__.length-1].input")
ok('{"issues"' in sent and "[이미 있는 질문]" in sent, "suggest prompt lists existing questions")
n0 = p.locator(".iss").count()
p.locator('.iss:has-text("실패한 선택은 언제 접어야") [data-act="issueDel"]').click()
ok(p.locator(".iss").count() == n0 - 1 and "지운 질문 1개" in p.inner_text("#page"), "delete moves to rejected")
p.click("details summary:has-text('지운 질문')")
p.click('[data-act="issueRestore"]')
ok(p.locator(".iss").count() == n0, "restore rejected question")
p.click('[data-act="area"][data-v="decide"]')
ok(p.locator(".area-g").count() == 1, "area filter shows one group")
shot(p, "02_map")

# my record: add a scene
p.click('.nav a[data-go="rec"]')
p.fill("#scWhen", "2004")
p.fill("#scTitle", "옆 아파트에 공부방을 차림")
p.fill("#scText", "원장에게 잘리고 한 달이 안 돼 옆 아파트를 계약했다. 망해도 같은 돈으로 좋은 집에서 산다.")
p.click('[data-act="scAdd"]')
ok("옆 아파트에 공부방을 차림" in p.inner_text("#page"), "scene added")
p.wait_for_timeout(1100)
sid = [v for k, v in store(p).items() if k.endswith("b_scenes")][0]["items"][0]["id"]

# atlas import
atlas = {"schema": "atlas.profile/4", "profile": {"tree": {"nodes": [{"id": "n1", "label": "돈", "memo": "없으면 불행한 건 확실하다."}]}, "values": {"notes": {"1": "확신이 생기면 1년 안에도 시작한다."}}, "ipip": {"notes": {}}, "timeline": {"events": [{"s": "2008", "label": "입사"}]}, "ledger": [{"label": "", "value": "엑셀 계산식을 많이 짜 왔다."}], "wants": {"items": []}, "decisions": {"items": []}}, "log": {"items": [{"text": "EM의 역할은 우리가 정한다.", "date": "2020"}]}}
import tempfile
fp = os.path.join(tempfile.gettempdir(), "atlas-test.json"); open(fp, "w").write(json.dumps(atlas, ensure_ascii=False))
p.set_input_files("#atlasFile", fp)
p.wait_for_timeout(300)
ok("Atlas 기록 5개" in p.inner_text("#page") or "5개" in p.inner_text("#page"), "atlas import reads 5 items")
shot(p, "03_records")

# interview on the suggested issue
p.click('.nav a[data-go="map"]')
p.click('[data-act="area"][data-v="all"]')
p.locator('.iss:has-text("도전할지 말지는 무엇으로") [data-act="openIv"]').click()
ok("인터뷰 시작" in p.inner_text("#page"), "interview empty state")
p.click('[data-act="ivStart"]')
p.wait_for_selector(".msg.a .bub:not(.typing)", timeout=5000)
ok(p.locator("#ivInput").is_enabled(), "input enabled after opening")
answers = ["망해도 남는 게 있으면 해요. 공부방도 그랬어요.", "몰라", "기대 수익은 틀리기 쉬우니까 최악일 때를 봅니다.", "사람을 잃는 일이면 다릅니다.", "망해도 남는 게 있으면 한다."]
for i, a in enumerate(answers):
    p.fill("#ivInput", a)
    p.press("#ivInput", "Enter")
    p.wait_for_function("document.querySelectorAll('.msg.a').length >= %d && !document.querySelector('.typing')" % (i + 2), timeout=6000)
    if i == 1:
        last = p.evaluate("window.__SENT__[window.__SENT__.length-1].input")
        body = last[0]["content"]
        ok("직전 답이 매우 짧다" in body, "short answer switches the next question")
    if i == 2:
        body = p.evaluate("window.__SENT__[window.__SENT__.length-1].input")[0]["content"]
        ok("[나의 기록" in body, "scenes offered once a check fails after 2 answers")
txt = p.inner_text("#page")
ok("근거 장면?" in txt, "scene suggestion chip shown")
p.click('[data-act="sceneAttach"]')
ok("옆 아파트에 공부방을 차림" in p.inner_text("#page aside"), "scene attached")
ok(p.locator(".slot.on").count() == 5, "all five slots filled")
ok(p.locator(".ck.ok").count() == 3, "all checks pass")
ok(p.locator(".iv-pend").count() == 1, "ready bar shown")
ok(len(p.locator(".quotes li").all()) >= 3, "quotes collected")
# edit a slot by hand
p.locator('textarea[data-bind$=".slots.principle"]').fill("망해도 남는 게 있으면 해 본다.")
shot(p, "04_interview")

# prose fallback keeps the reply
p.click('[data-act="ivStay"]')
p.evaluate("window.__IV_PROSE__ = true")
p.fill("#ivInput", "한 가지 더 말하면, 이건 제 경험이에요.")
p.press("#ivInput", "Enter")
p.wait_for_function("!document.querySelector('.typing')", timeout=6000)
ok("산문으로 답했어요" in p.inner_text("#chatLog"), "prose reply kept")

# draft
p.click('.iv-foot [data-act="openDraft"]')
p.click('[data-act="draftWrite"]')
p.wait_for_selector("textarea.prose", timeout=6000)
sent = p.evaluate("window.__SENT__[window.__SENT__.length-1].input")
ok("[인용: 저자의 원래 표현]" in sent and "옆 아파트에 공부방을 차림" in sent, "draft prompt carries quotes and attached scene")
ok("망해도 남는 게 있으면 해 본다." in sent, "hand-edited slot sent")
ok(p.locator("textarea.prose").count() == 6, "six sections")
ok(p.inner_text(".big").startswith("0"), "my sentences start at 0%")
ta = p.locator('textarea[data-bind$=".cur.opinion"]')
ta.fill("나는 해 볼지 말지를 정할 때, 잘 안 되면 뭐가 남는지부터 따진다. 남는 게 있으면 한다.")
p.wait_for_timeout(200)
p.click('[data-act="draftSnap"]')
big = p.inner_text(".big")
ok(not big.startswith("0"), "my sentences rise after editing: " + big.replace("\n", ""))
ok("확인 필요" in p.inner_text("#page aside"), "theory marked as needing a check")
p.fill("#draftAsk", "연결 부분을 줄여 줘")
p.click('[data-act="draftWrite"][data-ask="1"]')
p.wait_for_function("document.querySelector('.title-in') && document.querySelector('.title-in').value === '다시 쓴 제목'", timeout=6000)
sent = p.evaluate("window.__SENT__[window.__SENT__.length-1].input")
ok("[저자의 요청] 연결 부분을 줄여 줘" in sent and "잘 안 되면 뭐가 남는지부터" in sent, "rewrite sends request and my edits")
ok(not p.inner_text(".big").startswith("0"), "my kept sentence still counts after a rewrite: " + p.inner_text(".big").replace("\n", ""))
h = p.evaluate("document.querySelector('textarea[data-bind$=\".cur.opinion\"]').offsetHeight")
ok(h < 140, "section textarea fits its text (%dpx)" % h)
ok(p.locator('[data-act="draftRestore"]').count() == 2, "history keeps snapshot and pre-rewrite")
p.click('[data-act="draftDone"]')
p.click('[data-act="draftSave"]')
p.wait_for_timeout(200)
saved = p.evaluate("window.__SAVED__ || []")
ok(saved and saved[-1]["filename"].endswith(".md") and "## 의견" in saved[-1]["data"], "md saved")
shot(p, "05_draft")

p.click('.nav a[data-go="home"]')
ok(p.locator(".kb.done .n").inner_text() == "1", "home counts one done")
shot(p, "06_home_after")
p.wait_for_timeout(1500)
st = store(p)
pieces = [k for k in st if "/b_p_" in k]
ok(len(pieces) == 1 and any(h["sections"]["opinion"].startswith("나는 해 볼지") for h in st[pieces[0]]["draft"]["hist"]), "piece saved in its own document with my edit in history")

# reload from store
cur = p.evaluate("location.hash")
p2, errs2 = mkpage(b, pre=st)
p2.wait_for_timeout(800)
p2.click('.nav a[data-go="draft"]')
ok("도전할지 말지는" in p2.inner_text("#page"), "draft picker lists the piece after reload")
p2.click('#page [data-act="openDraft"]')
ok(p2.locator(".title-in").input_value() == "다시 쓴 제목", "draft restored after reload")
ok(len([k for k in store(p2) if k.endswith("b_issues")]) == 1 and len(store(p2)[BASE + "b_issues"]["items"]) == len(st[BASE + "b_issues"]["items"]), "no starter duplicates after reload")

# delete an issue with a piece → piece document removed
p2.click('.nav a[data-go="map"]')
p2.locator('.iss:has-text("도전할지 말지는 무엇으로") [data-act="issueDel"]').click()
p2.wait_for_timeout(1500)
ok(not [k for k in store(p2) if "/b_p_" in k], "piece document removed with its issue")

# AI failure shows an error with retry
p3, errs3 = mkpage(b, extra="window.__AI_FAIL__='rate_limited';")
p3.click('.nav a[data-go="map"]')
p3.locator('.iss').first.locator('[data-act="openIv"]').click()
p3.click('[data-act="ivStart"]')
p3.wait_for_timeout(700)
ok("rate_limited" in p3.inner_text("#page"), "AI error shown with code")
ok("rate_limited" in p3.locator(".diag-body").first.text_content(), "diag shows AI error")

# mobile + dark
p4, errs4 = mkpage(b, w=390, h=844, pre=st)
p4.wait_for_timeout(600)
sw = p4.evaluate("document.documentElement.scrollWidth")
ok(sw <= 390, "no horizontal scroll on mobile home (%d)" % sw)
shot(p4, "07_mobile_home")
for v in ["map", "iv", "draft", "rec"]:
    p4.click('.tabbar a[data-tab="%s"]' % v)
    p4.wait_for_timeout(150)
    sw = p4.evaluate("document.documentElement.scrollWidth")
    ok(sw <= 390, "no horizontal scroll on mobile %s (%d)" % (v, sw))
p4.goto(p4.url.split("#")[0] + "#draft/" + pieces[0].split("b_p_")[1])
p4.reload(); p4.wait_for_timeout(700)
shot(p4, "08_mobile_draft")
p5, errs5 = mkpage(b, dark=True, pre=st)
p5.wait_for_timeout(600)
shot(p5, "09_dark_home")

allerr = [e for e in errs + errs2 + errs4 + errs5 if "Failed to load resource" not in e and "[book]" not in e]
ok(not allerr, "no page errors: " + "; ".join(allerr[:5]))
print("\n%d failed" % len(fails))
