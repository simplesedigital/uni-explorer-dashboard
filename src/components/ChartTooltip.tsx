import type { TooltipProps } from 'recharts'

interface Props extends TooltipProps<number, string> {
  title: (label: string) => string
  format: (v: number | null) => string
  name: string
}

export default function ChartTooltip({ active, payload, label, title, format, name }: Props) {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <div className="tooltip">
      <div className="tooltip-title">{title(String(label))}</div>
      <div className="tooltip-row">
        <span className="tooltip-swatch" style={{ background: payload[0].color }} />
        <span>{name}</span>
        <strong>{format(v ?? null)}</strong>
      </div>
    </div>
  )
}
