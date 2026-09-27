# phase 2: pack compare, AI guessing game, decision journal (add, review, calibration, packs, excel)
UID = "data/users/u_testuser000000000000000/"
ok = lambda name, cond: print(("PASS " if cond else "FAIL ") + name)
doc = lambda pg, n: pg.evaluate("JSON.parse(JSON.stringify(window.__store.get('" + UID + n + "')||{}))")
p, errs = mkpage(b, 1280, 900, extra="window.__NO_SEED__=true;")
p.wait_for_timeout(1000)

# --- pack compare
p.click(".rail [data-go=export]"); p.wait_for_timeout(300)
p.click("[data-act=cmpEx]"); p.wait_for_timeout(100)
ok("example question filled", len(p.input_value("#cmpQ")) > 5)
p.click("[data-act=cmpRun]"); p.wait_for_timeout(1400)
ok("two answers side by side", p.evaluate("document.querySelectorAll('.cmp-a').length") == 2 and "프라모델" in p.inner_text(".cmp-a.pack"))
sent = p.evaluate("window.__SENT__.slice(-2).map(x=>typeof x.input==='string'?x.input:'')")
ok("plain call has no pack, second has it", "직접 정리한 자기 기록" not in sent[0] and "직접 정리한 자기 기록" in sent[1])
p.click("[data-act=cmpPick][data-v=pack]"); p.wait_for_timeout(1200)
ok("pick stored + tally", (doc(p, "play").get("compare") or [{}])[0].get("pick") == "pack" and "100%" in p.inner_text(".cmp"))
shot(p, "p01_compare", False)

# --- guess
p.click(".rail [data-go=guess]"); p.wait_for_timeout(200)
p.click("[data-act=gNew]"); p.wait_for_timeout(900)
ok("question 1 shown", "문제 1 / 5" in p.inner_text(".gq"))
p.click("[data-act=gAns][data-v='0']"); p.wait_for_timeout(200)
ok("hit revealed", "맞혔어요" in p.inner_text(".gq-rv"))
p.click("[data-act=gNext]")
p.click("[data-act=gAns][data-v='2']"); p.wait_for_timeout(200)   # '상황에 따라' on a 2-option question
ok("miss + depends option", "틀렸어요" in p.inner_text(".gq-rv") and "상황에 따라" in p.inner_text(".gq-opts"))
for k in range(3):
    p.click("[data-act=gNext]"); p.click("[data-act=gAns][data-v='0']"); p.wait_for_timeout(150)
p.click("[data-act=gNext]"); p.wait_for_timeout(300)
ok("round summary 2/5", "2 / 5 맞힘" in p.inner_text("#page"))
p.wait_for_timeout(1200)
led = doc(p, "a_led_taste").get("items") or []
ok("answers went to Records", any(e.get("src") == "guess" for e in led))
shot(p, "p02_guess", False)

# --- decisions
p.click(".rail [data-go=decide]"); p.wait_for_timeout(200)
p.fill("#decTitle", "이직 제안을 거절한다"); p.fill("#decWhy", "지금 프로젝트를 마무리하고 싶어서"); p.fill("#decExpect", "6개월 안에 라인 리더 평가 A")
p.click("[data-act=decConf][data-v='80']"); p.select_option("#decDue", "1m"); p.click("[data-act=decAdd]"); p.wait_for_timeout(300)
ok("decision listed as open", "진행 중" in p.inner_text("#page") and "이직 제안을 거절한다" in p.inner_text("#page"))
# make it due, then review from the home banner
p.evaluate("(()=>{})()")
p.click(".dec-h"); p.wait_for_timeout(150)
p.fill(".dec-body input[data-bind$='.due']", "2026-01-01"); p.dispatch_event(".dec-body input[data-bind$='.due']", "change"); p.wait_for_timeout(200)
p.click(".rail [data-go=home]"); p.wait_for_timeout(200)
ok("home banner for due decision", "돌아볼 결정 1개" in p.inner_text("#page"))
p.click("[data-view=decide] >> nth=0"); p.wait_for_timeout(200)
if not p.query_selector(".dec-rv"): p.click(".dec-h"); p.wait_for_timeout(150)
p.fill(".dec-rv textarea >> nth=0", "프로젝트는 잘 끝났지만 평가는 B")
p.click("[data-act=decSet][data-k=met][data-v=part]"); p.click("[data-act=decSet][data-k=quality][data-v=good]"); p.click("[data-act=decSet][data-k=outcome][data-v=bad]"); p.wait_for_timeout(100)
ok("quadrant hint", "운이 나빴던 쪽" in p.inner_text(".dec-rv"))
p.click("[data-act=decDone]"); p.wait_for_timeout(300)
ok("calibration shown", "확신 평균 80%" in p.inner_text("#page") and "기대대로 된 비율 50%" in p.inner_text("#page"))
shot(p, "p03_decide", False)
p.wait_for_timeout(1200)
dd = doc(p, "a_decide").get("decisions", {}).get("items") or []
ok("saved in a_decide", len(dd) == 1 and dd[0]["status"] == "done")
# packs carry the journal
p.click(".rail [data-go=export]"); p.wait_for_timeout(200); p.click("[data-act=packSel][data-id=plan]"); p.wait_for_timeout(200)
ok("plan pack has 결정 일지", "## 결정 일지" in p.input_value("#packText"))
print("errors:", [e for e in errs if "ERR_FAILED" not in e])

# mobile widths
p.set_viewport_size({"width": 390, "height": 800})
for v in ["decide", "guess", "export"]:
    p.evaluate("location.hash='#" + v + "'"); p.wait_for_timeout(300)
    ok("mobile " + v + " no horizontal scroll", p.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
shot(p, "p04_mobile_export", True)
