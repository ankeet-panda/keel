"""Drives the working planner end to end in a real browser and prints one line per check.
Usage: python -I tests/flows.py [base_url]   (default http://127.0.0.1:5220/)
"""
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:5220/'
results = []


def check(name, ok, detail=''):
    results.append(ok)
    print(('ok   ' if ok else 'FAIL ') + name + (f'  [{detail}]' if detail and not ok else ''))


with sync_playwright() as p:
    b = p.chromium.launch(channel='msedge')
    pg = b.new_page(viewport={'width': 1440, 'height': 900})
    errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: m.type == 'error' and errors.append(m.text))
    pg.goto(BASE + '?at=10:40#/app')
    pg.wait_for_selector('.tl-block')
    pg.wait_for_timeout(500)

    # 1 Drag a task into the day
    pg.locator('.tl').evaluate('el => el.scrollTo(0, 64*9)')
    pg.wait_for_timeout(200)
    task = pg.locator('.task', has_text='Outline conference talk')
    tb = task.locator('.task-body').bounding_box()
    grid = pg.locator('.tl-grid').bounding_box()
    ty = grid['y'] + (18 - 7) * 64 + 40  # 6 pm row
    tx = grid['x'] + 200
    sx, sy = tb['x'] + 40, tb['y'] + 10
    pg.mouse.move(sx, sy)
    pg.mouse.down()
    for i in range(1, 16):
        pg.mouse.move(sx + (tx - sx) * i / 15, sy + (ty - sy) * i / 15)
        pg.wait_for_timeout(16)
    ghost = pg.locator('.task-ghost').count()
    preview = pg.locator('.tl-preview').count()
    pg.mouse.up()
    pg.wait_for_timeout(400)
    check('drag shows a ghost and a preview', ghost == 1 and preview == 1, f'ghost={ghost} preview={preview}')
    blk = pg.locator('.tl-block', has_text='Outline conference talk')
    check('dropped task becomes a block', blk.count() == 1)
    check('task left the To schedule list', pg.locator('.task', has_text='Outline conference talk').count() == 0)
    label = blk.text_content() if blk.count() else ''
    check('dropped near 6 pm', '6:' in (label or '') or '5:' in (label or ''), label)
    check('editor opens on the new block', pg.locator('#ed-title').count() == 1 and pg.locator('#ed-title').input_value() == 'Outline conference talk')

    # 2 Quick add in plain words
    pg.keyboard.press('Escape')
    pg.locator('.qa-input').fill('Call with Ana 30m 4:30pm')
    chips = pg.locator('.qa-chip').all_inner_texts()
    check('quick add shows parsed chips', any('Meeting' in c for c in chips) and any('30 m' in c for c in chips), str(chips))
    pg.keyboard.press('Enter')
    pg.wait_for_timeout(300)
    qa = pg.locator('.tl-block', has_text='Call with Ana')
    check('quick add makes a block at 4:30', qa.count() == 1 and '4:30' in (qa.text_content() or ''))
    pg.locator('.qa-input').fill('Renew passport')
    pg.keyboard.press('Enter')
    pg.wait_for_timeout(200)
    check('quick add without a time goes to To schedule', pg.locator('.task', has_text='Renew passport').count() == 1)

    # 3 Edit, delete, undo
    pg.locator('.tl-block', has_text='Lunch walk').click()
    pg.wait_for_timeout(200)
    pg.locator('.kind-opt', has_text='Meeting').click()
    check('changing kind recolours the block', 'k-meeting' in (pg.locator('.tl-block', has_text='Lunch walk').get_attribute('class') or ''))
    pg.locator('button', has_text='Delete block').click()
    pg.wait_for_timeout(200)
    check('delete removes the block', pg.locator('.tl-block', has_text='Lunch walk').count() == 0)
    pg.locator('.toast-undo').first.click()
    pg.wait_for_timeout(200)
    check('undo restores it', pg.locator('.tl-block', has_text='Lunch walk').count() == 1)

    # 4 Keyboard move
    b2 = pg.locator('.tl-block', has_text='Review pull requests')
    before = b2.text_content()
    b2.focus()
    pg.keyboard.press('ArrowDown')
    pg.wait_for_timeout(200)
    after = pg.locator('.tl-block', has_text='Review pull requests').text_content()
    check('arrow key moves a block 15 minutes', before != after and '3:45' in after, after)

    # 5 Focus mode
    pg.keyboard.press('Escape')
    pg.locator('[data-target="start-focus"]').click()
    pg.wait_for_selector('.focus-layer')
    c1 = pg.locator('.focus-clock').inner_text()
    pg.wait_for_timeout(2300)
    c2 = pg.locator('.focus-clock').inner_text()
    check('focus timer counts down', c1 != c2, f'{c1} -> {c2}')
    pg.locator('[data-target="focus-add"]').click()
    pg.wait_for_timeout(300)
    c3 = pg.locator('.focus-clock').inner_text()
    check('+5 min adds time', c3 > c2 or len(c3) > len(c2), f'{c2} -> {c3}')
    check('focus layer is a modal dialog', pg.locator('.focus-layer[role=dialog][aria-modal=true]').count() == 1)
    pg.locator('[data-target="focus-finish"]').click()
    pg.wait_for_timeout(300)
    check('finish closes focus', pg.locator('.focus-layer').count() == 0)
    live = pg.locator('.tl-block', has_text='Write Q3 pricing memo')
    check('finished block is marked done', 'is-done' in (live.get_attribute('class') or ''))

    # 6 Week view
    pg.locator('.seg-btn', has_text='Week').click()
    pg.wait_for_timeout(300)
    rows = pg.locator('.week-row').count()
    check('week view lists the days', rows >= 5, str(rows))
    ins = pg.locator('.week-insight').inner_text()
    check('week view has a summary sentence', 'went deepest' in ins or 'first finished' in ins, ins)
    pg.locator('.week-row').first.click()
    pg.wait_for_timeout(200)
    check('a week row opens its day', pg.locator('.seg-btn[aria-selected=true]').inner_text() == 'Day')

    # 7 Theme
    pg.locator('[aria-label="Dark theme"]').click()
    check('dark theme switch', pg.evaluate('document.documentElement.dataset.theme') == 'dark')
    pg.locator('[aria-label="Light theme"]').click()

    # 8 Persistence (unpinned clock saves to the device)
    pg2 = b.new_page()
    pg2.goto(BASE + '#/app')
    pg2.wait_for_selector('.tl-block, .tasks')
    pg2.locator('.qa-input').fill('Persistence check 30m')
    pg2.keyboard.press('Enter')
    pg2.wait_for_timeout(300)
    pg2.reload()
    pg2.wait_for_selector('.task')
    check('data survives a reload', pg2.locator('.task', has_text='Persistence check').count() == 1)
    pg2.evaluate("localStorage.removeItem('keel.data.v1')")

    check('no console errors', not errors, '; '.join(errors[:3]))
    b.close()

print(f'{sum(results)}/{len(results)} passed')
sys.exit(0 if all(results) else 1)
