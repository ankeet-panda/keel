import type { Block, Data, Kind, Task } from './types'
import { addDays, fromIso } from './time'

type Row = [start: string, dur: number, title: string, kind: Kind, notes?: string]

const t = (hm: string) => {
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + m
}

// A believable week for one person: a product designer who protects mornings for deep work.
const TODAY: Row[] = [
  ['8:30', 30, 'Plan the day', 'shallow'],
  ['9:00', 120, 'Write Q3 pricing memo', 'deep', 'Lead with the two-tier option. Numbers from the October export.'],
  ['11:00', 45, 'Design review with Mira', 'meeting'],
  ['11:45', 45, 'Inbox and replies', 'shallow'],
  ['12:30', 60, 'Lunch walk', 'break'],
  ['13:30', 90, 'Refactor onboarding flow', 'deep'],
  ['15:00', 30, '1:1 with Theo', 'meeting'],
  ['15:30', 60, 'Review pull requests', 'shallow'],
  ['16:30', 60, 'Draft hiring scorecard', 'deep'],
]

// Earlier days of the week: what was planned (done is decided below, so the week has an honest shape)
const WEEK: Row[][] = [
  [
    ['9:00', 30, 'Weekly planning', 'shallow'],
    ['9:30', 120, 'Research synthesis', 'deep'],
    ['11:30', 60, 'Team stand-up and sync', 'meeting'],
    ['12:30', 60, 'Lunch', 'break'],
    ['13:30', 120, 'Prototype checkout states', 'deep'],
    ['15:30', 60, 'Email and admin', 'shallow'],
  ],
  [
    ['8:30', 30, 'Plan the day', 'shallow'],
    ['9:00', 150, 'Pricing page wireframes', 'deep'],
    ['11:30', 30, 'Call with the print shop', 'meeting'],
    ['12:00', 60, 'Lunch', 'break'],
    ['13:00', 60, 'Customer interview', 'meeting'],
    ['14:00', 120, 'Write interview notes', 'deep'],
    ['16:00', 45, 'Inbox and replies', 'shallow'],
  ],
  [
    ['9:00', 90, 'Roadmap review', 'meeting'],
    ['10:30', 30, 'Inbox and replies', 'shallow'],
    ['11:00', 90, 'Design system audit', 'deep'],
    ['12:30', 60, 'Lunch walk', 'break'],
    ['13:30', 60, 'Partner sync', 'meeting'],
    ['14:30', 90, 'Icon set clean-up', 'deep'],
    ['16:00', 60, 'Expense reports', 'shallow'],
  ],
  [
    ['8:30', 30, 'Plan the day', 'shallow'],
    ['9:00', 120, 'Onboarding flow, first pass', 'deep'],
    ['11:00', 60, 'Product critique', 'meeting'],
    ['12:00', 60, 'Lunch', 'break'],
    ['13:00', 120, 'Usability test script', 'deep'],
    ['15:00', 30, '1:1 with Ana', 'meeting'],
    ['15:30', 60, 'Review pull requests', 'shallow'],
  ],
]

// Share of planned deep work each earlier weekday actually got (by row index), so the review has a story
const DONE_SHARE = [[1, 1, 1, 1, 0.5, 1], [1, 1, 1, 1, 1, 1, 1], [1, 1, 0.66, 1, 1, 0, 1], [1, 1, 1, 1, 0.75, 1, 1]]

const TASKS: [string, number, Kind][] = [
  ['Outline conference talk', 90, 'deep'],
  ['Book venue for team offsite', 15, 'shallow'],
  ['Read research digest', 45, 'deep'],
  ['Sync with finance on budget', 30, 'meeting'],
]

export function seed(today: string, nowMin: number): Data {
  let n = 0
  const id = (p: string) => `${p}${(++n).toString(36)}`
  const blocks: Block[] = []
  const make = (date: string, [s, dur, title, kind, notes]: Row, done: boolean, focused: number): Block => ({
    id: id('b'), date, start: t(s), dur, title, kind, done, focused, notes: notes ?? '',
  })

  const dow = (fromIso(today).getDay() + 6) % 7 // 0 Monday
  // Earlier days this week (and the week before, so the week view never starts empty on a Monday)
  for (let back = 1; back <= 7 + dow; back++) {
    const date = addDays(today, -back)
    const wd = (fromIso(date).getDay() + 6) % 7
    if (wd > 4) continue
    const rows = WEEK[wd % WEEK.length]
    const share = DONE_SHARE[wd % DONE_SHARE.length]
    rows.forEach((r, i) => {
      const s = share[i] ?? 1
      blocks.push(make(date, r, s > 0, r[3] === 'deep' ? Math.round(r[1] * s) : 0))
    })
  }

  for (const r of TODAY) {
    const end = t(r[0]) + r[1]
    const done = end <= nowMin
    blocks.push(make(today, r, done, done && r[3] === 'deep' ? r[1] : 0))
  }

  // Tomorrow has a light start, so there is room to plan into
  const tomorrow = addDays(today, 1)
  blocks.push(make(tomorrow, ['9:00', 30, 'Plan the day', 'shallow'], false, 0))
  blocks.push(make(tomorrow, ['10:00', 60, 'Team retro', 'meeting'], false, 0))

  const tasks: Task[] = TASKS.map(([title, est, kind]) => ({ id: id('t'), title, est, kind }))
  return { v: 1, blocks, tasks }
}
