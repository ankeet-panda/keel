"""Stitch the production build into one self-contained page for the shared link.

Usage (from this folder):
  node app/node_modules/vite/bin/vite.js build app
  python -I package.py
Writes publish/keel.html (artifact body: title, fonts, inlined CSS and JS) and publish/keel-local.html (full page,
open it in a browser; fonts need internet). No other outside requests.
"""
import glob
import os

HERE = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(HERE, 'app', 'dist')

css_files = glob.glob(os.path.join(DIST, 'assets', '*.css'))
js_files = glob.glob(os.path.join(DIST, 'assets', '*.js'))
assert len(css_files) == 1 and len(js_files) == 1, (css_files, js_files)
css = open(css_files[0], encoding='utf-8').read()
js = open(js_files[0], encoding='utf-8').read()
assert 'url(/' not in css and 'url("/' not in css, 'an asset was not inlined'
js = js.replace('</script', r'<\/script')
css = css.replace('</style', r'<\/style')

FONTS = ('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500'
         '&family=Hanken+Grotesk:wght@400;500;600&display=swap')
# Theme before first paint, and the prerendered first screen (tools/snapshot.py) unless the planner is opening
EARLY = ('<script>(function(){var c;try{c=localStorage.getItem("keel.theme")}catch(e){}'
         'var q=new URLSearchParams(location.search).get("theme");c=q||c||"system";'
         'var d=c==="dark"||(c==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);'
         'document.documentElement.dataset.theme=d?"dark":"light"})()</script>')
snap_path = os.path.join(HERE, 'publish', 'first-screen.html')
first = open(snap_path, encoding='utf-8').read() if os.path.exists(snap_path) else ''
DROP = '<script>if(location.hash.indexOf("#/app")===0)document.getElementById("root").innerHTML=""</script>'

page = f'''<title>Keel</title>
<link rel="icon" href="data:,">
<meta name="description" content="Keel: a focus and time-blocking planner. Plan the day in blocks, then go deep.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
{EARLY}
<style>{css}</style>
<div id="root">{first}</div>
{DROP}
<script type="module">{js}</script>
'''
os.makedirs(os.path.join(HERE, 'publish'), exist_ok=True)
out = os.path.join(HERE, 'publish', 'keel.html')
open(out, 'w', encoding='utf-8', newline='\n').write(page)
full = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        f'{page}</html>\n')
open(os.path.join(HERE, 'publish', 'keel-local.html'), 'w', encoding='utf-8', newline='\n').write(full)
print(out, f'{len(page.encode("utf-8")) / 1024:.0f} KB')
