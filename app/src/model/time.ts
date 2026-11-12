// Dates are local calendar days written YYYY-MM-DD; times are minutes from midnight.

export const DAY_START = 7 * 60
export const DAY_END = 21 * 60
export const SNAP = 15

export function iso(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function fromIso(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(s: string, n: number): string {
  const d = fromIso(s)
  d.setDate(d.getDate() + n)
  return iso(d)
}

/** Monday of the week holding s */
export function weekStart(s: string): string {
  const d = fromIso(s)
  const dow = (d.getDay() + 6) % 7
  return addDays(s, -dow)
}

export const snap = (m: number, step = SNAP) => Math.round(m / step) * step
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** 9:00, 13:30 → "9:00", "1:30" with am/pm handled by fmtRange */
export function fmtTime(min: number, withPeriod = true): string {
  const h24 = Math.floor(min / 60) % 24
  const m = min % 60
  const h = h24 % 12 === 0 ? 12 : h24 % 12
  const period = h24 < 12 ? 'am' : 'pm'
  return `${h}:${`${m}`.padStart(2, '0')}${withPeriod ? ` ${period}` : ''}`
}

export function fmtHour(min: number): string {
  const h24 = Math.floor(min / 60)
  const h = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h} ${h24 < 12 ? 'am' : 'pm'}`
}

/** "9:00 – 11:00 am", "11:30 am – 1:00 pm" */
export function fmtRange(start: number, dur: number): string {
  const end = start + dur
  const samePeriod = (start < 720) === (end < 720)
  return samePeriod ? `${fmtTime(start, false)} – ${fmtTime(end)}` : `${fmtTime(start)} – ${fmtTime(end)}`
}

/** 90 → "1 h 30 m", 45 → "45 m", 120 → "2 h" */
export function fmtDur(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h && m) return `${h} h ${m} m`
  if (h) return `${h} h`
  return `${m} m`
}

/** Hours with one decimal where needed: 150 → "2.5" */
export function fmtHours(min: number): string {
  const h = Math.round((min / 60) * 10) / 10
  return Number.isInteger(h) ? `${h}` : h.toFixed(1)
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const dayName = (s: string) => DAYS[fromIso(s).getDay()]
export const dayShort = (s: string) => DAYS[fromIso(s).getDay()].slice(0, 3)

/** "Thursday 12 November" */
export function fmtDate(s: string): string {
  const d = fromIso(s)
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

/** "12 Nov" */
export function fmtShortDate(s: string): string {
  const d = fromIso(s)
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`
}

/** "9 – 15 November" or "30 November – 6 December" */
export function fmtWeek(start: string): string {
  const a = fromIso(start)
  const b = fromIso(addDays(start, 6))
  if (a.getMonth() === b.getMonth()) return `${a.getDate()} – ${b.getDate()} ${MONTHS[b.getMonth()]}`
  return `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]}`
}

export const pad2 = (n: number) => `${n}`.padStart(2, '0')

/** Seconds → "24:05" */
export function fmtClock(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  return h ? `${h}:${pad2(m)}:${pad2(r)}` : `${pad2(m)}:${pad2(r)}`
}
