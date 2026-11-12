import { useEffect, useId, useRef, useState } from 'react'
import { ArrowDownToLine, Check, Gauge, Play, RotateCcw, Trash2, X } from 'lucide-react'
import type { Block, Kind } from '../model/types'
import { KINDS, KIND_LABEL } from '../model/types'
import { current, dayStats, next } from '../model/derive'
import { DAY_END, DAY_START, fmtDur, fmtHours, fmtRange, fmtTime } from '../model/time'
import { KindIcon } from './KindIcon'
import { Ring } from './Ring'

/** What the day looks like right now: the ring of deep work done, what's on, and the way into focus */
export function Glance({ blocks, now, isToday, onFocus, onSelect, interactive = true }: { blocks: Block[]; now: number; isToday: boolean; onFocus(id: string): void; onSelect(id: string): void; interactive?: boolean }) {
  const hid = useId()
  const st = dayStats(blocks)
  const live = isToday ? current(blocks, now) : undefined
  const upNext = isToday ? next(blocks, now) : blocks.find((b) => !b.done)
  const target = live && !live.done ? live : upNext
  const share = st.deepPlanned ? st.deepDone / st.deepPlanned : 0
  return (
    <section className="card glance" aria-labelledby={hid}>
      <div className="card-head">
        <span className="mark" aria-hidden="true"><Gauge size={15} strokeWidth={1.75} /></span>
        <h2 id={hid} className="card-title">{isToday ? 'Today at a glance' : 'This day at a glance'}</h2>
      </div>
      <div className="glance-ring">
        <Ring value={share} size={168} stroke={14} />
        <div className="glance-figure">
          <span className="glance-num">{fmtHours(st.deepDone)}<span className="glance-unit"> h</span></span>
          <span className="glance-of">of {fmtHours(st.deepPlanned)} h deep</span>
        </div>
      </div>
      {target ? (
        <div className={`glance-next k-${target.kind}`}>
          <span className="glance-label">{live && target === live ? 'Now' : 'Up next'}</span>
          {interactive ? (
            <button type="button" className="glance-title" onClick={() => onSelect(target.id)}>
              <KindIcon kind={target.kind} size={15} />
              {target.title}
            </button>
          ) : (
            <span className="glance-title">
              <KindIcon kind={target.kind} size={15} />
              {target.title}
            </span>
          )}
          <span className="glance-time">{fmtRange(target.start, target.dur)}</span>
          {target.kind !== 'break' && (
            interactive ? (
              <button type="button" className="btn btn--primary btn--block" onClick={() => onFocus(target.id)} data-target="start-focus">
                <Play size={15} strokeWidth={2} aria-hidden="true" />
                Start focus
              </button>
            ) : (
              <span className="btn btn--primary btn--block" data-target="start-focus">
                <Play size={15} strokeWidth={2} aria-hidden="true" />
                Start focus
              </span>
            )
          )}
        </div>
      ) : (
        <p className="glance-empty">{blocks.length ? 'Everything on this day is done.' : 'No blocks yet. Click an empty hour to add one.'}</p>
      )}
    </section>
  )
}

interface EditorProps {
  block: Block
  onChange(patch: Partial<Block>): void
  onDelete(): void
  onUnschedule(): void
  onClose(): void
  onFocus(): void
  autoFocusTitle?: boolean
}

const DURS = [15, 30, 45, 60, 90, 120, 150, 180, 240]

export function BlockEditor({ block, onChange, onDelete, onUnschedule, onClose, onFocus, autoFocusTitle }: EditorProps) {
  const hid = useId()
  const [title, setTitle] = useState(block.title)
  const titleRef = useRef<HTMLInputElement>(null)
  useEffect(() => setTitle(block.title), [block.id, block.title])
  useEffect(() => {
    if (autoFocusTitle) titleRef.current?.select()
  }, [autoFocusTitle, block.id])

  const starts: number[] = []
  for (let m = DAY_START; m < DAY_END; m += 15) starts.push(m)
  const durs = DURS.includes(block.dur) ? DURS : [...DURS, block.dur].sort((a, b) => a - b)
  const commitTitle = () => {
    const t = title.trim()
    if (t && t !== block.title) onChange({ title: t })
    else setTitle(block.title)
  }

  return (
    <section className="card editor" aria-labelledby={hid}>
      <div className="card-head">
        <span className={`mark k-${block.kind}`} aria-hidden="true"><KindIcon kind={block.kind} size={15} /></span>
        <h2 id={hid} className="card-title">Block</h2>
        <button type="button" className="icon-btn editor-close" onClick={onClose} aria-label="Close block details">
          <X size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>

      <div className="field">
        <label htmlFor="ed-title">Title</label>
        <input
          id="ed-title"
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        />
      </div>

      <fieldset className="field kinds">
        <legend>Kind of work</legend>
        <div className="kind-pick">
          {KINDS.map((k: Kind) => (
            <label key={k} className={`kind-opt k-${k}`}>
              <input type="radio" name="kind" value={k} checked={block.kind === k} onChange={() => onChange({ kind: k })} />
              <KindIcon kind={k} size={15} />
              <span>{KIND_LABEL[k]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field-row">
        <div className="field">
          <label htmlFor="ed-start">Starts</label>
          <select id="ed-start" value={block.start} onChange={(e) => onChange({ start: Number(e.target.value) })}>
            {starts.map((m) => <option key={m} value={m}>{fmtTime(m)}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ed-dur">Length</label>
          <select id="ed-dur" value={block.dur} onChange={(e) => onChange({ dur: Number(e.target.value) })}>
            {durs.map((d) => <option key={d} value={d}>{fmtDur(d)}</option>)}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="ed-notes">Notes</label>
        <textarea id="ed-notes" rows={3} value={block.notes} onChange={(e) => onChange({ notes: e.target.value })} placeholder="What does done look like?" />
      </div>

      {block.focused > 0 && <p className="editor-meta">{fmtDur(block.focused)} in focus so far.</p>}

      <div className="editor-actions">
        {block.kind !== 'break' && !block.done && (
          <button type="button" className="btn btn--primary" onClick={onFocus}>
            <Play size={15} strokeWidth={2} aria-hidden="true" />
            Start focus
          </button>
        )}
        <button type="button" className="btn btn--secondary" aria-pressed={block.done} onClick={() => onChange({ done: !block.done })}>
          {block.done ? <RotateCcw size={15} strokeWidth={1.75} aria-hidden="true" /> : <Check size={15} strokeWidth={2} aria-hidden="true" />}
          {block.done ? 'Mark not done' : 'Mark done'}
        </button>
      </div>
      <div className="editor-quiet">
        <button type="button" className="btn btn--ghost btn--sm" onClick={onUnschedule}>
          <ArrowDownToLine size={14} strokeWidth={1.75} aria-hidden="true" />
          Back to To schedule
        </button>
        <button type="button" className="btn btn--ghost btn--sm btn--danger" onClick={onDelete}>
          <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
          Delete block
        </button>
      </div>
    </section>
  )
}
