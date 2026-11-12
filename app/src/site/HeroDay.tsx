import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { useReducedMotion } from '@kit/reduced-motion'
import { DepthProfile, depthSummary } from '../components/DepthProfile'
import { Timeline } from '../components/Timeline'
import { Glance } from '../components/SidePanel'
import { dayStats } from '../model/derive'
import { fmtDur } from '../model/time'
import { HERO_DAY } from './demoData'

const START = 11 * 60 + 10
const END = 14 * 60 + 50
const STILL = 13 * 60 + 50
const MIN_PER_SEC = 7
/** Product pictures are not controls: nothing inside takes focus or clicks */
export const INERT = { inert: '' } as object

/** The hero: a real day in the planner, its clock running fast so the now line walks through the morning once */
export function HeroDay() {
  const reduced = useReducedMotion()
  const box = useRef<HTMLDivElement>(null)
  const [now, setNow] = useState(START)
  const [visible, setVisible] = useState(false)
  const [paused, setPaused] = useState(false)
  const shown = reduced ? STILL : Math.floor(now)
  const finished = now >= END

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 })
    if (box.current) io.observe(box.current)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (reduced || paused || !visible || finished) return
    // The clock runs on a timer and redraws only when its minute changes
    let exact = now
    let last = performance.now()
    const i = window.setInterval(() => {
      const t = performance.now()
      exact = Math.min(END, exact + ((t - last) / 1000) * MIN_PER_SEC)
      last = t
      setNow(Math.floor(exact))
    }, 1000 / MIN_PER_SEC)
    return () => window.clearInterval(i)
  }, [reduced, paused, visible, finished]) // eslint-disable-line react-hooks/exhaustive-deps

  const blocks = HERO_DAY.map((b) => {
    const done = b.start + b.dur <= shown
    return { ...b, done, focused: done && b.kind === 'deep' ? b.dur : 0 }
  })
  const st = dayStats(blocks)

  return (
    <div className="hero-wrap" ref={box}>
    <div className="hero-visual">
      <div className="hero-day card" aria-label={`A sample day in Keel. ${depthSummary(blocks)}`} role="img">
        <div className="day-head">
          <div className="card-title">Depth of the day</div>
          <span className="day-meta">{fmtDur(st.deepPlanned)} deep · {fmtDur(st.planned)} planned</span>
        </div>
        <DepthProfile blocks={blocks} now={shown} height={64} />
        <Timeline blocks={blocks} now={shown} from={10 * 60 + 15} to={16 * 60 + 15} hour={60} interactive={false} className="hero-tl" />
      </div>
      <div className="hero-glance" aria-hidden="true">
        <Glance blocks={blocks} now={shown} isToday interactive={false} onFocus={() => {}} onSelect={() => {}} />
      </div>
    </div>
      <div className="hero-controls">
        <span className="hero-caption">{reduced ? 'Sample day' : 'Sample day, clock sped up'}</span>
        {!reduced && (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              if (finished) { setNow(START); setPaused(false) }
              else setPaused((p) => !p)
            }}
          >
            {finished ? <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" /> : paused ? <Play size={14} strokeWidth={2} aria-hidden="true" /> : <Pause size={14} strokeWidth={2} aria-hidden="true" />}
            {finished ? 'Replay the morning' : paused ? 'Play' : 'Pause'}
          </button>
        )}
      </div>
    </div>
  )
}
