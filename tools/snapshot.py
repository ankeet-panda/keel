"""Prerender the top of the product page (nav + hero) from the built page, so the shared file paints it before
its script runs (a faster first screen). React replaces it on start with identical markup.
Usage (with keel-publish-check serving publish/ on 5222): python -I tools/snapshot.py
Writes publish/first-screen.html, which package.py then inlines into #root.
"""
import os
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with sync_playwright() as p:
    b = p.chromium.launch(channel='msedge')
    pg = b.new_page(viewport={'width': 1440, 'height': 900})
    # Hold every clock so the hero is captured at its first frame (8:40), as a visitor first sees it
    pg.add_init_script('window.setInterval = () => 0')
    pg.goto('http://127.0.0.1:5222/keel-local.html?theme=light')
    pg.wait_for_selector('.hero-visual .tl-block')
    pg.wait_for_timeout(800)
    html = pg.evaluate("""() => {
      const site = document.querySelector('.site').cloneNode(true)
      // Demo stages are pictures that need the script: ship their place, not their markup
      site.querySelectorAll('.demo-stage').forEach((d) => { d.innerHTML = '<div class="demo-ph"></div>' })
      return site.outerHTML
    }""")
    b.close()
# The prerender is a picture until React starts: no ids that could clash, nothing focusable
import re
html = re.sub(r'\sid="[^"]*"', '', html)
html = re.sub(r'\saria-labelledby="[^"]*"', '', html)
out = os.path.join(HERE, 'publish', 'first-screen.html')
open(out, 'w', encoding='utf-8', newline='\n').write(html)
print(out, f'{len(html) / 1024:.0f} KB')
