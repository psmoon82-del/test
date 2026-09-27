# interview rounds: covering all twelve Records categories ends the interview with a summary;
# chats from before rounds count categories with interview facts as covered; a new round starts on request
UID = "data/users/u_testuser000000000000000/"
ok = lambda name, cond: print(("PASS " if cond else "FAIL ") + name)
CATS = ["basic", "work", "family", "health", "money", "home", "routine", "mind", "taste", "thoughts", "goals", "history"]
def ledger(cats):
    return {UID + "a_led_" + c: {"items": [{"id": "f" + c, "cat": c, "sub": "", "label": "", "value": c + " 사실", "date": None, "sens": "normal", "conf": "sure", "src": "interview", "at": "2026-09-27T10:00:00Z", "up": "2026-09-27T10:00:00Z"}]} for c in cats}
turns = []
for k in range(6):
    turns.append({"role": "user", "content": "답 %d" % k, "at": "2026-09-27T10:00:00Z"})
    turns.append({"role": "assistant", "content": "질문", "at": "2026-09-27T10:00:00Z", "facts": []})
core = {UID + "a_core": {"v": 4, "rev": 1, "basics": {"name": "테스트"}, "meta": {"treeStd": 1, "treeMemo": 1}}}
chat = lambda pg: pg.evaluate("JSON.parse(JSON.stringify(window.__store.get('" + UID + "chat')||{}))")
def say(pg, t):
    pg.fill("#ivInput", t); pg.click("[data-act=ivSend]"); pg.wait_for_timeout(600)

# 1) topic-tracked chat before rounds, 10 categories already interviewed, sitting at a fresh 'history'
pre = dict(core, **ledger(CATS[:9] + ["history"])); pre[UID + "chat"] = {"turns": turns, "topic": "auto", "cur": {"cat": "history", "n": 0, "facts": 0, "dry": 0, "cap": 8}, "covered": ["health", "work"]}
p, errs = mkpage(b, 1280, 900, extra="window.__NO_SEED__=true;window.__IV_NOFACTS__=true;window.__PRE__=" + json.dumps(pre, ensure_ascii=False) + ";")
p.wait_for_timeout(1200); p.evaluate("location.hash='#interview'"); p.wait_for_timeout(400)
ok("covered inferred: 10 of 12", "12개 중 10개" in p.inner_text(".iv-round"))
first = p.inner_text(".iv-now h4")
ok("moved off covered history to an uncovered one: " + first, "연대기" not in first and ("목표" in first or "생각" in first))
for k in range(3): say(p, "없어 %d" % k)
ok("move-on bar to the last category", "넘어가기" in p.inner_text(".iv-pend"))
p.click("[data-act=ivMove]"); p.wait_for_timeout(800)
for k in range(3): say(p, "없어 %d" % k)
ok("last category -> finish bar", "인터뷰 마치기" in p.inner_text(".iv-pend"))
say(p, "네 마치자")
ok("finished by answer: summary shown", p.evaluate("!!document.querySelector('.iv-done')") and "1바퀴 인터뷰를 마쳤어요" in p.inner_text(".iv-done"))
ok("input disabled", p.evaluate("document.querySelector('#ivInput').disabled"))
p.wait_for_timeout(1200); c = chat(p)
ok("stored done + all covered", bool(c.get("done")) and len(c.get("covered") or []) == 12 and c.get("round") == 1)
shot(p, "r01_done", False)
p.evaluate("window.__IV_NOFACTS__=false")
p.click("[data-act=ivRound]"); p.wait_for_timeout(800)
ok("new round: round 2, input enabled", "2바퀴" in p.inner_text(".iv-round") and not p.evaluate("document.querySelector('#ivInput').disabled"))
print("errors:", [e for e in errs if "ERR_FAILED" not in e])

# 2) every category already interviewed: the old chat ends right away with the summary (phone width)
pre2 = dict(core, **ledger(CATS)); pre2[UID + "chat"] = {"turns": turns, "topic": "auto", "cur": {"cat": "history", "n": 0, "facts": 0, "dry": 0, "cap": 8}, "covered": ["health", "work"]}
p2, e2 = mkpage(b, 390, 800, extra="window.__NO_SEED__=true;window.__PRE__=" + json.dumps(pre2, ensure_ascii=False) + ";")
p2.wait_for_timeout(1200); p2.evaluate("location.hash='#interview'"); p2.wait_for_timeout(400)
ok("all covered -> summary", p2.evaluate("!!document.querySelector('.iv-done')") and "사실 1" in p2.inner_text(".iv-sum"))
ok("mobile no horizontal scroll", p2.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
shot(p2, "r02_done_mobile", True)
print("errors:", [e for e in e2 if "ERR_FAILED" not in e])
