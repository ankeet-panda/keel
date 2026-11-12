import type { ReactNode } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { ThemeSwitch } from '../App'
import { KindDot } from '../components/KindIcon'
import { KINDS, KIND_LABEL, type Kind } from '../model/types'
import { HeroDay } from './HeroDay'
import { PlanDemo } from './demos/PlanDemo'
import { FocusDemo } from './demos/FocusDemo'
import { WeekDemo } from './demos/WeekDemo'
import { QuickAddDemo } from './demos/QuickAddDemo'
import '../styles/site.css'

const KIND_LINE: Record<Kind, string> = {
  deep: 'Writing, building, thinking hard. The line dives.',
  shallow: 'Email, admin, reviews. Just under the surface.',
  meeting: 'Calls and reviews with people. Near the top.',
  break: 'Lunch, a walk, a reset. At the surface.',
}

function Feature({ id, title, body, points, demo, flip, band }: { id: string; title: string; body: ReactNode; points: string[]; demo: ReactNode; flip?: boolean; band?: boolean }) {
  return (
    <section id={id} className={`feature${flip ? ' feature--flip' : ''}${band ? ' feature--band' : ''}`} aria-labelledby={`${id}-h`}>
      <div className="feature-copy">
        <h2 id={`${id}-h`} className="feature-title">{title}</h2>
        <p className="feature-body">{body}</p>
        <ul className="feature-points">
          {points.map((p) => (
            <li key={p}>
              <Check size={16} strokeWidth={2} aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className="feature-demo">{demo}</div>
    </section>
  )
}

export function Landing() {
  return (
    <div className="site">
      <header className="nav">
        <a className="nav-brand" href="#top" aria-label="Keel, back to top">Keel</a>
        <nav className="nav-links" aria-label="Features">
          <a href="#plan">Plan</a>
          <a href="#focus">Focus</a>
          <a href="#review">Review</a>
          <a href="#quick-add">Quick add</a>
        </nav>
        <div className="nav-end">
          <ThemeSwitch />
          <a className="btn btn--primary btn--sm nav-cta" href="#/app">Open Keel</a>
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-h">
          <div className="hero-copy">
            {/* lint-allow: trailing-period the hero is two short sentences; the stop between them is the rhythm */}
            <h1 id="hero-h" className="hero-title">Plan the day. Then go&nbsp;deep.</h1>
            <p className="hero-lead">
              Keel turns your tasks into time blocks and guards the hours for focused work, so the important thing gets done, not only the urgent ones.
            </p>
            <div className="hero-actions">
              <a className="btn btn--primary btn--lg" href="#/app">
                Open the planner
                <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />
              </a>
              <a className="hero-link" href="#plan">See how it works</a>
            </div>
            <p className="hero-note">Free in your browser. Your plan stays on this device.</p>
          </div>
          <HeroDay />
        </section>

        <section className="depth-key" aria-labelledby="key-h">
          <div className="depth-key-head">
            <h2 id="key-h" className="key-title">Every hour has a depth</h2>
            <p className="key-body">
              Keel draws your day as a line, like a depth reading of water. Meetings and email keep you near the surface; deep work dives. One look tells you whether today has room for the work that matters.
            </p>
          </div>
          <ul className="key-list">
            {KINDS.map((k) => (
              <li key={k} className={`key-item k-${k}`}>
                <KindDot kind={k} size={36} />
                <span className="key-text">
                  <span className="key-name">{KIND_LABEL[k]}</span>
                  <span className="key-line">{KIND_LINE[k]}</span>
                </span>
                <span className="key-depth" aria-hidden="true"><i style={{ height: `${{ deep: 100, shallow: 42, meeting: 22, break: 8 }[k]}%` }} /></span>
              </li>
            ))}
          </ul>
        </section>

        <Feature
          id="plan"
          title="Give every task a place"
          body="Drag a task from your list onto a free hour. Keel sizes the block from your estimate, and the depth line shows how much of the day is now set aside for real work."
          points={['Blocks snap to 15 minutes', 'Arrow keys move a block; Shift with arrows resizes it', 'No mouse? Schedule puts it in the next free slot']}
          demo={<PlanDemo />}
        />
        <Feature
          id="focus"
          band
          title="When it’s time, only the block remains"
          body="Start focus and the planner steps back: one block, one ring, the minutes left. Finish, and the time counts toward your deep work for the day."
          points={['Pause, add five minutes, or leave and keep your time', 'Space pauses, Escape leaves', 'Runs to the end of the block you’re in']}
          demo={<FocusDemo />}
        />
        <Feature
          id="review"
          title="See how deep your week went"
          body="Each day’s planned deep work against what really happened, with the shape of the day beside it. Keel names the day that went deepest and how often the plan held."
          points={['Hatched is planned, solid is done', 'Open any day from its row', 'Counts only time you marked done or spent in focus']}
          demo={<WeekDemo />}
        />
        <Feature
          id="quick-add"
          flip
          title="Type it the way you’d say it"
          body={<>“Write launch email 90m tomorrow 9am” becomes a 90-minute block, tomorrow at nine. Leave out the time and it waits in your list. It’s worked out on your device; nothing is sent anywhere.</>}
          points={['Understands 90m, 1.5h, 1h30, noon, 3pm, Friday', 'Guesses the kind of work from the words, or use #deep, #meeting', 'Press N anywhere in the planner to start typing']}
          demo={<QuickAddDemo />}
        />

        <section className="closing" aria-labelledby="close-h">
          <h2 id="close-h" className="closing-title">Your next deep hour is one drag away</h2>
          <a className="btn btn--primary btn--lg" href="#/app">
            Open the planner
            <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />
          </a>
          <p className="closing-note">Comes with a sample week to try. Restore it any time from the planner.</p>
        </section>
      </main>

      <footer className="foot">
        <span className="foot-brand">Keel</span>
        <span>A design prototype. People, work and numbers in the samples are invented.</span>
      </footer>
    </div>
  )
}
