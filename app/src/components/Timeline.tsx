import { forwardRef, useImperativeHandle, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react'
import { Check } from 'lucide-react'
import type { Block, Kind } from '../model/types'
import { KIND_LABEL } from '../model/types'
import { lanes } from '../model/derive'
import { DAY_END, DAY_START, clamp, fmtDur, fmtHour, fmtRange, fmtTime, snap } from '../model/time'
import { KindIcon } from './KindIcon'

export interface Preview { start: number; dur: number; kind: Kind; title: string }

export interface TimelineHandle {
  /** Minute of the day under a viewport y, or null when the pointer is outside the grid */
  minuteAt(clientX: number, clientY: number): number | null
  scrollToMinute(m: number, smooth?: boolean): void
}

interface Props {
  blocks: Block[]
  now: number | null
  selectedId?: string | null
  /** Ghost block while a task is dragged over the day */
  preview?: Preview | null
  /** Block shown lifted while a scripted drag runs (demos) */
  liftedId?: string | null
  hour?: number
  from?: number
  to?: number
  interactive?: boolean
  onSelect?(id: string | null): void
  onMove?(id: string, start: number): void
  onResize?(id: string, dur: number): void
  onCreateAt?(start: number): void
  onDelete?(id: string): void
  /** The scroll box height; omit to show the whole day */
  height?: number | string
  className?: string
}

type Drag = { id: string; mode: 'move' | 'resize'; y0: number; start: number; dur: number; moved: boolean }

export const Timeline = forwardRef<TimelineHandle, Props>(function Timeline(
  { blocks, now, selectedId, preview, liftedId, hour = 64, from = DAY_START, to = DAY_END, interactive = true, onSelect, onMove, onResize, onCreateAt, onDelete, height, className = '' },
  ref,
) {
  const scroller = useRef<HTMLDivElement>(null)
  const grid = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [hover, setHover] = useState<number | null>(null)
  const ppm = hour / 60
  const y = (m: number) => (m - from) * ppm
  const total = (to - from) * ppm

  useImperativeHandle(ref, () => ({
    minuteAt(cx, cy) {
      const r = grid.current?.getBoundingClientRect()
      if (!r || cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return null
      return clamp(from + (cy - r.top) / ppm, from, to)
    },
    scrollToMinute(m, smooth = false) {
      const s = scroller.current
      if (!s) return
      s.scrollTo({ top: Math.max(0, y(m) - s.clientHeight * 0.3), behavior: smooth ? 'smooth' : 'auto' })
    },
  }))

  const layout = lanes(blocks)
  const hours: number[] = []
  for (let m = Math.ceil(from / 60) * 60; m <= to; m += 60) hours.push(m)

  const shown = (b: Block) => {
    if (drag && drag.id === b.id) return { start: drag.start, dur: drag.dur }
    return { start: b.start, dur: b.dur }
  }

  function down(e: RPointerEvent, b: Block, mode: Drag['mode']) {
    if (!interactive || e.button !== 0) return
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setDrag({ id: b.id, mode, y0: e.clientY, start: b.start, dur: b.dur, moved: false })
  }
  function move(e: RPointerEvent, b: Block) {
    if (!drag || drag.id !== b.id) return
    const dm = (e.clientY - drag.y0) / ppm
    const moved = drag.moved || Math.abs(e.clientY - drag.y0) > 4
    if (drag.mode === 'move') setDrag({ ...drag, moved, start: clamp(snap(b.start + dm), from, to - b.dur) })
    else setDrag({ ...drag, moved, dur: clamp(snap(b.dur + dm), 15, to - b.start) })
  }
  function up(b: Block) {
    if (!drag || drag.id !== b.id) return
    if (!drag.moved) onSelect?.(b.id)
    else if (drag.mode === 'move' && drag.start !== b.start) onMove?.(b.id, drag.start)
    else if (drag.mode === 'resize' && drag.dur !== b.dur) onResize?.(b.id, drag.dur)
    setDrag(null)
  }
  function key(e: KeyboardEvent, b: Block) {
    if (!interactive) return
    const step = 15
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const d = e.key === 'ArrowUp' ? -step : step
      if (e.shiftKey) onResize?.(b.id, clamp(b.dur + d, 15, to - b.start))
      else onMove?.(b.id, clamp(b.start + d, from, to - b.dur))
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      onDelete?.(b.id)
    }
  }

  const gridMinute = (e: RPointerEvent) => {
    const r = grid.current!.getBoundingClientRect()
    return clamp(Math.floor((from + (e.clientY - r.top) / ppm) / 30) * 30, from, to - 30)
  }

  return (
    <div className={`tl ${className}`} ref={scroller} style={{ height }}>
      <div className="tl-inner" style={{ height: total + 24 }}>
        <div className="tl-hours" aria-hidden="true">
          {hours.map((m) => (
            <span key={m} className={`tl-hour${now !== null && Math.abs(now - m) < 14 ? ' is-hidden' : ''}`} style={{ top: y(m) }}>{fmtHour(m)}</span>
          ))}
        </div>
        <div
          className="tl-grid"
          ref={grid}
          data-target="tl-grid"
          style={{ height: total }}
          onPointerMove={(e) => interactive && !drag && e.target === grid.current && setHover(gridMinute(e))}
          onPointerLeave={() => setHover(null)}
          onPointerDown={(e) => {
            if (!interactive || e.target !== grid.current || e.button !== 0) return
            onSelect?.(null)
            onCreateAt?.(gridMinute(e))
          }}
        >
          {hours.map((m) => (
            <span key={m} className="tl-rule" style={{ top: y(m) }} aria-hidden="true" />
          ))}
          {hover !== null && !preview && (
            <div className="tl-slot" style={{ top: y(hover), height: 30 * ppm }} aria-hidden="true">
              <span>New block at {fmtTime(hover)}</span>
            </div>
          )}

          {blocks.map((b) => {
            const s = shown(b)
            const lane = layout.get(b.id) ?? { col: 0, cols: 1 }
            const live = now !== null && b.start <= now && now < b.start + b.dur && !b.done
            const short = s.dur < 45
            const left = lane.cols > 1 ? `calc(${(lane.col / lane.cols) * 100}% + 2px)` : undefined
            const width = lane.cols > 1 ? `calc(${100 / lane.cols}% - 4px)` : undefined
            const Tag = interactive ? 'button' : 'div'
            return (
              <Tag
                key={b.id}
                {...(interactive ? { type: 'button' as const, 'aria-pressed': selectedId === b.id, tabIndex: 0 } : {})}
                className={`tl-block k-${b.kind}${live ? ' is-live' : ''}${b.done ? ' is-done' : ''}${short ? ' is-short' : ''}${selectedId === b.id ? ' is-selected' : ''}${drag?.id === b.id && drag.moved ? ' is-dragging' : ''}${liftedId === b.id ? ' is-lifted' : ''}`}
                style={{ top: y(s.start), height: Math.max(s.dur * ppm - 3, interactive ? 24 : 18), left, width }}
                data-target={`block-${b.id}`}
                onPointerDown={(e) => down(e, b, 'move')}
                onPointerMove={(e) => move(e, b)}
                onPointerUp={() => up(b)}
                onPointerCancel={() => setDrag(null)}
                onKeyDown={(e) => key(e, b)}
                onClick={(e) => { if (e.detail === 0) onSelect?.(b.id) }}
              >
                <span className="tl-block-head">
                  {b.done ? <Check size={14} strokeWidth={2.25} aria-hidden="true" className="tl-check" /> : <KindIcon kind={b.kind} size={14} />}
                  <span className="tl-title">{b.title}</span>
                  {short && <span className="tl-time tl-time--inline">{fmtTime(s.start, false)}</span>}
                </span>
                {!short && (
                  <span className="tl-time">
                    {fmtRange(s.start, s.dur)}
                    {live && now !== null && <span className="tl-left"> · {fmtDur(b.start + b.dur - now)} left</span>}
                  </span>
                )}
                <span className="sr-only">
                  {short ? `, ${fmtRange(s.start, s.dur)}` : ''}, {KIND_LABEL[b.kind]}{b.done ? ', done' : live ? ', in progress' : ''}
                </span>
                {interactive && <span className="tl-resize" aria-hidden="true" onPointerDown={(e) => down(e, b, 'resize')} />}
              </Tag>
            )
          })}

          {preview && (
            <div className={`tl-block tl-preview k-${preview.kind}`} style={{ top: y(preview.start), height: preview.dur * ppm - 3 }} aria-hidden="true">
              <span className="tl-block-head">
                <KindIcon kind={preview.kind} size={14} />
                <span className="tl-title">{preview.title}</span>
              </span>
              <span className="tl-time">{fmtRange(preview.start, preview.dur)}</span>
            </div>
          )}

          {now !== null && now >= from && now <= to && (
            <div className="tl-now" style={{ top: y(now) }} aria-hidden="true">
              <span className="tl-now-label">{fmtTime(now, false)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
