import { useId } from 'react'

/**
 * A flat sweep ring: the fill turns from deep water toward its head (23° hue turn), round caps, on a pale track of
 * the same hue. `value` 0–1.
 */
export function Ring({ value, size = 280, stroke = 18, className = '' }: { value: number; size?: number; stroke?: number; className?: string }) {
  const uid = useId().replace(/:/g, '')
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  return (
    <svg className={`ring ${className}`} width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <defs>
        <linearGradient id={`r${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--deep)" />
          <stop offset="1" stopColor="var(--deep-head)" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="ring-track" strokeWidth={stroke} />
      {v > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#r${uid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * v} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="ring-fill"
        />
      )}
    </svg>
  )
}
