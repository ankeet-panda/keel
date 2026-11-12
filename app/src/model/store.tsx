import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Block, Data, Task } from './types'
import { seed } from './seed'
import { iso } from './time'

const KEY = 'keel.data.v1'

function load(): Data | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const d = JSON.parse(raw) as Data
    return d && d.v === 1 && Array.isArray(d.blocks) && Array.isArray(d.tasks) ? d : null
  } catch {
    return null
  }
}

function save(d: Data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d))
  } catch {
    /* storage blocked (private window): the planner still works for this visit */
  }
}

let counter = 0
export const newId = (p: string) => `${p}${Date.now().toString(36)}${(++counter).toString(36)}`

export interface Notice {
  id: number
  text: string
  /** Restores the data as it was before the change */
  undo?: () => void
}

interface Store {
  data: Data
  saved: boolean
  addBlock(b: Omit<Block, 'id' | 'done' | 'focused' | 'notes'> & Partial<Pick<Block, 'notes'>>): string
  updateBlock(id: string, patch: Partial<Block>): void
  deleteBlock(id: string): void
  addTask(t: Omit<Task, 'id'>): string
  deleteTask(id: string): void
  scheduleTask(taskId: string, date: string, start: number): string | null
  unschedule(blockId: string): void
  resetSample(): void
  notices: Notice[]
  notify(text: string, undo?: () => void): void
  dismiss(id: number): void
}

const Ctx = createContext<Store | null>(null)

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside StoreProvider')
  return s
}

// ?at=10:40 pins the clock's time of day (for screenshots and reviews); the date stays real
const pinned = (() => {
  const m = new URLSearchParams(location.search).get('at')?.match(/^(\d{1,2}):(\d{2})$/)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
})()
const nowMinutes = () => {
  const d = new Date()
  return pinned ?? d.getHours() * 60 + d.getMinutes()
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(() => (pinned === null && load()) || seed(iso(new Date()), nowMinutes()))
  const [saved, setSaved] = useState(true)
  const [notices, setNotices] = useState<Notice[]>([])
  const ref = useRef(data)
  ref.current = data

  useEffect(() => {
    if (pinned === null) save(data)
    setSaved(true)
  }, [data])

  const notify = useCallback((text: string, undo?: () => void) => {
    const id = Date.now() + Math.random()
    setNotices((n) => [...n.slice(-2), { id, text, undo }])
  }, [])
  const dismiss = useCallback((id: number) => setNotices((n) => n.filter((x) => x.id !== id)), [])

  const commit = useCallback((next: Data) => {
    setSaved(false)
    setData(next)
  }, [])

  const store = useMemo<Store>(() => {
    const restore = (before: Data) => () => commit(before)
    return {
      data,
      saved,
      notices,
      notify,
      dismiss,
      addBlock(b) {
        const id = newId('b')
        const d = ref.current
        commit({ ...d, blocks: [...d.blocks, { notes: '', ...b, id, done: false, focused: 0 }] })
        return id
      },
      updateBlock(id, patch) {
        const d = ref.current
        commit({ ...d, blocks: d.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) })
      },
      deleteBlock(id) {
        const d = ref.current
        const b = d.blocks.find((x) => x.id === id)
        if (!b) return
        commit({ ...d, blocks: d.blocks.filter((x) => x.id !== id) })
        notify(`Deleted “${b.title}”`, restore(d))
      },
      addTask(t) {
        const id = newId('t')
        const d = ref.current
        commit({ ...d, tasks: [{ ...t, id }, ...d.tasks] })
        return id
      },
      deleteTask(id) {
        const d = ref.current
        const t = d.tasks.find((x) => x.id === id)
        if (!t) return
        commit({ ...d, tasks: d.tasks.filter((x) => x.id !== id) })
        notify(`Removed “${t.title}”`, restore(d))
      },
      scheduleTask(taskId, date, start) {
        const d = ref.current
        const t = d.tasks.find((x) => x.id === taskId)
        if (!t) return null
        const id = newId('b')
        const block: Block = { id, date, start, dur: t.est, title: t.title, kind: t.kind, done: false, focused: 0, notes: '' }
        commit({ ...d, tasks: d.tasks.filter((x) => x.id !== taskId), blocks: [...d.blocks, block] })
        return id
      },
      unschedule(blockId) {
        const d = ref.current
        const b = d.blocks.find((x) => x.id === blockId)
        if (!b) return
        const task: Task = { id: newId('t'), title: b.title, est: b.dur, kind: b.kind }
        commit({ ...d, blocks: d.blocks.filter((x) => x.id !== blockId), tasks: [task, ...d.tasks] })
        notify(`Moved “${b.title}” back to To schedule`, restore(d))
      },
      resetSample() {
        const d = ref.current
        commit(seed(iso(new Date()), nowMinutes()))
        notify('Sample week restored', restore(d))
      },
    }
  }, [data, saved, notices, notify, dismiss, commit])

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

/** The current minute and date, ticking every 20 s */
export function useNow(): { today: string; now: number } {
  const [t, setT] = useState(() => new Date())
  useEffect(() => {
    const i = window.setInterval(() => setT(new Date()), 20_000)
    return () => window.clearInterval(i)
  }, [])
  return { today: iso(t), now: pinned ?? t.getHours() * 60 + t.getMinutes() }
}
