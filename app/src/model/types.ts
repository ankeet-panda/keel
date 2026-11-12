export type Kind = 'deep' | 'shallow' | 'meeting' | 'break'

export const KINDS: Kind[] = ['deep', 'shallow', 'meeting', 'break']

export const KIND_LABEL: Record<Kind, string> = {
  deep: 'Deep work',
  shallow: 'Shallow work',
  meeting: 'Meeting',
  break: 'Break',
}

/** How far down each kind of work sits on the depth profile (0 surface, 1 deepest). */
export const KIND_DEPTH: Record<Kind, number> = { deep: 1, shallow: 0.42, meeting: 0.22, break: 0.08 }

export interface Block {
  id: string
  /** Local date, YYYY-MM-DD */
  date: string
  /** Minutes from midnight */
  start: number
  /** Minutes */
  dur: number
  title: string
  kind: Kind
  done: boolean
  /** Minutes actually spent in focus mode on this block */
  focused: number
  notes: string
}

export interface Task {
  id: string
  title: string
  /** Estimated minutes */
  est: number
  kind: Kind
}

export interface Data {
  v: 1
  blocks: Block[]
  tasks: Task[]
}
