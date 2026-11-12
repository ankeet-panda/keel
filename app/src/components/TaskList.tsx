import { useId, type PointerEvent as RPointerEvent } from 'react'
import { CalendarPlus, GripVertical, ListTodo, Trash2 } from 'lucide-react'
import type { Task } from '../model/types'
import { KIND_LABEL } from '../model/types'
import { fmtDur } from '../model/time'
import { KindDot } from './KindIcon'

interface Props {
  tasks: Task[]
  /** Task being dragged (shown as a gap in the list) */
  draggingId?: string | null
  interactive?: boolean
  onSchedule?(id: string): void
  onDelete?(id: string): void
  onGrab?(task: Task, e: RPointerEvent): void
}

export function TaskList({ tasks, draggingId, interactive = true, onSchedule, onDelete, onGrab }: Props) {
  const hid = useId()
  return (
    <section className="card tasks" aria-labelledby={hid}>
      <div className="card-head">
        <span className="mark" aria-hidden="true"><ListTodo size={15} strokeWidth={1.75} /></span>
        <h2 id={hid} className="card-title">To schedule</h2>
        <span className="card-count">{tasks.length}</span>
      </div>
      {tasks.length === 0 ? (
        <p className="tasks-empty">Nothing waiting. Type a task in the bar above without a time and it lands here.</p>
      ) : (
        <ul className="tasks-list">
          {tasks.map((t) => (
            <li key={t.id} className={`task${draggingId === t.id ? ' is-away' : ''}`} data-target={`task-${t.id}`}>
              <span
                className="task-grip"
                aria-hidden="true"
                onPointerDown={(e) => interactive && onGrab?.(t, e)}
                title="Drag into the day"
              >
                <GripVertical size={14} strokeWidth={1.75} />
              </span>
              <div className="task-body" onPointerDown={(e) => interactive && onGrab?.(t, e)}>
                <KindDot kind={t.kind} size={28} />
                <span className="task-text">
                  <span className="task-title">{t.title}</span>
                  <span className="task-meta">{KIND_LABEL[t.kind]} · {fmtDur(t.est)}</span>
                </span>
              </div>
              {interactive && (
                <span className="task-actions">
                  <button type="button" className="icon-btn" aria-label={`Schedule “${t.title}” in the next free slot`} onClick={() => onSchedule?.(t.id)}>
                    <CalendarPlus size={16} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                  <button type="button" className="icon-btn" aria-label={`Remove “${t.title}”`} onClick={() => onDelete?.(t.id)}>
                    <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="tasks-hint">Drag a task into the day, or press <CalendarPlus size={13} strokeWidth={1.75} aria-label="Schedule" className="inline-icon" /> for the next free slot.</p>
    </section>
  )
}

export function TaskGhost({ task, x, y }: { task: Task; x: number; y: number }) {
  return (
    <div className="task-ghost" style={{ transform: `translate(${x}px, ${y}px) rotate(-1.5deg)` }} aria-hidden="true">
      <KindDot kind={task.kind} size={28} />
      <span className="task-text">
        <span className="task-title">{task.title}</span>
        <span className="task-meta">{KIND_LABEL[task.kind]} · {fmtDur(task.est)}</span>
      </span>
    </div>
  )
}
