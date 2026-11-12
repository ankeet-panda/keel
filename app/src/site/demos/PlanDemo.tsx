import { useCallback, useState } from 'react'
import { Stage } from '@kit/stage'
import type { Act } from '@kit/act'
import { Timeline } from '../../components/Timeline'
import { TaskList } from '../../components/TaskList'
import { DepthProfile } from '../../components/DepthProfile'
import { KindDot } from '../../components/KindIcon'
import { dayStats } from '../../model/derive'
import { KIND_LABEL, type Block } from '../../model/types'
import { clamp, fmtDur, fmtTime, snap } from '../../model/time'
import { DemoFrame } from '../DemoFrame'
import { DEMO_TODAY, PLAN_DAY, PLAN_TASKS } from '../demoData'
import { useTheme } from '../../theme'
import { STAGE_TOKENS } from './stageTokens'

const FROM = 12 * 60
const TO = 17 * 60 + 30
const HOUR = 56
const PPM = HOUR / 60
const MOVED = PLAN_TASKS[0]

const REST = { wide: { x: 560, y: 410 }, compact: { x: 300, y: 520 } }

type S = { carrying: boolean; ghost: { x: number; y: number } | null; over: number | null; placed: boolean; toast: boolean }
const initial: S = { carrying: false, ghost: null, over: null, placed: false, toast: false }
const poster: S = { ...initial, placed: true }
const STEPS = ['Pick up a task', 'Drop it on a free hour', 'The day gets deeper']

const placedBlock: Block = { id: 'placed', date: DEMO_TODAY, start: 14 * 60, dur: MOVED.est, title: MOVED.title, kind: MOVED.kind, done: false, focused: 0, notes: '' }

export function PlanDemo() {
  const [step, setStep] = useState(0)
  const { resolved } = useTheme()

  const script = useCallback(async (a: Act<S>) => {
    setStep(0)
    await a.wait(700)
    const card = a.rect(`task-${MOVED.id}`)
    const grab = { x: card.x + 46, y: card.y + card.height / 2 }
    await a.move(grab)
    await a.wait(250)
    const grid = a.rect('tl-grid')
    const to = { x: grid.x + grid.width * 0.42, y: grid.y + (14 * 60 + 25 - FROM) * PPM }
    const off = { x: grab.x - card.x, y: grab.y - card.y }
    setStep(1)
    await a.drag(to, (at) => {
      const m = FROM + (at.y - grid.y) / PPM
      const over = at.x > grid.x - 20 ? clamp(snap(m - 30), FROM, TO - MOVED.est) : null
      a.put({ carrying: true, ghost: { x: at.x - off.x, y: at.y - off.y }, over })
    }, { duration: 1400 })
    await a.set({ carrying: false, ghost: null, over: null, placed: true })
    setStep(2)
    await a.wait(500)
    await a.set({ toast: true })
    await a.wait(2600)
    await a.click('toast-undo')
    await a.set({ placed: false, toast: false })
    await a.move(REST[a.layout])
    await a.wait(900)
  }, [])

  return (
    <DemoFrame label="Demo: dragging a task into a free hour" steps={STEPS} step={step}>
      {(playing, run) => (
        <Stage<S>
          key={`${run}-${playing}-${resolved}`}
          width={720}
          height={440}
          compact={{ below: 600, width: 358, height: 620 }}
          initial={initial}
          poster={poster}
          script={playing ? script : undefined}
          cursor={{ at: REST }}
          theme={resolved}
          tokens={STAGE_TOKENS}
          className="sd sd-plan"
        >
          {(s, _r, layout) => {
            const blocks = s.placed ? [...PLAN_DAY, placedBlock] : PLAN_DAY
            const tasks = s.placed ? PLAN_TASKS.filter((t) => t.id !== MOVED.id) : layout === 'compact' ? PLAN_TASKS.slice(0, 2) : PLAN_TASKS
            const st = dayStats(blocks)
            return (
              <>
                <div className="sd-tasks">
                  <TaskList tasks={tasks} draggingId={s.carrying ? MOVED.id : null} interactive={false} />
                </div>
                <div className="sd-day card">
                  <div className="day-head">
                    <div className="card-title">Depth of the afternoon</div>
                    <span className="day-meta">{st.deepPlanned ? `${fmtDur(st.deepPlanned)} deep` : 'No deep work yet'}</span>
                  </div>
                  <DepthProfile blocks={blocks} now={null} from={FROM} to={TO} height={44} />
                  <Timeline
                    blocks={blocks}
                    now={13 * 60 + 20}
                    from={FROM}
                    to={TO}
                    hour={HOUR}
                    interactive={false}
                    selectedId={s.placed && !s.toast ? 'placed' : null}
                    preview={s.over !== null ? { start: s.over, dur: MOVED.est, kind: MOVED.kind, title: MOVED.title } : null}
                    className="sd-tl"
                  />
                </div>
                {s.ghost && (
                  <div className="task-ghost sd-ghost" style={{ transform: `translate(${s.ghost.x}px, ${s.ghost.y}px) rotate(-1.5deg)` }} aria-hidden="true">
                    <KindDot kind={MOVED.kind} size={28} />
                    <span className="task-text">
                      <span className="task-title">{MOVED.title}</span>
                      <span className="task-meta">{KIND_LABEL[MOVED.kind]} · {fmtDur(MOVED.est)}</span>
                    </span>
                  </div>
                )}
                <div className={`sd-toast sd-toast--left toast${s.toast ? ' is-in' : ''}`} aria-hidden={!s.toast}>
                  <span>Scheduled at {fmtTime(14 * 60)}</span>
                  <span className="toast-undo" data-target="toast-undo">Undo</span>
                </div>
              </>
            )
          }}
        </Stage>
      )}
    </DemoFrame>
  )
}
