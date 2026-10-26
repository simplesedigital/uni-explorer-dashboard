import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { addDays, timeSeries, type Filters, type Grain, type Metrics, type SeriesPoint } from '../lib/data'
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

const CHARTS: { field: Field; title: string; kind: 'bar' | 'line'; format: (v: number | null) => string; axis: (v: number) => string }[] = [
  { field: 'spend', title: 'Investimento', kind: 'bar', format: fmt.brl, axis: (v) => fmt.brlCompact(v) },
  { field: 'leads', title: 'Leads', kind: 'bar', format: fmt.int, axis: (v) => fmt.compact(v) },
  { field: 'cpl', title: 'Custo por lead', kind: 'line', format: fmt.brl, axis: (v) => fmt.brlCompact(v) },
  { field: 'ctr', title: 'CTR (link)', kind: 'line', format: fmt.pct, axis: (v) => `${(v * 100).toFixed(1).replace('.', ',')}%` },
  { field: 'cpc', title: 'CPC (link)', kind: 'line', format: fmt.brl, axis: (v) => fmt.brlCompact(v) },
  { field: 'cpm', title: 'CPM', kind: 'line', format: fmt.brl, axis: (v) => fmt.brlCompact(v) },
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
              {c.kind === 'bar' ? (
                <BarChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={grain === 'day' ? 2 : 12}>
                  {axes(theme, c.axis)}
                  <Tooltip
                    cursor={{ fill: theme.cursor }}
                    content={<ChartTooltip title={tooltipTitle} format={c.format} name={c.title} />}
                  />
                  <Bar dataKey={c.field} fill={theme.series} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
                </BarChart>
              ) : (
                <LineChart data={series as (SeriesPoint & Record<string, unknown>)[]} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  {axes(theme, c.axis)}
                  <Tooltip
                    cursor={{ stroke: theme.axis, strokeDasharray: '3 3' }}
                    content={<ChartTooltip title={tooltipTitle} format={c.format} name={c.title} />}
                  />
                  <Line
                    dataKey={c.field}
                    stroke={theme.series}
                    strokeWidth={2}
                    dot={grain === 'week' ? { r: 4, fill: theme.series, stroke: theme.surface, strokeWidth: 2 } : false}
                    activeDot={{ r: 5, fill: theme.series, stroke: theme.surface, strokeWidth: 2 }}
                    connectNulls
                    isAnimationActive={false}
                  />
                </LineChart>
              )}
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
