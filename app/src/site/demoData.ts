import type { Block, Kind, Task } from '../model/types'

// Fixed sample data for the page's demos: one Thursday, so every run looks the same. Invented people and work.
export const DEMO_TODAY = '2026-11-12'

const t = (hm: string) => {
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + m
}

let n = 0
export function blk(start: string, dur: number, title: string, kind: Kind, extra: Partial<Block> = {}): Block {
  return { id: `d${++n}`, date: DEMO_TODAY, start: t(start), dur, title, kind, done: false, focused: 0, notes: '', ...extra }
}

export function task(id: string, title: string, est: number, kind: Kind): Task {
  return { id, title, est, kind }
}

/** The hero's day */
export const HERO_DAY: Block[] = [
  blk('8:30', 30, 'Plan the day', 'shallow'),
  blk('9:00', 120, 'Write Q3 pricing memo', 'deep', { notes: 'Lead with the two-tier option.' }),
  blk('11:00', 45, 'Design review with Mira', 'meeting'),
  blk('11:45', 45, 'Inbox and replies', 'shallow'),
  blk('12:30', 60, 'Lunch walk', 'break'),
  blk('13:30', 90, 'Refactor onboarding flow', 'deep'),
  blk('15:00', 30, '1:1 with Theo', 'meeting'),
  blk('15:30', 60, 'Review pull requests', 'shallow'),
  blk('16:30', 60, 'Draft hiring scorecard', 'deep'),
]

/** Plan demo: an afternoon with a 90-minute gap at 2 pm */
export const PLAN_DAY: Block[] = [
  blk('12:00', 30, 'Inbox and replies', 'shallow', { done: true }),
  blk('12:30', 60, 'Lunch walk', 'break', { done: true }),
  blk('13:30', 30, '1:1 with Theo', 'meeting'),
  blk('15:30', 60, 'Review pull requests', 'shallow'),
  blk('16:30', 30, 'Team sync', 'meeting'),
]
export const PLAN_TASKS: Task[] = [
  task('t1', 'Outline conference talk', 90, 'deep'),
  task('t2', 'Book venue for offsite', 15, 'shallow'),
  task('t3', 'Read research digest', 45, 'deep'),
]

/** Focus demo */
export const FOCUS_DAY: Block[] = [
  blk('7:15', 60, 'Read research digest', 'deep', { done: true, focused: 60 }),
  blk('8:30', 30, 'Plan the day', 'shallow', { done: true }),
  blk('9:00', 90, 'Write Q3 pricing memo', 'deep', { notes: 'Lead with the two-tier option. Numbers from the October export.' }),
  blk('10:30', 30, 'Inbox and replies', 'shallow'),
  blk('11:00', 45, 'Design review with Mira', 'meeting'),
  blk('11:45', 45, 'Outline conference talk', 'deep'),
]

/** Week demo: Monday 9 to Friday 13 November, with Thursday as today */
const wk = (date: string, rows: [string, number, string, Kind, boolean?][]) =>
  rows.map(([s, d, title, kind, done = true]) => blk(s, d, title, kind, { date, done, focused: kind === 'deep' && done ? d : 0 }))

export const WEEK_START = '2026-11-09'
export const WEEK_BLOCKS: Block[] = [
  ...wk('2026-11-09', [['9:00', 30, 'Weekly planning', 'shallow'], ['9:30', 120, 'Research synthesis', 'deep'], ['11:30', 60, 'Team sync', 'meeting'], ['12:30', 60, 'Lunch', 'break'], ['13:30', 120, 'Prototype checkout', 'deep', false], ['15:30', 60, 'Email and admin', 'shallow']]),
  ...wk('2026-11-10', [['8:30', 30, 'Plan the day', 'shallow'], ['9:00', 150, 'Pricing page wireframes', 'deep'], ['11:30', 30, 'Print shop call', 'meeting'], ['12:00', 60, 'Lunch', 'break'], ['13:00', 60, 'Customer interview', 'meeting'], ['14:00', 120, 'Interview notes', 'deep'], ['16:00', 45, 'Inbox', 'shallow']]),
  ...wk('2026-11-11', [['9:00', 90, 'Roadmap review', 'meeting'], ['10:30', 30, 'Inbox', 'shallow'], ['11:00', 90, 'Design system audit', 'deep', false], ['12:30', 60, 'Lunch walk', 'break'], ['13:30', 60, 'Partner sync', 'meeting'], ['14:30', 90, 'Icon clean-up', 'deep'], ['16:00', 60, 'Expenses', 'shallow']]),
  ...wk('2026-11-12', [['8:30', 30, 'Plan the day', 'shallow'], ['9:00', 120, 'Write Q3 pricing memo', 'deep'], ['11:00', 45, 'Design review', 'meeting'], ['11:45', 45, 'Inbox', 'shallow'], ['12:30', 60, 'Lunch walk', 'break'], ['13:30', 90, 'Refactor onboarding', 'deep', false], ['15:00', 30, '1:1 with Theo', 'meeting', false], ['16:30', 60, 'Hiring scorecard', 'deep', false]]),
  ...wk('2026-11-13', [['9:00', 30, 'Plan the day', 'shallow', false], ['9:30', 150, 'Conference talk outline', 'deep', false], ['13:00', 60, 'Team retro', 'meeting', false]]),
]

/** Quick add demo: tomorrow morning */
export const TOMORROW = '2026-11-13'
export const QA_DAY: Block[] = [
  blk('8:30', 30, 'Plan the day', 'shallow', { date: TOMORROW }),
  blk('10:30', 60, 'Team retro', 'meeting', { date: TOMORROW }),
]
