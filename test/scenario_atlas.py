# v4 features: migration from a v3 profile, review, ledger, think tree, packs, Excel round trip, weekly questions
import base64
UID = "data/users/u_testuser000000000000000/"
v3 = {"v": 3, "rev": 2, "basics": {"name": "테스트", "birthYear": 1985}, "ipip": {"answers": {"1": 4}},
      "facts": [{"id": "f1", "area": "work", "text": "팀장으로 일한다.", "src": "interview", "at": "2024-01-02T00:00:00Z"},
                {"id": "f2", "area": "traits", "text": "계획을 좋아한다.", "src": "record", "at": "2026-01-02T00:00:00Z"}],
      "thoughts": {"items": [{"id": "t1", "group": "money", "label": "은퇴", "memo": "60세", "links": ["연금", "집"], "status": None}]},
      "wants": {"items": []}, "timeline": {"events": []}, "loves": {"cats": {}}}
nudge = {"at": "2026-09-27T00:00:00Z", "questions": [{"q": "요즘 복용하는 약이 있나요?", "cat": "health", "label": "복용약"}, {"q": "주말 루틴은?", "cat": "routine"}]}
pre = {UID + "profile": v3, UID + "log": {"items": []}, UID + "nudge": nudge}
p, errs = mkpage(b, 1280, 900, extra="window.__NO_SEED__=true;window.__PRE__=" + json.dumps(pre, ensure_ascii=False) + ";")
p.wait_for_timeout(1600)
keys = p.evaluate("Array.from(window.__store.keys()).filter(k=>k.includes('/a_')).sort()")
print("docs:", keys)
print("tree std:", p.evaluate("JSON.stringify(window.__store.get('" + UID + "a_tree').tree.nodes.filter(n=>!n.parent).length)"), p.evaluate("JSON.stringify(window.__store.get('" + UID + "a_core').meta.treeMove.moves)"))
print("legacy kept:", p.evaluate("window.__store.has('" + UID + "profile')"))
shot(p, "a01_home_migrated")
p.click("[data-act=go][data-view=review]"); p.wait_for_timeout(300); shot(p, "a02_review")
print("review rows:", p.evaluate("document.querySelectorAll('.rv-row').length"))
p.select_option(".rv-row select >> nth=1", "mind"); p.wait_for_timeout(200)
p.click("[data-act=reviewDone]"); p.wait_for_timeout(300)
# weekly questions
p.fill("#nq_0", "없음"); p.click("[data-act=nudgeAnswer][data-i='0']"); p.wait_for_timeout(200)
p.click("[data-act=nudgeSkip][data-i='1']"); p.wait_for_timeout(1200)
print("nudge:", p.evaluate("JSON.stringify(window.__store.get('" + UID + "nudge').questions.map(q=>[!!q.done,!!q.skip]))"), "health doc:", p.evaluate("JSON.stringify(window.__store.get('" + UID + "a_led_health'))")[:160])
# ledger
p.click(".rail [data-go=ledger]"); p.wait_for_timeout(200); shot(p, "a03_ledger_all")
print("stale button:", p.evaluate("document.querySelectorAll('[data-act=entryOk]').length"))
p.click("[data-act=ledCat][data-id=money]"); p.wait_for_timeout(200)
p.fill("#newEntSub", "보험"); p.fill("#newEntLabel", "실손보험"); p.fill("#newEntValue", "2019년 가입, 월 3만원"); p.fill("#newEntDate", "2019-03")
p.click("[data-act=entryAdd]"); p.wait_for_timeout(200)
p.click(".entry-main >> nth=0"); p.wait_for_timeout(200); shot(p, "a04_ledger_edit")
p.click("[data-act=entrySet][data-k=conf][data-v=est]"); p.wait_for_timeout(200)
p.fill(".entry.editing textarea", "2019년 가입, 월 3만 2천원"); p.click("[data-act=entryEdit][data-id='']"); p.wait_for_timeout(1200)
print("money doc:", p.evaluate("JSON.stringify(window.__store.get('" + UID + "a_led_money').items.map(e=>[e.sub,e.label,e.value,e.conf,e.sens]))"))
p.fill("#ledQ", "실손"); p.wait_for_timeout(100); print("search visible:", p.evaluate("Array.from(document.querySelectorAll('#ledBody .entry')).filter(e=>!e.hidden).length"))
# think tree
p.click(".rail [data-go=tree]"); p.wait_for_timeout(200); shot(p, "a05_tree")
p.click(".tree > li > .tn .tn-l"); p.wait_for_timeout(100)
p.fill("#newNode", "연금 공부"); p.keyboard.press("Enter"); p.wait_for_timeout(200)
p.fill("#newNode", "부동산"); p.click("[data-act=treeAdd]"); p.wait_for_timeout(200)
labels = lambda: p.evaluate("Array.from(document.querySelectorAll('.tree .tn-l span:first-of-type')).map(x=>x.textContent)")
print("tree:", labels())
p.click(".tree .tn-l:has-text('부동산')"); p.click("[data-act=treeUp]"); p.wait_for_timeout(100)
p.click("[data-act=treeIn]"); p.wait_for_timeout(100)
print("after up+indent parent:", p.evaluate("(()=>{const n=Array.from(document.querySelectorAll('.tree .tn')).find(x=>x.textContent.includes('부동산'));return n.closest('ul').closest('li').querySelector('.tn-l span').textContent})()"))
p.click("[data-act=treeOut]"); p.wait_for_timeout(100)
p.click("[data-act=recDelAsk]"); p.click("[data-act=treeDel]"); p.wait_for_timeout(100)
print("tree after delete:", labels())
p.click("[data-act=treeView][data-v=mind]"); p.wait_for_timeout(300); shot(p, "a06_tree_mind", False)
p.click(".mm-n >> nth=2"); p.wait_for_timeout(200); print("mind select:", p.evaluate("!!document.querySelector('#tn_label')"))
# packs
p.click(".rail [data-go=export]"); p.wait_for_timeout(200)
p.click("[data-act=packSel][data-id=career]"); p.wait_for_timeout(200); shot(p, "a07_export")
txt = p.evaluate("document.querySelector('#packText').value")
print("career pack has work:", "## 일·경력" in txt, "| has health:", "## 건강" in txt)
p.click("[data-act=packSel][data-id=money]"); p.wait_for_timeout(100)
print("money pack has insurance:", "실손보험" in p.evaluate("document.querySelector('#packText').value"))
p.click("[data-act=packSave]"); p.wait_for_timeout(300)
p.click("[data-act=xlsxSave]"); p.wait_for_timeout(1500)
p.click("[data-act=jsonSave]"); p.wait_for_timeout(300)
print("saved:", p.evaluate("(window.__SAVED__||[]).map(x=>x.filename.replace(/\\d{8}/,'D')+':'+(x.size>0))"))
# Excel round trip: edit one row, add one row, upload
b64 = p.evaluate("""(()=>{const X=window.XLSX; const wb=X.utils.book_new();
  X.utils.book_append_sheet(wb, X.utils.json_to_sheet([{id:'f1',분류:'일·경력',세부:'현재 일',항목:'직책',내용:'팀장으로 일한다. (2026년 승진)',날짜:'',민감:'',추정:''},{id:'',분류:'건강·의료',세부:'검진·수치',항목:'혈압',내용:'125/82',날짜:'2026-05',민감:'Y',추정:''}]), '원장');
  X.utils.book_append_sheet(wb, X.utils.json_to_sheet([{항목:'사는 곳',값:'부산'}]), '기본정보');
  const a=X.write(wb,{bookType:'xlsx',type:'base64'}); return a;})()""")
p.set_input_files("#xlsxFile", files=[{"name": "edit.xlsx", "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "buffer": base64.b64decode(b64)}])
p.wait_for_timeout(800); shot(p, "a08_import_preview", False)
print("import preview:", p.evaluate("document.querySelector('.import-t') && document.querySelector('.import-t').innerText.replace(/\\s+/g,' ')"))
p.click("[data-act=importApply]"); p.wait_for_timeout(1400)
print("after import:", p.evaluate("JSON.stringify(window.__store.get('" + UID + "a_led_work').items.map(e=>[e.label,e.value]))"), p.evaluate("window.__store.get('" + UID + "a_core').basics.region"), p.evaluate("window.__store.get('" + UID + "a_led_health').items.length"))
p.click(".rail [data-go=home]"); p.wait_for_timeout(300); shot(p, "a09_home_after")
# reload: data comes back from the split documents
st = p.evaluate("JSON.stringify(Object.fromEntries(window.__store.entries()))")
p2, e2 = mkpage(b, 1280, 900, extra="window.__NO_SEED__=true;window.__PRE__=" + st + ";")
p2.wait_for_timeout(1200)
print("reload:", p2.evaluate("document.querySelector('h1').textContent"), p2.evaluate("window.__writes||0"), "writes on reload")
p2.click(".rail [data-go=ledger]"); p2.wait_for_timeout(200)
print("reload ledger entries:", p2.evaluate("document.querySelectorAll('#ledBody .entry').length"))
print([e for e in errs + e2 if "ERR_FAILED" not in e][:10])
