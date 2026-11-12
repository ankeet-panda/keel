# Keel: hand-over record

## Direction
- Feeling: unhurried, exact, deep. Direction "Deep water on paper": warm paper ground, quiet chrome, one deep-water
  ink for focus; kinds of work carry one colour each (deep water, sea-glass, coral, sage).
- Signature: the depth profile (the day drawn as a depth sounding; deep work dives, meetings and email stay near the
  surface; done hours solid, planned hours hatched). Recurs in the hero, every demo, the week's small multiples.
- Surfaces: Operate (planner), Persuade (product page). Picked after seeing the rendered
  Today screen in light and dark.

## Assumptions
- Persona: a knowledge worker planning at 8:30 on a laptop. Week starts Monday. 12-hour clock with am/pm.
- Sample data is invented (people, work, numbers); the footer says so.
- Quick add guesses kind from words; "making" verbs (write, draft, design…) mean deep work.

## Applied rules
- Tokens only (`app/src/styles/tokens.css`); spacing on the 4/8 scale; radius ladder 6/10/16/24/999; flat pill buttons.
- Taste profile applied: warm-but-premium (one deep object), heading marks and tinted kind icons in own projects,
  flat-sweep ring and bars (hue turn 23°), hatched planned vs solid done, never truncate in product chrome.
- Interaction recipes: none used. Toasts with Undo are a small in-house list (no Sonner install, to keep the build
  dependency-free); MorphButton not matched (no label-changing buttons). Noted as a deviation from "recipes first".
- Demos: kit Stage with Keel's real components; one story per demo; pause control; plays only near/in view; poster
  under reduced motion; resets caused by a visible Undo click; cursor returns to rest (no seam).
- Ground pacing: the focus section is a deep band (taste D2, rich pages only).

## Checks (2026-11-06, built file `publish/keel-local.html` served on 127.0.0.1:5222)
- Type check clean. Production build clean. Lint: 0 FAIL, 4 WARN kept (two sticky bars on different routes, never
  together; six shadow recipes = rest/float/overlay plus rings; in-page anchor nav has no "current page"; one hatched
  bar WARN waived as data encoding), 3 waived with reasons in source.
- End-to-end: `tests/flows.py` 23/23 on dev and on the built file (drag, quick add, edit, delete + undo, keyboard move,
  focus timer, week, theme, persistence across reload, no console errors). Parser tests 8/8.
- Render check, Chromium + WebKit, light + dark, 1440 + 390, axe, keyboard/states/interact/reduced/stress (+nojs, perf
  on the page). Planner: clean at all sizes and schemes except the stress rows below. Page: see open items.
- Fresh-eye review (separate reviewer, screenshots only): disposition `fix`, 12 findings; see "Review".

## Open items (failing gate lines, kept with reasons)
1. stress-clip / stress-overlap at 320 px with 125% text or WCAG 1.4.12 spacing: timeline block text is clipped,
   because a block's height is its duration. Short blocks drop their time line by container query; the full text stays
   in each block's accessible name and the editor. Same trade-off every calendar makes. FAILING, recorded.
2. Page performance at 4x CPU: LCP 1.2 s desktop, 3.4 s phone (budget 2.5 s); long tasks and 6% slow frames while
   demos mount during scroll. Mitigations shipped: prerendered page text, demos mount near view, hero redraws per
   minute. FAILING on phone.
3. nojs: 71–76% of text visible without JavaScript; the rest is text inside demo pictures. FAILING (marketing).
4. content-lost-reduced: the hero's moving clock text and its Pause button do not exist under reduced motion (nothing
   moves). Checker compares text; this is by design.
5. svg-paint-clipped: proved a checker artefact of the moving hero (the check diffs two screenshots taken while the
   clock runs; with the hero still, light mode is clean, and a repeat of the dark run is clean).
Score: **failing** on items 1–3 by the gate's rules; no Floor item on colour, contrast, focus, targets or keyboard fails.

## Review (fresh-eye, disposition `fix`)
| # | Finding | Status |
|---|---|---|
| 1 | Phone time column cut ("0 am") | resolved (48 px column) |
| 2 | Hero pause pill over a block on phone | resolved (sits under the plate) |
| 3 | Rings read "0 h" | resolved (hero opens at 11:10 with 2 h done; focus demo opens at 1 h) |
| 4 | Demos open on the "before" frame | partial: week demo opens drawn; plan and quick-add keep "No deep work yet" as their honest before-state |
| 5 | Resets look like un-doing | not a fault: each reset clicks Undo (1 fps sheets missed it) |
| 6 | Toasts cover content | resolved (shorter, moved to empty space; quick-add day has room) |
| 7 | Crops cut words / 1 h 30 vs 1 h 28 | resolved (taller stages; the numbers already matched) |
| 8 | Sections are one template; icon tiles in the depth key | partial: focus is now a full-width deep band; kind icons kept (a deliberate preference for category lists) |
| 9 | Dark meetings muddy; live block blends | resolved (coral tint hue 22; live fill lighter than deep tint, calm chroma) |
| 10 | Week: Saturday text, Sunday missing, floating card | resolved (No deep work; seven days in the app; wider card); gradient bars kept (flat sweep, taste) |
| 11 | Phone gaps | partial (quick-add gap reduced; app side columns end early by design) |
| 12 | Break bar is a dot; empty ring at start | kept: both are the true values |

## Not checked
- Real iOS Safari and a real touch device (drag a task by finger is built with pointer events; untested on hardware).
- Firefox (not installed). Screen readers (VoiceOver/NVDA) by ear. Long-term data (months of blocks).
- Render receipts: the receipts tool works only for local files; checks ran on the served file.

## Slots and samples
- No slots. All sample data invented; marked in the footer. Example address none used.

## Status
Prototype, version 1 (2026-11-06).
