import { useId } from 'react'
import { CalendarRange } from 'lucide-react'
import type { Block } from '../model/types'
import { dayBlocks, dayStats } from '../model/derive'
import { addDays, dayName, dayShort, fmtDur, fmtHours, fmtShortDate } from '../model/time'
import { DepthProfile } from './DepthProfile'

interface Props {
  blocks: Block[]
  start: string
  today: string
  /** Fraction of each done bar drawn (0–1), for the demo's draw-on; 1 in the app */
  reveal?: number
  /** Days shown from Monday: 7 in the app, 5 in the page demo */
  days?: number
  onOpenDay?(date: string): void
}

export function weekSummary(blocks: Block[], start: string, today: string, shownDays = 7) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const rows = days.map((date) => {
    const bs = dayBlocks(blocks, date)
    return { date, blocks: bs, ...dayStats(bs) }
  })
  const work = rows.filter((r) => r.planned > 0 || r.date <= today)
  const shown = rows.filter((_r, i) => i < shownDays)
  const planned = rows.reduce((a, r) => a + r.deepPlanned, 0)
  const done = rows.reduce((a, r) => a + r.deepDone, 0)
  const past = rows.filter((r) => r.date < today && r.deepPlanned > 0)
  const best = [...past].sort((a, b) => b.deepDone - a.deepDone)[0]
  const kept = past.filter((r) => r.deepDone >= r.deepPlanned).length
  const max = Math.max(60, ...rows.map((r) => Math.max(r.deepPlanned, r.deepDone)))
  return { rows: shown, work, planned, done, best, kept, pastCount: past.length, max }
}

export function WeekView({ blocks, start, today, reveal = 1, days = 7, onOpenDay }: Props) {
  const hid = useId()
  const s = weekSummary(blocks, start, today, days)
  const pct = s.planned ? Math.round((s.done / s.planned) * 100) : 0
  return (
    <section className="card week" aria-labelledby={hid}>
      <div className="card-head">
        <span className="mark" aria-hidden="true"><CalendarRange size={15} strokeWidth={1.75} /></span>
        <h2 id={hid} className="card-title">Deep work this week</h2>
      </div>
      <div className="week-top">
        <div className="week-stat">
          <span className="week-num">{fmtHours(s.done)}<span className="week-unit"> h</span></span>
          <span className="week-of">done of {fmtHours(s.planned)} h planned · {pct}%</span>
        </div>
        <p className="week-insight">
          {s.best ? (
            <>
              <strong>{dayName(s.best.date)} went deepest</strong>, with {fmtDur(s.best.deepDone)} of focus.{' '}
              {s.pastCount > 0 && `You kept your deep-work plan on ${s.kept} of ${s.pastCount} days so far.`}
            </>
          ) : (
            'The first finished day of the week will show here.'
          )}
        </p>
      </div>

      <div className="week-legend" aria-hidden="true">
        <span><i className="lg lg-done" />Done</span>
        <span><i className="lg lg-plan" />Planned</span>
      </div>

      <ol className="week-rows">
        {s.rows.map((r) => {
          const isToday = r.date === today
          const future = r.date > today
          const label = `${dayName(r.date)}: ${fmtDur(r.deepDone)} of ${fmtDur(r.deepPlanned)} deep work${future ? ' planned' : ''}`
          const Row = onOpenDay ? 'button' : 'div'
          return (
            <li key={r.date}>
              <Row data-target={`row-${r.date}`} className={`week-row${isToday ? ' is-today' : ''}`} {...(onOpenDay ? { type: 'button' as const, onClick: () => onOpenDay(r.date), 'aria-label': `${label}. Open day` } : { 'aria-label': label })}>
                <span className="week-day">
                  <span className="week-dname">{dayShort(r.date)}</span>
                  <span className="week-date">{isToday ? 'Today' : fmtShortDate(r.date)}</span>
                </span>
                <span className="week-bar" aria-hidden="true">
                  <span className="week-plan" style={{ width: `${(r.deepPlanned / s.max) * 100}%` }} />
                  {r.deepDone > 0 && <span className="week-done" style={{ width: `${(r.deepDone / s.max) * 100}%`, clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0 round 999px)` }} />}
                </span>
                <span className="week-val">
                  {r.deepPlanned || r.deepDone ? (
                    <>
                      <b>{fmtHours(r.deepDone)}</b> / {fmtHours(r.deepPlanned)} h
                    </>
                  ) : (
                    <span className="week-none">{r.planned ? 'No deep work' : 'Nothing planned'}</span>
                  )}
                </span>
                <span className="week-profile" aria-hidden="true">
                  <DepthProfile blocks={r.blocks} now={null} height={30} mini />
                </span>
              </Row>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
