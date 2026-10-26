import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { addDays, timeSeries, type Filters, type Grain, type Metrics } from '../lib/data'
import { fmt, shortDate } from '../lib/format'
import { useChartTheme } from '../lib/theme'
import ChartTooltip from './ChartTooltip'

interface Props {
  facts: (Metrics & { d: string })[]
  filters: Filters
  grain: Grain
  onGrainChange: (g: Grain) => void
}

type Field = 'spend' | 'leads' | 'cpl' | 'ctr' | 'cpc' | 'cpm'

const CHARTS: { field: Field; title: string; format: (v: number | null) => string; axis: (v: number) => string }[] = [
  { field: 'spend', title: 'Investimento', format: fmt.brl, axis: (v) => fmt.brlCompact(v) },
  { field: 'leads', title: 'Leads', format: fmt.int, axis: (v) => fmt.compact(v) },
  { field: 'cpl', title: 'Custo por lead', format: fmt.brl, axis: (v) => fmt.brlCompact(v) },
  { field: 'ctr', title: 'CTR (link)', format: fmt.pct, axis: (v) => `${(v * 100).toFixed(1).replace('.', ',')}%` },
  { field: 'cpc', title: 'CPC (link)', format: fmt.brl, axis: (v) => fmt.brlCompact(v) },
  { field: 'cpm', title: 'CPM', format: fmt.brl, axis: (v) => fmt.brlCompact(v) },
]

export default function TrendCharts({ facts, filters, grain, onGrainChange }: Props) {
  const theme = useChartTheme()
  const series = useMemo(() => timeSeries(facts, grain, filters), [facts, grain, filters])

  const tooltipTitle = (key: string) => {
    if (grain === 'day') return shortDate(key)
    const p = series.find((s) => s.label === key)
    const end = p ? addDays(p.key, 6) : key
    return `Semana ${shortDate(key)} – ${shortDate(end > filters.end ? filters.end : end)}`
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Evolução no período</h2>
        <div className="segmented" role="tablist">
          <button className={grain === 'day' ? 'active' : ''} onClick={() => onGrainChange('day')}>Diário</button>
          <button className={grain === 'week' ? 'active' : ''} onClick={() => onGrainChange('week')}>Semanal</button>
        </div>
      </div>
      <div className="trend-grid">
        {CHARTS.map((c) => (
          <figure key={c.field} className="mini-chart">
            <figcaption>{c.title}</figcaption>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={grain === 'day' ? 2 : 12}>
                {axes(theme, c.axis)}
                <Tooltip
                  cursor={{ fill: theme.cursor }}
                  content={<ChartTooltip title={tooltipTitle} format={c.format} name={c.title} />}
                />
                <Bar dataKey={c.field} fill={theme.series} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </figure>
        ))}
      </div>
    </section>
  )
}

// Recharts só reconhece eixos como filhos diretos (ou dentro de fragment), por isso é função e não componente.
function axes(theme: ReturnType<typeof useChartTheme>, format: (v: number) => string) {
  return (
    <>
      <CartesianGrid vertical={false} stroke={theme.grid} />
      <XAxis
        dataKey="label"
        tickFormatter={shortDate}
        tick={{ fill: theme.text, fontSize: 11 }}
        axisLine={{ stroke: theme.grid }}
        tickLine={false}
        minTickGap={16}
      />
      <YAxis
        tickFormatter={format}
        tick={{ fill: theme.text, fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        width={56}
      />
    </>
  )
}
