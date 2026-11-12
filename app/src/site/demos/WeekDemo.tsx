import { useCallback, useState } from 'react'
import { Stage } from '@kit/stage'
import type { Act } from '@kit/act'
import { WeekView } from '../../components/Week'
import { DepthProfile } from '../../components/DepthProfile'
import { Timeline } from '../../components/Timeline'
import { dayBlocks, dayStats } from '../../model/derive'
import { fmtDate, fmtDur, fmtWeek } from '../../model/time'
import { DemoFrame } from '../DemoFrame'
import { DEMO_TODAY, WEEK_BLOCKS, WEEK_START } from '../demoData'
import { useTheme } from '../../theme'
import { STAGE_TOKENS } from './stageTokens'

const TUESDAY = '2026-11-10'
const REST = { wide: { x: 640, y: 120 }, compact: { x: 320, y: 120 } }

type S = { reveal: number; day: boolean }
const initial: S = { reveal: 1, day: false }
const poster: S = { reveal: 1, day: false }
const STEPS = ['Planned against done', 'Your deepest day', 'Open any day']

export function WeekDemo() {
  const [step, setStep] = useState(0)
  const { resolved } = useTheme()

  const script = useCallback(async (a: Act<S>) => {
    setStep(0)
    await a.wait(1800)
    setStep(1)
    await a.move('row-2026-11-10')
    await a.wait(1400)
    setStep(2)
    await a.click('row-2026-11-10')
    await a.set({ day: true })
    await a.wait(3200)
    await a.click('tab-week')
    await a.set({ day: false })
    await a.move(REST[a.layout])
    await a.wait(300)
  }, [])

  const tue = dayBlocks(WEEK_BLOCKS, TUESDAY)
  const st = dayStats(tue)

  return (
    <DemoFrame label="Demo: reviewing the week's deep work" steps={STEPS} step={step}>
      {(playing, run) => (
        <Stage<S>
          key={`${run}-${playing}-${resolved}`}
          width={720}
          height={540}
          compact={{ below: 600, width: 358, height: 560 }}
          initial={initial}
          poster={poster}
          script={playing ? script : undefined}
          cursor={{ at: REST }}
          theme={resolved}
          tokens={STAGE_TOKENS}
          className="sd sd-week"
        >
          {(s) => (
            <>
              <div className="sd-weekbar">
                <div className="seg" role="presentation">
                  <span className={`seg-btn${s.day ? ' is-on' : ''}`}>Day</span>
                  <span className={`seg-btn${!s.day ? ' is-on' : ''}`} data-target="tab-week">Week</span>
                </div>
                <span className="sd-weektitle">{s.day ? fmtDate(TUESDAY) : `Work week, ${fmtWeek(WEEK_START).replace('15', '13')}`}</span>
              </div>
              <div className={`sd-pane${s.day ? ' is-out' : ''}`}>
                <WeekView blocks={WEEK_BLOCKS} start={WEEK_START} today={DEMO_TODAY} reveal={s.reveal} days={5} />
              </div>
              <div className={`sd-pane sd-pane--day${s.day ? '' : ' is-out'}`}>
                <div className="card sd-tueday">
                  <div className="day-head">
                    <div className="card-title">Depth of the day</div>
                    <span className="day-meta">{fmtDur(st.deepDone)} deep, all done</span>
                  </div>
                  <DepthProfile blocks={tue} now={null} height={56} />
                  <Timeline blocks={tue} now={null} from={8 * 60 + 15} to={14 * 60 + 15} hour={52} interactive={false} className="sd-tl" />
                </div>
              </div>
            </>
          )}
        </Stage>
      )}
    </DemoFrame>
  )
}
