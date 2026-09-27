p, errs = mkpage(b)
shot(p, "01_home")
# journey basics
p.click(".rail [data-go=journey]"); time.sleep(0.2); shot(p, "02_journey_basics")
# wheel
p.click('.jr-index [data-id=wheel]'); time.sleep(0.2)
for aid in ["health", "money"]:
    p.click(f'[data-act=wheelSat][data-a={aid}][data-v="4"]'); p.click(f'[data-act=wheelImp][data-a={aid}][data-v="5"]')
shot(p, "03_wheel_step")
# answer the rest quickly
vals = {"work": (6, 4), "family": (8, 5), "people": (5, 3), "growth": (5, 4), "fun": (3, 4), "env": (8, 3)}
for i in range(3):
    p.click("[data-act=stepNext]"); time.sleep(0.1)
    for aid, (s, im) in vals.items():
        if p.query_selector(f'[data-act=wheelSat][data-a={aid}]'):
            p.click(f'[data-act=wheelSat][data-a={aid}][data-v="{s}"]'); p.click(f'[data-act=wheelImp][data-a={aid}][data-v="{im}"]')
p.click("[data-act=stepNext]"); time.sleep(0.2)
shot(p, "04_wheel_result")
p.click("[data-act=chDone]"); time.sleep(1.2)
shot(p, "05_wheel_done_insight")
# ipip
p.click('.jr-index [data-id=ipip]'); time.sleep(0.2)
import random
random.seed(3)
for k in range(5):
    for n in range(k*4+1, k*4+5):
        p.click(f'[data-act=ipip][data-n="{n}"][data-v="{random.randint(2,5)}"]')
    shot(p, "06_ipip_step") if k == 0 else None
    p.click("[data-act=stepNext]"); time.sleep(0.1)
shot(p, "07_ipip_result")
# values
p.click('.jr-index [data-id=values]'); time.sleep(0.2)
shot(p, "08_dilemma")
for i in range(14):
    p.click(f'[data-act=dilemma][data-i="{i}"][data-v="{"a" if i%3 else "b"}"]'); time.sleep(0.35)
time.sleep(0.3)
shot(p, "09_values_result")
# energy
p.click('.jr-index [data-id=energy]'); time.sleep(0.2)
for i,aid in enumerate(["deep","plan","coord","eng","mail","present"]):
    p.click(f'[data-act=act][data-a={aid}][data-v={"c" if i<2 else "d" if i<4 else "n"}]')
shot(p, "10_energy_acts")
# loves
p.click('.jr-index [data-id=loves]'); time.sleep(0.2); shot(p, "11_loves_tiles")
p.click('[data-act=loveCat][data-id=food]'); time.sleep(0.2); shot(p, "12_loves_food")
# thoughts
p.click('.jr-index [data-id=thoughts]'); time.sleep(0.2); shot(p, "13_thoughts")
p.click('.tree ul .tn-l'); p.wait_for_timeout(200); shot(p, "14_thought_item")
p.click('[data-act=thStatus][data-v=heavy]'); p.wait_for_timeout(100); p.click('[data-act=thWeight][data-v="3"]'); p.wait_for_timeout(100)
# wants
p.click('.jr-index [data-id=wants]'); time.sleep(0.2); shot(p, "15_wants")
p.click('[data-act=wantType][data-id=do]'); time.sleep(0.2); shot(p, "16_wants_do")
# timeline
p.click('.jr-index [data-id=timeline]'); time.sleep(0.2); shot(p, "17_timeline")
# interview
p.click(".rail [data-go=interview]"); time.sleep(0.2); shot(p, "18_interview_empty")
p.click("[data-act=ivStart]"); time.sleep(1.0)
p.fill("#ivInput", "요즘은 없는데 몇 년 전 건담 PG를 조립할 때 새벽까지 했어요.")
p.keyboard.press("Enter"); time.sleep(1.2)
shot(p, "19_interview_chat")
# log
p.click(".rail [data-go=log]"); time.sleep(0.2); shot(p, "20_log")
p.click('[data-act=recExtract]'); time.sleep(1.0); shot(p, "21_log_extract", False)
# portrait
p.click(".rail [data-go=portrait]"); time.sleep(0.2); shot(p, "22_portrait_empty")
p.click("[data-act=drawPortrait]"); time.sleep(1.2); shot(p, "23_portrait")
# map
p.click(".rail [data-go=map]"); time.sleep(1.2); shot(p, "24_map")
p.click("[data-act=drawMap]"); time.sleep(1.8); shot(p, "25_map_ai")
# gantt
p.click(".rail [data-go=gantt]"); time.sleep(0.3); shot(p, "26_gantt")
p.click('[data-act=ganttRange][data-v=next]'); time.sleep(0.2); shot(p, "27_gantt_next")
# metrics
p.click(".rail [data-go=metrics]"); time.sleep(0.3); shot(p, "28_metrics")
p.click(".rail [data-go=home]"); time.sleep(0.3); shot(p, "29_home_after")
time.sleep(1.2)
print("writes", p.evaluate("window.__writes"), "store keys", p.evaluate("Array.from(window.__store.keys())"))
print("\n".join(errs[:40]))
