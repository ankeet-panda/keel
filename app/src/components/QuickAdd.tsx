import { forwardRef, useEffect, useState, type FormEvent } from 'react'

import { CalendarClock, Clock3, CornerDownLeft, Plus } from 'lucide-react'
import { DEFAULT_DUR, EXAMPLE, parse, type Parsed } from '../model/parse'
import { KIND_LABEL } from '../model/types'
import { fmtDur, fmtShortDate, fmtTime, dayShort, addDays } from '../model/time'
import { KindIcon } from './KindIcon'

function useNarrow() {
  const [n, setN] = useState(() => matchMedia('(max-width: 40rem)').matches)
  useEffect(() => {
    const mq = matchMedia('(max-width: 40rem)')
    const on = () => setN(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return n
}

interface Props {
  today: string
  onAdd?(p: Parsed): void
  /** Controlled value (demos); omit for a normal field */
  value?: string
  /** Show the parse chips even when the field is not focused (demos) */
  showChips?: boolean
  pressed?: boolean
  id?: string
}

function dayWord(date: string, today: string) {
  if (date === today) return 'Today'
  if (date === addDays(today, 1)) return 'Tomorrow'
  return `${dayShort(date)} ${fmtShortDate(date)}`
}

export function Chips({ p, today }: { p: Parsed; today: string }) {
  const dur = p.dur ?? DEFAULT_DUR[p.kind]
  return (
    <span className="qa-chips">
      <span className={`qa-chip qa-chip--kind k-${p.kind}`}>
        <KindIcon kind={p.kind} size={13} />
        {KIND_LABEL[p.kind]}
      </span>
      <span className="qa-chip">
        <Clock3 size={13} strokeWidth={1.75} aria-hidden="true" />
        {fmtDur(dur)}
      </span>
      {p.start !== null && p.date ? (
        <span className="qa-chip">
          <CalendarClock size={13} strokeWidth={1.75} aria-hidden="true" />
          {dayWord(p.date, today)}, {fmtTime(p.start)}
        </span>
      ) : (
        <span className="qa-chip qa-chip--quiet">To schedule</span>
      )}
    </span>
  )
}

export const QuickAdd = forwardRef<HTMLInputElement, Props>(function QuickAdd({ today, onAdd, value, showChips, pressed, id = 'quick-add' }, ref) {
  const [own, setOwn] = useState('')
  const [focused, setFocused] = useState(false)
  const narrow = useNarrow()
  const text = value ?? own
  const p = text.trim() ? parse(text, today) : null
  const ready = !!p && p.title.length > 0

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!p || !ready) return
    onAdd?.(p)
    setOwn('')
  }

  return (
    <form className={`qa${focused || showChips ? ' is-open' : ''}`} onSubmit={submit} role="search" aria-label="Quick add">
      <label htmlFor={id} className="sr-only">Quick add a block or task, in plain words</label>
      <Plus className="qa-plus" size={16} strokeWidth={2} aria-hidden="true" />
      <input
        ref={ref}
        id={id}
        className="qa-input"
        value={text}
        onChange={(e) => setOwn(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={narrow ? 'Add in plain words' : `Add in plain words: “${EXAMPLE}”`}
        autoComplete="off"
        aria-describedby={`${id}-hint`}
        data-target="qa-input"
      />
      <span id={`${id}-hint`} className="sr-only" aria-live="polite">
        {p && ready ? `Will add ${p.title}, ${KIND_LABEL[p.kind]}, ${fmtDur(p.dur ?? DEFAULT_DUR[p.kind])}${p.start !== null ? `, at ${fmtTime(p.start)}` : ', to schedule'}` : ''}
      </span>
      {p && ready && (focused || showChips) && <Chips p={p} today={today} />}
      <button type="submit" className={`qa-go${pressed ? ' is-pressed' : ''}`} disabled={!ready} aria-label="Add" data-target="qa-go">
        <CornerDownLeft size={15} strokeWidth={2} aria-hidden="true" />
      </button>
    </form>
  )
})
