import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Monitor, Moon, RotateCcw, Sun, X } from 'lucide-react'
import { useNow, useStore } from './model/store'
import type { Task } from './model/types'
import { dayBlocks, dayStats, freeSlot } from './model/derive'
import { DEFAULT_DUR, type Parsed } from './model/parse'
import { addDays, clamp, DAY_END, DAY_START, fmtDate, fmtDur, fmtTime, fmtWeek, snap, weekStart } from './model/time'
import { DepthProfile, depthSummary } from './components/DepthProfile'
import { Timeline, type Preview, type TimelineHandle } from './components/Timeline'
import { TaskGhost, TaskList } from './components/TaskList'
import { BlockEditor, Glance } from './components/SidePanel'
import { QuickAdd } from './components/QuickAdd'
import { FocusMode } from './components/Focus'
import { WeekView } from './components/Week'
import { useTheme, type ThemeChoice } from './theme'

type View = 'day' | 'week'
type Carry = { task: Task; x: number; y: number; dx: number; dy: number; moved: boolean; over: number | null }

export function App() {
  const store = useStore()
  const { today, now } = useNow()
  const [date, setDate] = useState(today)
  const [view, setView] = useState<View>('day')
  const [selected, setSelected] = useState<string | null>(null)
  const [fresh, setFresh] = useState<string | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)
  const [carry, setCarry] = useState<Carry | null>(null)
  const carryRef = useRef<Carry | null>(null)
  carryRef.current = carry
  const tl = useRef<TimelineHandle>(null)
  const qa = useRef<HTMLInputElement>(null)

  const blocks = useMemo(() => dayBlocks(store.data.blocks, date), [store.data.blocks, date])
  const isToday = date === today
  const sel = blocks.find((b) => b.id === selected) ?? null
  const focusBlock = store.data.blocks.find((b) => b.id === focusId) ?? null
  const st = dayStats(blocks)

  // Open at the current hour
  useEffect(() => {
    tl.current?.scrollToMinute(isToday ? now : 8 * 60)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, view])

  // Keyboard: N quick add, T today, arrows change day (when nothing is being typed)
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (focusId || /INPUT|TEXTAREA|SELECT/.test(t.tagName) || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'n' || e.key === '/') { e.preventDefault(); qa.current?.focus() }
      else if (e.key === 't') setDate(today)
      else if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [focusId, today])

  function addParsed(p: Parsed) {
    const dur = p.dur ?? DEFAULT_DUR[p.kind]
    if (p.start !== null && p.date) {
      const start = clamp(snap(p.start, 5), 0, 24 * 60 - dur)
      const id = store.addBlock({ date: p.date, start, dur, title: p.title, kind: p.kind })
      store.notify(`Added “${p.title}” · ${fmtDate(p.date)}, ${fmtTime(start)}`)
      setView('day')
      setDate(p.date)
      setSelected(id)
      window.setTimeout(() => tl.current?.scrollToMinute(start, true), 60)
    } else {
      store.addTask({ title: p.title, est: dur, kind: p.kind })
      store.notify(`Added “${p.title}” to To schedule`)
    }
  }

  function scheduleNext(taskId: string) {
    const t = store.data.tasks.find((x) => x.id === taskId)
    if (!t) return
    const from = isToday ? now : DAY_START
    const slot = freeSlot(blocks, t.est, from)
    if (slot === null) { store.notify(`No free ${fmtDur(t.est)} left on ${fmtDate(date)}`); return }
    const id = store.scheduleTask(taskId, date, slot)
    if (id) {
      setSelected(id)
      store.notify(`Scheduled “${t.title}” at ${fmtTime(slot)}`)
      window.setTimeout(() => tl.current?.scrollToMinute(slot, true), 60)
    }
  }

  // Dragging a task into the day: pointer events on the window, a ghost under the pointer, a preview in the grid
  function grab(task: Task, e: RPointerEvent) {
    if (e.button !== 0) return
    const r = (e.currentTarget as HTMLElement).closest('.task')!.getBoundingClientRect()
    setCarry({ task, x: r.left, y: r.top, dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false, over: null })
    e.preventDefault()
  }
  useEffect(() => {
    if (!carry) return
    const move = (e: PointerEvent) => {
      setCarry((c) => {
        if (!c) return c
        const moved = c.moved || Math.hypot(e.clientX - (c.x + c.dx), e.clientY - (c.y + c.dy)) > 4
        const m = tl.current?.minuteAt(e.clientX, e.clientY)
        const over = m == null ? null : clamp(snap(m - Math.min(c.task.est, 60) / 2), DAY_START, DAY_END - c.task.est)
        return { ...c, x: e.clientX - c.dx, y: e.clientY - c.dy, moved, over }
      })
    }
    const up = () => {
      const c = carryRef.current
      setCarry(null)
      if (c && c.over !== null) {
        const id = store.scheduleTask(c.task.id, date, c.over)
        if (id) { setSelected(id); store.notify(`Scheduled “${c.task.title}” at ${fmtTime(c.over)}`) }
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up, { once: true })
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  }, [carry !== null, date]) // eslint-disable-line react-hooks/exhaustive-deps

  const preview: Preview | null = carry && carry.over !== null ? { start: carry.over, dur: carry.task.est, kind: carry.task.kind, title: carry.task.title } : null

  function createAt(start: number) {
    const id = store.addBlock({ date, start, dur: 60, title: 'New block', kind: 'deep' })
    setSelected(id)
    setFresh(id)
  }

  const endFocus = (focused: number, finished: boolean) => {
    if (!focusBlock) return
    const before = focusBlock
    store.updateBlock(focusBlock.id, { focused: focusBlock.focused + focused, done: finished || focusBlock.done })
    if (finished) store.notify(`Finished “${before.title}” · ${fmtDur(focused)} of focus`, () => store.updateBlock(before.id, { focused: before.focused, done: before.done }))
    setFocusId(null)
  }

  return (
    <div className={`app${carry?.moved ? ' is-carrying' : ''}`}>
      <header className="topbar">
        <div className="topbar-left">
          <a className="home-link" href="#/" aria-label="Keel, back to the product page">
            <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" className="home-arrow" />
            <span className="wordmark">Keel</span>
          </a>
        </div>
        <div className="topbar-mid">
          <QuickAdd ref={qa} today={today} onAdd={addParsed} />
        </div>
        <div className="topbar-right">
          <ThemeSwitch />
        </div>
      </header>

      <nav className="subbar" aria-label="View and date">
        <div className="seg" role="tablist" aria-label="View">
          <button role="tab" type="button" aria-selected={view === 'day'} className="seg-btn" onClick={() => setView('day')}>Day</button>
          <button role="tab" type="button" aria-selected={view === 'week'} className="seg-btn" onClick={() => setView('week')}>Week</button>
        </div>
        <div className="datenav">
          <button type="button" className="icon-btn" aria-label={view === 'day' ? 'Previous day' : 'Previous week'} onClick={() => setDate(addDays(date, view === 'day' ? -1 : -7))}>
            <ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <h1 className="date-title" aria-live="polite">{view === 'day' ? fmtDate(date) : fmtWeek(weekStart(date))}</h1>
          <button type="button" className="icon-btn" aria-label={view === 'day' ? 'Next day' : 'Next week'} onClick={() => setDate(addDays(date, view === 'day' ? 1 : 7))}>
            <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
          {!isToday && <button type="button" className="btn btn--secondary btn--sm" onClick={() => setDate(today)}>Today</button>}
        </div>
        <span className="saved" aria-live="polite">{store.saved ? 'Saved on this device' : 'Saving…'}</span>
      </nav>

      {view === 'day' ? (
        <main className="day-layout">
          <aside className="col-left" aria-label="Tasks to schedule">
            <TaskList tasks={store.data.tasks} draggingId={carry?.moved ? carry.task.id : null} onGrab={grab} onSchedule={scheduleNext} onDelete={store.deleteTask} />
            <button type="button" className="btn btn--ghost btn--sm reset" onClick={store.resetSample}>
              <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
              Restore sample week
            </button>
          </aside>

          <section className="card day" aria-labelledby="day-h">
            <div className="day-head">
              <h2 id="day-h" className="card-title">Depth of the day</h2>
              <span className="day-meta">{fmtDur(st.deepPlanned)} deep · {fmtDur(st.planned)} planned</span>
            </div>
            <DepthProfile blocks={blocks} now={isToday ? now : null} label={depthSummary(blocks)} />
            <Timeline
              ref={tl}
              blocks={blocks}
              now={isToday ? now : null}
              selectedId={selected}
              preview={preview}
              onSelect={(id) => { setSelected(id); setFresh(null) }}
              onMove={(id, start) => store.updateBlock(id, { start })}
              onResize={(id, dur) => store.updateBlock(id, { dur })}
              onCreateAt={createAt}
              onDelete={(id) => { store.deleteBlock(id); setSelected(null) }}
              className="day-tl"
            />
          </section>

          <aside className={`col-right${sel ? ' has-sheet' : ''}`} aria-label={sel ? 'Block details' : 'Today at a glance'}>
            {sel ? (
              <>
                <button type="button" className="sheet-scrim" aria-label="Close block details" tabIndex={-1} onClick={() => setSelected(null)} />
                <BlockEditor
                  key={sel.id}
                  block={sel}
                  autoFocusTitle={fresh === sel.id}
                  onChange={(p) => store.updateBlock(sel.id, p)}
                  onDelete={() => { store.deleteBlock(sel.id); setSelected(null) }}
                  onUnschedule={() => { store.unschedule(sel.id); setSelected(null) }}
                  onClose={() => setSelected(null)}
                  onFocus={() => setFocusId(sel.id)}
                />
              </>
            ) : (
              <Glance blocks={blocks} now={now} isToday={isToday} onFocus={setFocusId} onSelect={setSelected} />
            )}
          </aside>
        </main>
      ) : (
        <main className="week-layout">
          <WeekView blocks={store.data.blocks} start={weekStart(date)} today={today} onOpenDay={(d) => { setDate(d); setView('day') }} />
        </main>
      )}

      {carry?.moved && <TaskGhost task={carry.task} x={carry.x} y={carry.y} />}
      {focusBlock && <FocusMode block={focusBlock} now={now} onFinish={(m) => endFocus(m, true)} onLeave={(m) => endFocus(m, false)} />}
      <Toasts />
    </div>
  )
}

export function ThemeSwitch() {
  const { choice, setChoice } = useTheme()
  const opts: [ThemeChoice, string, typeof Sun][] = [['system', 'System', Monitor], ['light', 'Light', Sun], ['dark', 'Dark', Moon]]
  return (
    <div className="seg seg--icons" role="radiogroup" aria-label="Theme">
      {opts.map(([v, label, I]) => (
        <button key={v} type="button" role="radio" aria-checked={choice === v} className="seg-btn" onClick={() => setChoice(v)} aria-label={`${label} theme`} title={`${label} theme`}>
          <I size={15} strokeWidth={1.75} aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}

function Toasts() {
  const { notices, dismiss } = useStore()
  useEffect(() => {
    // Plain notices leave after 5 s; ones with Undo stay 8 s
    const timers = notices.map((n) => window.setTimeout(() => dismiss(n.id), n.undo ? 8000 : 5000))
    return () => timers.forEach(clearTimeout)
  }, [notices, dismiss])
  return (
    <div className="toasts" role="status" aria-live="polite">
      {notices.map((n) => (
        <div key={n.id} className="toast">
          <span>{n.text}</span>
          {n.undo && (
            <button type="button" className="toast-undo" onClick={() => { n.undo!(); dismiss(n.id) }}>Undo</button>
          )}
          <button type="button" className="icon-btn icon-btn--sm" aria-label="Dismiss" onClick={() => dismiss(n.id)}>
            <X size={14} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  )
}
