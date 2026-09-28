import json, sys, time, os
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "test", "shots")
os.makedirs(OUT, exist_ok=True)
content = open(ROOT + "/dist/book.html", encoding="utf-8").read()
page_html = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui;background:#fafaf8}[hidden]{display:none!important}</style></head><body>' + content + "</body></html>"
open(ROOT + "/test/index.html", "w", encoding="utf-8").write(page_html)
mock = open(ROOT + "/test/mock_claude.js", encoding="utf-8").read()

def mkpage(browser, w=1360, h=900, dark=False, extra="", pre=None):
    ctx = browser.new_context(viewport={"width": w, "height": h}, color_scheme="dark" if dark else "light", device_scale_factor=1)
    ctx.add_init_script(("window.__PRE__=" + json.dumps(pre) + ";" if pre else "") + extra)
    ctx.add_init_script(mock)
    ctx.route("**/fonts.googleapis.com/**", lambda r: r.abort())
    ctx.route("**/fonts.gstatic.com/**", lambda r: r.abort())
    p = ctx.new_page()
    errs = []
    p.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)))
    p.on("console", lambda m: errs.append("CONSOLE " + m.type + " " + m.text) if m.type in ("error", "warning") else None)
    p.on("dialog", lambda d: d.accept())
    p.goto("file://" + ROOT + "/test/index.html")
    p.wait_for_selector("#page", timeout=8000)
    p.wait_for_timeout(400)
    return p, errs

def store(p):
    return p.evaluate("Object.fromEntries(window.__store)")

def shot(p, name, full=True):
    p.screenshot(path=f"{OUT}/{name}.png", full_page=full)

if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "basic"
    with sync_playwright() as pw:
        b = pw.chromium.launch(**({"executable_path": os.environ["CHROMIUM_PATH"]} if os.environ.get("CHROMIUM_PATH") else {}))
        exec(open(ROOT + "/test/scenario_" + which + ".py", encoding="utf-8").read())
        b.close()
