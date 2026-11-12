import type { Kind } from './types'
import { addDays, fromIso, iso } from './time'

// Quick add in plain words, worked out on the device:
// "Write pricing memo 90m tomorrow 9am" → block, tomorrow 9:00, 1 h 30 m, deep work.
// Without a time it becomes a task to schedule.

export interface Parsed {
  title: string
  dur: number | null
  date: string | null
  start: number | null
  kind: Kind
  /** Which kind words or tag decided the kind ("#deep", "call") */
  kindFrom: string | null
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const KIND_WORDS: [Kind, RegExp][] = [
  ['meeting', /\b(meet(ing)?|call|sync|1:1|one-on-one|interview|review with|catch[- ]up|stand-?up|retro|demo)\b/i],
  ['break', /\b(lunch|break|walk|gym|run|coffee|yoga|nap)\b/i],
  ['shallow', /\b(email|emails|inbox|admin|reply|replies|expenses?|invoice|book|booking|errand|slack|plan the day)\b/i],
]

export function parse(input: string, today: string): Parsed {
  let s = ` ${input.trim().replace(/\s+/g, ' ')} `
  let dur: number | null = null
  let date: string | null = null
  let start: number | null = null
  let kind: Kind = 'deep'
  let kindFrom: string | null = null

  const take = (re: RegExp, fn: (m: RegExpMatchArray) => void) => {
    const m = s.match(re)
    if (m) { fn(m); s = s.replace(m[0], ' ') }
  }

  // Tag wins over words
  take(/\s#(deep|shallow|meeting|meet|break)\b/i, (m) => {
    const k = m[1].toLowerCase()
    kind = (k === 'meet' ? 'meeting' : k) as Kind
    kindFrom = `#${k}`
  })

  // Duration: 90m, 90 min, 1h, 1.5h, 1h30, 2 hours
  take(/\s(?:for\s)?(\d+(?:\.\d+)?)\s?(h|hr|hrs|hour|hours)(?:\s?(\d{1,2})\s?(?:m|min|mins)?)?(?=\s)/i, (m) => {
    dur = Math.round(parseFloat(m[1]) * 60 + (m[3] ? parseInt(m[3], 10) : 0))
  })
  if (dur === null) take(/\s(?:for\s)?(\d{1,3})\s?(m|min|mins|minutes)(?=\s)/i, (m) => { dur = parseInt(m[1], 10) })

  // Day
  take(/\s(today|tonight)(?=\s)/i, () => { date = today })
  take(/\s(tomorrow|tmrw)(?=\s)/i, () => { date = addDays(today, 1) })
  take(/\s(?:on\s|next\s)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)(?=\s)/i, (m) => {
    const want = WEEKDAYS.findIndex((d) => d.startsWith(m[1].toLowerCase().slice(0, 3)))
    const have = fromIso(today).getDay()
    const ahead = (want - have + 7) % 7 || 7
    date = addDays(today, ahead)
  })

  // Time: 9am, 9:30, 14:00, at 3pm, noon
  take(/\s(?:at\s)?noon(?=\s)/i, () => { start = 12 * 60 })
  if (start === null)
    take(/\s(?:at\s)?(\d{1,2})(?::(\d{2}))?\s?(am|pm)(?=\s)/i, (m) => {
      let h = parseInt(m[1], 10) % 12
      if (m[3].toLowerCase() === 'pm') h += 12
      start = h * 60 + (m[2] ? parseInt(m[2], 10) : 0)
    })
  if (start === null)
    take(/\s(?:at\s)?(\d{1,2}):(\d{2})(?=\s)/i, (m) => {
      let h = parseInt(m[1], 10)
      if (h >= 1 && h <= 6) h += 12 // "at 3:30" in a workday means the afternoon
      start = h * 60 + parseInt(m[2], 10)
    })

  const title0 = s.replace(/\s(at|on|for)\s*$/i, ' ').trim()
  // Making something is deep work, whatever it is about ("Write launch email")
  const maker = title0.match(/^(write|draft|design|build|outline|research|refactor|prototype|analy[sz]e|study|code|edit)\b/i)
  if (!kindFrom && maker) kindFrom = maker[0].toLowerCase()
  if (!kindFrom) {
    for (const [k, re] of KIND_WORDS) {
      const m = title0.match(re)
      if (m) { kind = k; kindFrom = m[0].toLowerCase(); break }
    }
  }
  if (start !== null && date === null) date = today
  const title = title0.charAt(0).toUpperCase() + title0.slice(1)
  return { title, dur, date, start, kind, kindFrom }
}

export const DEFAULT_DUR: Record<Kind, number> = { deep: 90, shallow: 30, meeting: 30, break: 30 }

/** Example used for the field's placeholder and the demo */
export const EXAMPLE = 'Write launch email 90m tomorrow 9am'

export const todayIso = () => iso(new Date())
