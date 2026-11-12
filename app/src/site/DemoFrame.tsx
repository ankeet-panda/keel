import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Pause, Play } from 'lucide-react'
import { useReducedMotion } from '@kit/reduced-motion'
import { INERT } from './HeroDay'

interface Props {
  /** Accessible name of the demo */
  label: string
  steps: string[]
  /** Index of the step the script is on */
  step: number
  /** Renders the stage: `playing` false means show the finished still */
  children(playing: boolean, run: number): ReactNode
}

/**
 * Wraps a demo: the stage, a step row that follows the script, and a Pause / Play control (WCAG 2.2.2).
 * The stage itself plays only while on screen. Under reduced motion it shows its finished still.
 */
export function DemoFrame({ label, steps, step, children }: Props) {
  const reduced = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const [run, setRun] = useState(0)
  const playing = !paused && !reduced
  // Mount the stage only as it comes near the screen: the page starts light, and each demo starts fresh
  const box = useRef<HTMLElement>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect() } }, { rootMargin: '600px 0px' })
    if (box.current) io.observe(box.current)
    return () => io.disconnect()
  }, [])

  return (
    <figure className="demo" aria-label={label} ref={box}>
      <div className="demo-stage" {...INERT}>{near ? children(playing, run) : <div className="demo-ph" />}</div>
      <figcaption className="demo-foot">
        <ol className="demo-steps" aria-label="Steps in this demo">
          {steps.map((s, i) => {
            const on = playing ? i === step : i === steps.length - 1
            return (
              <li key={s} className={on ? 'is-on' : ''} aria-current={on ? 'step' : undefined}>
                <span className="demo-step-n" aria-hidden="true">{i + 1}</span>
                {s}
              </li>
            )
          })}
        </ol>
        {reduced ? (
          <span className="demo-still-note">Still view, as your device asks for less motion</span>
        ) : (
          <button
            type="button"
            className="btn btn--secondary btn--sm demo-toggle"
            onClick={() => {
              if (paused) { setPaused(false); setRun((r) => r + 1) }
              else setPaused(true)
            }}
          >
            {paused ? <Play size={14} strokeWidth={2} aria-hidden="true" /> : <Pause size={14} strokeWidth={2} aria-hidden="true" />}
            {paused ? 'Play demo' : 'Pause demo'}
          </button>
        )}
      </figcaption>
    </figure>
  )
}
