import { parse } from '../app/src/model/parse'
const today = '2026-11-12' // Thursday
const cases: [string, Partial<ReturnType<typeof parse>>][] = [
  ['Write launch email 90m tomorrow 9am', { title: 'Write launch email', dur: 90, date: '2026-11-13', start: 540, kind: 'deep' }],
  ['Call with Ana 30m 3pm', { title: 'Call with Ana', dur: 30, date: today, start: 900, kind: 'meeting' }],
  ['Lunch walk at noon 1h', { title: 'Lunch walk', dur: 60, start: 720, kind: 'break' }],
  ['Expense report', { title: 'Expense report', dur: null, start: null, date: null, kind: 'shallow' }],
  ['Draft roadmap 1.5h friday 10:30', { title: 'Draft roadmap', dur: 90, date: '2026-11-13', start: 630 }],
  ['Sync on budget monday 2:30 45 min #meeting', { title: 'Sync on budget', dur: 45, date: '2026-11-16', start: 870, kind: 'meeting' }],
  ['Outline talk 1h30 #deep', { title: 'Outline talk', dur: 90, kind: 'deep' }],
  ['read research digest 45m', { title: 'Read research digest', dur: 45, kind: 'deep' }],
]
let fail = 0
for (const [input, want] of cases) {
  const got = parse(input, today) as Record<string, unknown>
  const bad = Object.entries(want).filter(([k, v]) => got[k] !== v)
  if (bad.length) { fail++; console.log('FAIL', input, JSON.stringify(got)) } else console.log('ok  ', input)
}
process.exit(fail ? 1 : 0)
