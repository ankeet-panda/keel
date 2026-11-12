import { useCallback, useState } from 'react'
import { Stage } from '@kit/stage'
import type { Act } from '@kit/act'
import { Timeline } from '../../components/Timeline'
import { Glance } from '../../components/SidePanel'
import { FocusView } from '../../components/Focus'
import { fmtDur } from '../../model/time'
import { DemoFrame } from '../DemoFrame'
import { FOCUS_DAY } from '../demoData'
import { useTheme } from '../../theme'
import { STAGE_TOKENS } from './stageTokens'

const BLOCK = FOCUS_DAY[2]
const NOW = 9 * 60 + 2
const TOTAL = (BLOCK.start + BLOCK.dur - NOW) * 60
const SESSION_MIN = TOTAL / 60

const REST = { wide: { x: 620, y: 410 }, compact: { x: 300, y: 440 } }

type S = { room: boolean; elapsed: number; done: boolean; toast: boolean; lapse: boolean }
const initial: S = { room: false, elapsed: 0, done: false, toast: false, lapse: false }
const poster: S = { ...initial, done: true }
const STEPS = ['Start focus', 'One block, nothing else', 'Finish, and it counts']

export function FocusDemo() {
  const [step, setStep] = useState(0)
  const { resolved } = useTheme()

  const script = useCallback(async (a: Act<S>) => {
    setStep(0)
    await a.wait(700)
    await a.click('start-focus')
    await a.set({ room: true })
    setStep(1)
    await a.wait(900)
    // The session, sped up: 88 minutes in about three seconds
    await a.set({ lapse: true })
    for (let i = 1; i <= 44; i++) {
      a.put({ elapsed: Math.round((TOTAL * i) / 44) })
      await a.wait(70)
    }
    await a.set({ lapse: false })
    await a.wait(500)
    setStep(2)
    await a.click('focus-finish')
    await a.set({ room: false, done: true, elapsed: 0 })
    await a.wait(500)
    await a.set({ toast: true })
    await a.wait(2400)
    await a.click('toast-undo')
    await a.set({ done: false, toast: false })
    await a.move(REST[a.layout])
    await a.wait(800)
  }, [])

  return (
    <DemoFrame label="Demo: a focus session from start to finish" steps={STEPS} step={step}>
      {(playing, run) => (
        <Stage<S>
          key={`${run}-${playing}-${resolved}`}
          width={720}
          height={480}
          compact={{ below: 600, width: 358, height: 470 }}
          initial={initial}
          poster={poster}
          script={playing ? script : undefined}
          cursor={{ at: REST }}
          theme={resolved}
          tokens={STAGE_TOKENS}
          className="sd sd-focus"
        >
          {(s, _r, layout) => {
            const blocks = FOCUS_DAY.map((b) => (b.id === BLOCK.id ? { ...b, done: s.done, focused: s.done ? SESSION_MIN : 0 } : b))
            return (
              <>
                {layout === 'wide' && (
                  <div className="sd-day card">
                    <Timeline blocks={blocks} now={NOW} from={8 * 60 + 15} to={12 * 60 + 45} hour={84} interactive={false} className="sd-tl" />
                  </div>
                )}
                <div className="sd-glance">
                  <Glance blocks={blocks} now={NOW} isToday interactive={false} onFocus={() => {}} onSelect={() => {}} />
                </div>
                <div className={`sd-room${s.room ? ' is-in' : ''}`} aria-hidden={!s.room}>
                  <FocusView block={BLOCK} elapsed={s.elapsed} total={TOTAL} paused={false} endsAt={BLOCK.start + BLOCK.dur} ringSize={layout === 'wide' ? 220 : 200} onLeave={() => {}} />
                  <span className={`sd-lapse${s.lapse ? ' is-in' : ''}`}>Sped up</span>
                </div>
                <div className={`sd-toast sd-toast--left toast${s.toast ? ' is-in' : ''}`} aria-hidden={!s.toast}>
                  <span>Finished · {fmtDur(SESSION_MIN)} of focus</span>
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
