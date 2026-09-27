import json, sys, time, os
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "test", "shots")
os.makedirs(OUT, exist_ok=True)
content = open(ROOT + "/dist/lifedock.html", encoding="utf-8").read()
page_html = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui;background:#fafaf8}img{max-width:100%}[hidden]{display:none!important}</style></head><body>' + content + "</body></html>"
open(ROOT + "/test/index.html", "w", encoding="utf-8").write(page_html)
SEED_PATH = ROOT + "/seed/seed_owner.json"  # gitignored (personal data); tests run seedless without it
seed = open(SEED_PATH, encoding="utf-8").read() if os.path.exists(SEED_PATH) else "null"
mock = open(ROOT + "/test/mock_claude.js", encoding="utf-8").read()
D3 = open(ROOT + "/test/vendor/d3.min.js", encoding="utf-8").read()
XLSX = open(ROOT + "/test/vendor/xlsx.full.min.js", encoding="utf-8").read()

def mkpage(browser, w=1360, h=900, dark=False, extra=""):
    ctx = browser.new_context(viewport={"width": w, "height": h}, color_scheme="dark" if dark else "light", device_scale_factor=1)
    ctx.add_init_script("window.__SEED__=" + seed + ";" + extra)
    ctx.add_init_script(mock)
    ctx.route("**/fonts.googleapis.com/**", lambda r: r.abort())
    ctx.route("**/fonts.gstatic.com/**", lambda r: r.abort())
    ctx.route("**/d3.min.js", lambda r: r.fulfill(status=200, content_type="application/javascript", body=D3))
    ctx.route("**/xlsx.full.min.js", lambda r: r.fulfill(status=200, content_type="application/javascript", body=XLSX))
    p = ctx.new_page()
    errs = []
    p.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)))
    p.on("console", lambda m: errs.append("CONSOLE " + m.type + " " + m.text) if m.type in ("error", "warning") else None)
    p.goto("file://" + ROOT + "/test/index.html")
    p.wait_for_selector("#page", timeout=8000)
    time.sleep(0.4)
    return p, errs

def shot(p, name, full=True):
    p.screenshot(path=f"{OUT}/{name}.png", full_page=full)

if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    with sync_playwright() as pw:
        b = pw.chromium.launch(**({"executable_path": os.environ["CHROMIUM_PATH"]} if os.environ.get("CHROMIUM_PATH") else {}))
        exec(open(ROOT + "/test/scenario_" + which + ".py", encoding="utf-8").read())
        b.close()
