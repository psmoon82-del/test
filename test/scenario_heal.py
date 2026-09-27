pre = '{"data/users/u_testuser000000000000000/profile":{"v":3,"rev":0,"basics":{"name":""},"facts":[],"thoughts":{"items":[]},"ipip":{"answers":{}}},"data/users/u_testuser000000000000000/log":{"items":[]}}'
p, errs = mkpage(b, 1280, 900, extra="window.__PRE__=" + pre + ";")
p.wait_for_timeout(800)
print(p.evaluate("document.querySelector('h1').textContent"), errs)
p2, e2 = mkpage(b, 1280, 900, extra="window.__PRE__=" + pre + ";window.__NOT_OWNER__=true;")
p2.wait_for_timeout(800)
print(p2.evaluate("document.querySelector('h1').textContent"))
