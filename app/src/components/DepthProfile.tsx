import { useId } from 'react'
import type { Block } from '../model/types'
import { profile, soundingPath } from '../model/derive'
import { DAY_END, DAY_START, fmtDur, fmtHour } from '../model/time'

const W = 1000

interface Props {
  blocks: Block[]
  /** Minute of the day for the now mark; null when the day shown is not today */
  now: number | null
  height?: number
  /** Hour labels under the profile */
  ticks?: boolean
  /** Small multiple (week review): no labels, thinner line */
  mini?: boolean
  className?: string
  /** Accessible summary; the drawing itself is decorative */
  label?: string
  /** The window drawn, in minutes of the day */
  from?: number
  to?: number
}

/**
 * The day as a depth sounding. Deep work dives, meetings and email stay near the surface. Done hours are solid,
 * planned hours hatched. A strip of kind colours along the surface ties the line back to the blocks below.
 */
export function DepthProfile({ blocks, now, height = 72, ticks = true, mini = false, className = '', label, from = DAY_START, to = DAY_END }: Props) {
  const uid = useId().replace(/:/g, '')
  const segs = profile(blocks, from, to)
  const { line, area } = soundingPath(segs, W, height, from, to)
  const x = (m: number) => ((m - from) / (to - from)) * W
  const pct = (m: number) => `${((m - from) / (to - from)) * 100}%`
  const doneSegs = segs.filter((s) => s.kind && s.done)
  const nowIn = now !== null && now >= from && now <= to
  const span = to - from
  const step = span > 480 ? 180 : span > 240 ? 120 : 60
  const hours: number[] = []
  for (let m = Math.ceil((from + 30) / step) * step; m < to - 20; m += step) hours.push(m)

  return (
    <div className={`depth ${mini ? 'depth--mini' : ''} ${className}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <div className="depth-surface" aria-hidden="true">
        {segs.filter((s) => s.kind).map((s) => (
          <span key={s.start} className={`depth-kind k-${s.kind}`} style={{ left: pct(s.start), width: `calc(${pct(s.end)} - ${pct(s.start)} - 2px)` }} />
        ))}
      </div>
      {!mini && (
        <div className="depth-axis" aria-hidden="true" style={{ height }}>
          <span>Surface</span>
          <span>Deep</span>
        </div>
      )}
      <svg className="depth-svg" viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" style={{ height }} aria-hidden="true">
        <defs>
          <linearGradient id={`g${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--k-deep-mark)" stopOpacity="0.14" />
            <stop offset="1" stopColor="var(--k-deep-mark)" stopOpacity="0.6" />
          </linearGradient>
          <pattern id={`h${uid}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="7" height="7" fill="var(--k-deep-mark)" fillOpacity="0.05" />
            <line x1="0" y1="0" x2="0" y2="7" stroke="var(--k-deep-mark)" strokeOpacity="0.32" strokeWidth="1.6" />
          </pattern>
          <clipPath id={`c${uid}`}>
            <path d={area} />
          </clipPath>
        </defs>
        {/* Below the line is water: hatched where planned, solid where done */}
        <g clipPath={`url(#c${uid})`}>
          <rect x="0" y="0" width={W} height={height} fill={`url(#h${uid})`} />
          {doneSegs.map((s) => (
            <rect key={s.start} x={x(s.start)} y="0" width={Math.max(0, x(s.end) - x(s.start))} height={height} fill={`url(#g${uid})`} className="depth-done" />
          ))}
        </g>
        <path d={line} className="depth-line" vectorEffect="non-scaling-stroke" />
      </svg>
      {nowIn && (
        <div className="depth-now" style={{ left: pct(now!) }} aria-hidden="true">
          <span className="depth-now-dot" />
        </div>
      )}
      {ticks && !mini && (
        <div className="depth-ticks" aria-hidden="true">
          {hours.map((m) => (
            <span key={m} style={{ left: pct(m) }}>{fmtHour(m)}</span>
          ))}
        </div>
      )}
    </div>
  )
}

export function depthSummary(blocks: Block[]): string {
  const deep = blocks.filter((b) => b.kind === 'deep')
  const planned = deep.reduce((a, b) => a + b.dur, 0)
  const done = deep.filter((b) => b.done).reduce((a, b) => a + b.dur, 0)
  if (!planned) return 'No deep work planned.'
  return `${fmtDur(planned)} of deep work planned, ${fmtDur(done)} done.`
}
