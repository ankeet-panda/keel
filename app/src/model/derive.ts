import type { Block, Kind } from './types'
import { KIND_DEPTH } from './types'
import { DAY_END, DAY_START, SNAP } from './time'

export const dayBlocks = (blocks: Block[], date: string) =>
  blocks.filter((b) => b.date === date).sort((a, b) => a.start - b.start || a.dur - b.dur)

/** Minutes of deep work that really happened on a block */
export const deepMinutes = (b: Block) => (b.kind !== 'deep' ? 0 : b.focused > 0 ? b.focused : b.done ? b.dur : 0)

export function dayStats(blocks: Block[]) {
  let deepPlanned = 0
  let deepDone = 0
  let planned = 0
  for (const b of blocks) {
    planned += b.dur
    if (b.kind === 'deep') deepPlanned += b.dur
    deepDone += deepMinutes(b)
  }
  return { deepPlanned, deepDone, planned }
}

/** The block running at `now`, if any */
export const current = (blocks: Block[], now: number) => blocks.find((b) => b.start <= now && now < b.start + b.dur)

/** The next block that hasn't started yet */
export const next = (blocks: Block[], now: number) => blocks.find((b) => b.start >= now)

/** Earliest free slot of `dur` minutes at or after `from`, within the day; null if the day is full */
export function freeSlot(blocks: Block[], dur: number, from: number): number | null {
  let t = Math.max(DAY_START, Math.ceil(from / SNAP) * SNAP)
  const sorted = [...blocks].sort((a, b) => a.start - b.start)
  while (t + dur <= DAY_END) {
    const clash = sorted.find((b) => b.start < t + dur && t < b.start + b.dur)
    if (!clash) return t
    t = Math.ceil((clash.start + clash.dur) / SNAP) * SNAP
  }
  return null
}

/** Lay overlapping blocks side by side: column index and column count for each id */
export function lanes(blocks: Block[]): Map<string, { col: number; cols: number }> {
  const out = new Map<string, { col: number; cols: number }>()
  const sorted = [...blocks].sort((a, b) => a.start - b.start)
  let group: Block[] = []
  let groupEnd = -1
  const flush = () => {
    const ends: number[] = []
    const cols = new Map<string, number>()
    for (const b of group) {
      let c = ends.findIndex((e) => e <= b.start)
      if (c === -1) { c = ends.length; ends.push(0) }
      ends[c] = b.start + b.dur
      cols.set(b.id, c)
    }
    for (const b of group) out.set(b.id, { col: cols.get(b.id)!, cols: ends.length })
    group = []
  }
  for (const b of sorted) {
    if (b.start >= groupEnd && group.length) flush()
    group.push(b)
    groupEnd = Math.max(groupEnd, b.start + b.dur)
  }
  if (group.length) flush()
  return out
}

export interface Segment { start: number; end: number; depth: number; kind: Kind | null; done: boolean }

/** The day as depth over time, from DAY_START to DAY_END. Overlaps take the deeper block. */
export function profile(blocks: Block[], from = DAY_START, to = DAY_END): Segment[] {
  const segs: Segment[] = []
  const edges = new Set<number>([from, to])
  for (const b of blocks) {
    if (b.start + b.dur <= from || b.start >= to) continue
    edges.add(Math.max(from, b.start))
    edges.add(Math.min(to, b.start + b.dur))
  }
  const xs = [...edges].sort((a, b) => a - b)
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i]
    const z = xs[i + 1]
    const here = blocks.filter((b) => b.start <= a && a < b.start + b.dur)
    const top = here.sort((p, q) => KIND_DEPTH[q.kind] - KIND_DEPTH[p.kind])[0]
    const seg: Segment = top
      ? { start: a, end: z, depth: KIND_DEPTH[top.kind], kind: top.kind, done: top.done }
      : { start: a, end: z, depth: 0, kind: null, done: false }
    const last = segs[segs.length - 1]
    if (last && last.depth === seg.depth && last.kind === seg.kind && last.done === seg.done && last.end === seg.start) last.end = seg.end
    else segs.push(seg)
  }
  return segs
}

/**
 * The sounding line as an SVG path in a w × h box. Depth changes ease over `ramp` minutes, centred on the edge,
 * like a line drawn by an echo sounder rather than a staircase.
 */
export function soundingPath(segs: Segment[], w: number, h: number, from = DAY_START, to = DAY_END, ramp = 12, inset = 2) {
  const x = (m: number) => ((m - from) / (to - from)) * w
  const y = (d: number) => inset + d * (h - inset * 2)
  if (!segs.length) return { line: `M0 ${y(0)} H${w}`, area: `M0 0 H${w} V${y(0)} H0 Z` }
  let line = `M0 ${y(segs[0].depth)}`
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i]
    const nextSeg = segs[i + 1]
    if (!nextSeg) { line += ` H${x(s.end)}`; break }
    const half = Math.min(ramp / 2, (s.end - s.start) / 2, (nextSeg.end - nextSeg.start) / 2)
    const a = x(s.end - half)
    const b = x(s.end + half)
    const y0 = y(s.depth)
    const y1 = y(nextSeg.depth)
    line += ` H${a.toFixed(2)} C${((a + b) / 2).toFixed(2)} ${y0.toFixed(2)} ${((a + b) / 2).toFixed(2)} ${y1.toFixed(2)} ${b.toFixed(2)} ${y1.toFixed(2)}`
  }
  const area = `${line} V0 H0 Z`
  return { line, area }
}
