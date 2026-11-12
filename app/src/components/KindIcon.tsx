import { Anchor, Coffee, Inbox, Users, type LucideProps } from 'lucide-react'
import type { Kind } from '../model/types'

// One glyph per kind of work, from one set (Lucide), one stroke.
const GLYPH = { deep: Anchor, shallow: Inbox, meeting: Users, break: Coffee }

export function KindIcon({ kind, size = 16, ...rest }: { kind: Kind } & LucideProps) {
  const G = GLYPH[kind]
  return <G size={size} strokeWidth={1.75} aria-hidden="true" {...rest} />
}

/** A tinted circle with the whole glyph in the kind's ink: for kind lists and legends only */
export function KindDot({ kind, size = 28 }: { kind: Kind; size?: number }) {
  return (
    <span className={`kind-dot k-${kind}`} style={{ width: size, height: size }} aria-hidden="true">
      <KindIcon kind={kind} size={Math.round(size * 0.52)} />
    </span>
  )
}
