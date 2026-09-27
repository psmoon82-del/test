import glob, os
root = os.path.dirname(os.path.abspath(__file__))
css = open(os.path.join(root, 'src/styles.css'), encoding='utf-8').read()
js = "\n".join(open(f, encoding='utf-8').read() for f in sorted(glob.glob(os.path.join(root, 'src/js/*.js'))))
html = (
 '<title>Atlas 나의 지도책</title>\n'
 '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
 '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Gowun+Batang:wght@400;700&display=swap">\n'
 '<style>\n' + css + '\n</style>\n'
 '<div id="app"></div>\n'
 '<script>\n(function(){\n"use strict";\n' + js + '\n})();\n</script>\n'
)
out = os.path.join(root, 'dist/lifedock.html')
open(out, 'w', encoding='utf-8').write(html)
open(os.path.join(root, 'dist/app.check.js'),'w',encoding='utf-8').write('(function(){\n"use strict";\n' + js + '\n})();')
print(out, len(html.encode()))
