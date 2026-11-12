import { useCallback, useState } from 'react'
import { Stage } from '@kit/stage'
import type { Act } from '@kit/act'
import { QuickAdd } from '../../components/QuickAdd'
import { DepthProfile } from '../../components/DepthProfile'
import { Timeline } from '../../components/Timeline'
import { KindIcon } from '../../components/KindIcon'
import { parse } from '../../model/parse'
import { fmtDate, fmtDur, fmtTime } from '../../model/time'
import type { Block } from '../../model/types'
import { DemoFrame } from '../DemoFrame'
import { DEMO_TODAY, QA_DAY, TOMORROW } from '../demoData'
import { useTheme } from '../../theme'
import { STAGE_TOKENS } from './stageTokens'

const PHRASE = 'Write launch email 90m tomorrow 9am'
const P = parse(PHRASE, DEMO_TODAY)
const NEW: Block = { id: 'new', date: TOMORROW, start: P.start!, dur: P.dur!, title: P.title, kind: P.kind, done: false, focused: 0, notes: '' }

const REST = { wide: { x: 640, y: 380 }, compact: { x: 320, y: 500 } }

type S = { text: string; pressed: boolean; fly: null | { from: { x: number; y: number }; to: { x: number; y: number }; at: 'from' | 'to' }; added: boolean; toast: boolean }
const initial: S = { text: '', pressed: false, fly: null, added: false, toast: false }
const poster: S = { ...initial, added: true }
const STEPS = ['Type it the way you say it', 'Keel reads the time and kind', 'It lands in the day']

export function QuickAddDemo() {
  const [step, setStep] = useState(0)
  const { resolved } = useTheme()

  const script = useCallback(async (a: Act<S>) => {
    setStep(0)
    await a.wait(600)
    await a.click('qa-input')
    await a.wait(200)
    const typing = a.type('text', PHRASE, { interval: 60 })
    await a.wait(1200)
    setStep(1)
    await typing
    await a.wait(1300)
    setStep(2)
    await a.key('enter')
    const field = a.rect('qa-input')
    const grid = a.rect('tl-grid')
    const from = { x: field.x + 8, y: field.y + 4 }
    const to = { x: grid.x + 6, y: grid.y + (NEW.start - 8 * 60) * (52 / 60) + 6 }
    await a.set({ pressed: true, text: '', fly: { from, to, at: 'from' } })
    await a.wait(60)
    await a.set({ pressed: false, fly: { from, to, at: 'to' } })
    await a.wait(700)
    await a.set({ fly: null, added: true })
    await a.wait(400)
    await a.set({ toast: true })
    await a.wait(2400)
    await a.click('toast-undo')
    await a.set({ added: false, toast: false })
    await a.move(REST[a.layout])
    await a.wait(700)
  }, [])

  return (
    <DemoFrame label="Demo: adding a block by typing in plain words" steps={STEPS} step={step}>
      {(playing, run) => (
        <Stage<S>
          key={`${run}-${playing}-${resolved}`}
          width={720}
          height={420}
          compact={{ below: 600, width: 358, height: 540 }}
          initial={initial}
          poster={poster}
          script={playing ? script : undefined}
          cursor={{ at: REST }}
          keys={{ wide: 'bottom', compact: 'bottom' }}
          theme={resolved}
          tokens={STAGE_TOKENS}
          className="sd sd-qa"
        >
          {(s, _r, layout) => {
            const blocks = s.added ? [...QA_DAY, NEW] : QA_DAY
            const flyTo = s.fly ? (s.fly.at === 'to' ? s.fly.to : s.fly.from) : null
            return (
              <>
                <div className="sd-qabar">
                  <QuickAdd today={DEMO_TODAY} value={s.text} showChips={layout === 'wide'} pressed={s.pressed} id={`qa-demo-${layout}`} />
                </div>
                <div className="sd-day card">
                  <div className="day-head">
                    <div className="card-title">Tomorrow, {fmtDate(TOMORROW)}</div>
                    <span className="day-meta">{s.added ? `${fmtDur(NEW.dur)} deep` : 'No deep work yet'}</span>
                  </div>
                  <DepthProfile blocks={blocks} now={null} from={8 * 60} to={13 * 60} height={40} />
                  <Timeline blocks={blocks} now={null} from={8 * 60} to={13 * 60} hour={52} interactive={false} selectedId={s.added && !s.toast ? 'new' : null} className="sd-tl" />
                </div>
                {s.fly && flyTo && (
                  <div className="sd-fly k-deep" style={{ transform: `translate(${flyTo.x}px, ${flyTo.y}px)` }} aria-hidden="true">
                    <KindIcon kind="deep" size={14} />
                    {NEW.title} · {fmtTime(NEW.start)}
                  </div>
                )}
                <div className={`sd-toast toast${s.toast ? ' is-in' : ''}`} aria-hidden={!s.toast}>
                  <span>Added “{NEW.title}” · tomorrow, {fmtTime(NEW.start)}</span>
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
