# think tree auto-fill: AI topics go straight in, one memo field, deleted topics are not proposed again,
# restore, interview hand-off, and the one-time fold of "지금의 생각" into the memo
UID = "data/users/u_testuser000000000000000/"
v3 = {"v": 3, "rev": 1, "basics": {"name": "테스트"},
      "thoughts": {"items": [{"id": "t1", "group": "money", "label": "은퇴", "memo": "60세", "now": "55세도 생각", "status": None}]},
      "wants": {"items": []}, "timeline": {"events": []}, "loves": {"cats": {}}}
pre = {UID + "profile": v3, UID + "log": {"items": []}}
p, errs = mkpage(b, 1280, 900, extra="window.__NO_SEED__=true;window.__PRE__=" + json.dumps(pre, ensure_ascii=False) + ";")
p.wait_for_timeout(1500)
ok = lambda name, cond: print(("PASS " if cond else "FAIL ") + name)
tree = lambda: p.evaluate("JSON.parse(JSON.stringify((window.__store.get('" + UID + "a_tree')||{}).tree||{}))")

p.click(".rail [data-go=tree]"); p.wait_for_timeout(300)
p.click(".tn-l:has-text('은퇴')"); p.wait_for_timeout(200)
ok("memo merged", "지금: 55세도 생각" in p.input_value("#tn_memo"))
ok("one memo field, status folded", p.evaluate("!document.querySelector('#tn_now') && !document.querySelector('.tn-more').open"))
p.click("[data-act=treeSel][data-id='']"); p.wait_for_timeout(100)

p.click("[data-act=treeFill]"); p.wait_for_timeout(1200)
labels = p.evaluate("Array.from(document.querySelectorAll('.tn')).filter(x=>x.querySelector('.tn-ai')).map(x=>x.querySelector('.tn-l span').textContent)")
ok("3 AI topics added, duplicate skipped: " + ", ".join(labels), sorted(labels) == sorted(["간 수치 관리", "이직 고민", "연금 준비"]))
ok("nested under existing topic", p.evaluate("(()=>{const li=[...document.querySelectorAll('.tree li')].find(l=>l.querySelector(':scope>.tn .tn-l span').textContent==='은퇴');return !!li && li.textContent.includes('연금 준비')})()"))
ok("fresh highlight", p.evaluate("document.querySelectorAll('.tn.fresh').length") == 3)
shot(p, "t01_filled", False)

# editing clears the AI mark
p.click(".tn-l:has-text('간 수치 관리')"); p.wait_for_timeout(200)
p.fill("#tn_memo", "3개월 뒤 재검"); p.wait_for_timeout(1500)
p.click("[data-act=treeSel][data-id='']"); p.wait_for_timeout(100)
ok("edit clears AI mark", p.evaluate("!document.querySelector('.tn:has(.tn-l span) .tn-ai') || ![...document.querySelectorAll('.tn')].some(x=>x.textContent.includes('간 수치 관리') && x.querySelector('.tn-ai'))"))
node = [n for n in tree().get("nodes", []) if n["label"] == "간 수치 관리"]
ok("saved memo", bool(node) and node[0]["memo"] == "3개월 뒤 재검" and "ai" not in node[0])

# delete one: remembered, not re-added
p.click(".tn-l:has-text('이직 고민')"); p.wait_for_timeout(150)
p.click("[data-act=recDelAsk]"); p.click("[data-act=treeDel]"); p.wait_for_timeout(200)
ok("rejected list", "지운 주제 1개" in p.inner_text(".tree-rej summary"))
p.click("[data-act=treeFill]"); p.wait_for_timeout(1200)
ok("not proposed again", p.evaluate("![...document.querySelectorAll('.tn-l span')].some(s=>s.textContent==='이직 고민')"))
p.click(".tree-rej summary"); p.click("[data-act=treeRestore]"); p.wait_for_timeout(200)
ok("restored under work", p.evaluate("(()=>{const li=[...document.querySelectorAll('.tree>li')].find(l=>l.querySelector('.tn-l span').textContent==='일');return !!li && li.textContent.includes('이직 고민')})()"))
shot(p, "t02_after", False)

# interview hand-off
p.click(".rail [data-go=interview]"); p.wait_for_timeout(200)
p.click("[data-act=ivStart]"); p.wait_for_timeout(900)
p.fill("#ivInput", "건담 조립할 때 시간 가는 줄 몰라요"); p.click("[data-act=ivSend]"); p.wait_for_timeout(900)
p.click("[data-act=ivTree]"); p.wait_for_timeout(900)
ok("interview message", "주제 1개" in p.inner_text(".chat-in"))
p.click("[data-act=ivTree]"); p.wait_for_timeout(300)
p.wait_for_timeout(1500)
ok("interview topic saved", any(n["label"] == "건담 조립" for n in tree().get("nodes", [])))
shot(p, "t03_interview", False)

# mobile layout of the AI bar
p.set_viewport_size({"width": 390, "height": 800}); p.evaluate("location.hash='#tree'"); p.wait_for_timeout(400)
ok("no horizontal scroll", p.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
shot(p, "t04_mobile", False)
print("errors:", [e for e in errs if "favicon" not in e])
