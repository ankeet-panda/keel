import { useEffect, useRef, useState } from 'react'
import { Check, Pause, Play, Plus, X } from 'lucide-react'
import type { Block } from '../model/types'
import { KIND_LABEL } from '../model/types'
import { fmtClock, fmtDur, fmtTime } from '../model/time'
import { KindIcon } from './KindIcon'
import { Ring } from './Ring'

interface ViewProps {
  block: Block
  /** Seconds spent in this session */
  elapsed: number
  /** Session length in seconds */
  total: number
  paused: boolean
  onPause?(): void
  onAdd5?(): void
  onFinish?(): void
  onLeave?(): void
  /** Clock time the session ends, as minutes of the day */
  endsAt?: number
  pressed?: 'pause' | 'add' | 'finish' | null
  ringSize?: number
}

/** The focus room: one block, one ring, nothing else asking for attention */
export function FocusView({ block, elapsed, total, paused, onPause, onAdd5, onFinish, onLeave, endsAt, pressed, ringSize = 300 }: ViewProps) {
  const left = Math.max(0, total - elapsed)
  const over = left === 0
  return (
    <div className="focus-room">
      <div className="focus-top">
        <span className={`focus-kind k-${block.kind}`}>
          <KindIcon kind={block.kind} size={14} />
          {KIND_LABEL[block.kind]}
        </span>
        {onLeave && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={onLeave}>
            <X size={15} strokeWidth={1.75} aria-hidden="true" />
            Leave focus
          </button>
        )}
      </div>
      <div className="focus-center">
        <div className="focus-ring" style={{ width: ringSize, height: ringSize }}>
          <Ring value={total ? elapsed / total : 0} size={ringSize} stroke={Math.round(ringSize * 0.055)} />
          <div className="focus-readout">
            <span className="focus-clock" role="timer" aria-live="off" data-target="focus-clock">{over ? 'Done' : fmtClock(left)}</span>
            <span className="focus-sub">{paused ? 'Paused' : over ? `${fmtDur(Math.round(total / 60))} of focus` : endsAt !== undefined ? `Ends ${fmtTime(endsAt)}` : 'left'}</span>
          </div>
        </div>
        <div className="focus-title" data-target="focus-title">{block.title}</div>
        {block.notes && <p className="focus-notes">{block.notes}</p>}
      </div>
      <div className="focus-actions">
        <button type="button" className={`btn btn--secondary${pressed === 'pause' ? ' is-pressed' : ''}`} onClick={onPause} aria-pressed={paused} data-target="focus-pause">
          {paused ? <Play size={15} strokeWidth={2} aria-hidden="true" /> : <Pause size={15} strokeWidth={2} aria-hidden="true" />}
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button type="button" className={`btn btn--secondary${pressed === 'add' ? ' is-pressed' : ''}`} onClick={onAdd5} data-target="focus-add">
          <Plus size={15} strokeWidth={2} aria-hidden="true" />
          5 min
        </button>
        <button type="button" className={`btn btn--primary${pressed === 'finish' ? ' is-pressed' : ''}`} onClick={onFinish} data-target="focus-finish">
          <Check size={15} strokeWidth={2} aria-hidden="true" />
          Finish block
        </button>
      </div>
    </div>
  )
}

/** The working focus mode: a real timer, keyboard (Space pauses, Escape leaves), focus kept inside */
export function FocusMode({ block, now, onFinish, onLeave }: { block: Block; now: number; onFinish(focusedMin: number): void; onLeave(focusedMin: number): void }) {
  // In the block's own hours, focus runs to the block's end; otherwise for its full length
  const inside = block.start <= now && now < block.start + block.dur
  const [total, setTotal] = useState(() => (inside ? block.start + block.dur - now : block.dur) * 60)
  const startMin = useRef(now)
  const [elapsed, setElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const last = useRef(performance.now())
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    last.current = performance.now()
    if (paused) return
    const i = window.setInterval(() => {
      const t = performance.now()
      const dt = (t - last.current) / 1000
      last.current = t
      setElapsed((e) => Math.min(total, e + dt))
    }, 250)
    return () => window.clearInterval(i)
  }, [paused, total])

  const mins = () => Math.round(elapsed / 60)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    box.current?.querySelector<HTMLElement>('[data-target="focus-pause"]')?.focus()
    return () => prev?.focus?.()
  }, [])

  const endClock = (startMin.current + Math.round(total / 60)) % (24 * 60)

  return (
    <div
      className="focus-layer"
      role="dialog"
      aria-modal="true"
      aria-label={`Focus on ${block.title}`}
      ref={box}
      onKeyDown={(e) => {
        if (e.key === 'Escape') { e.preventDefault(); onLeave(mins()) }
        if (e.key === ' ' && (e.target as HTMLElement).tagName !== 'BUTTON') { e.preventDefault(); setPaused((p) => !p) }
        if (e.key === 'Tab') {
          const els = [...(box.current?.querySelectorAll<HTMLElement>('button') ?? [])]
          const i = els.indexOf(document.activeElement as HTMLElement)
          if (e.shiftKey && i <= 0) { e.preventDefault(); els[els.length - 1]?.focus() }
          else if (!e.shiftKey && i === els.length - 1) { e.preventDefault(); els[0]?.focus() }
        }
      }}
    >
      <FocusView
        block={block}
        elapsed={elapsed}
        total={total}
        paused={paused}
        endsAt={paused ? undefined : endClock}
        onPause={() => setPaused((p) => !p)}
        onAdd5={() => setTotal((t) => t + 300)}
        onFinish={() => onFinish(Math.max(1, mins()))}
        onLeave={() => onLeave(mins())}
      />
    </div>
  )
}
