import { useMemo } from 'react'
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { filterAdsets, filterCampaigns, groupBy, type Filters } from '../lib/data'
import { fmt } from '../lib/format'
import { useChartTheme } from '../lib/theme'

interface Props {
  filters: Filters
  onSelectCampaign: (c: string | null) => void
}

interface Item {
  name: string
  value: number | null
  detail: string
}

export default function CampaignCharts({ filters, onSelectCampaign }: Props) {
  const byCampaign = useMemo(() => {
    // Sem filtro de conjunto usa o número consolidado da campanha; com filtro, soma os conjuntos.
    const all = { ...filters, campaign: null }
    const rows = filters.adset ? filterAdsets(all) : filterCampaigns(all)
    return groupBy(rows, (r) => r.c)
      .filter((g) => g.spend > 0 || g.leads > 0)
      .sort((a, b) => b.leads - a.leads)
  }, [filters])

  const byAdset = useMemo(
    () =>
      groupBy(filterAdsets({ ...filters, adset: null }), (r) => r.s)
        .filter((g) => g.spend > 0)
        .sort((a, b) => b.leads - a.leads),
    [filters],
  )

  return (
    <section className="panel-row three">
      <HBarPanel
        title="Leads por campanha"
        items={byCampaign.map((g) => ({
          name: g.key,
          value: g.leads,
          detail: `${fmt.brl(g.spend)} investidos`,
        }))}
        format={fmt.int}
        selected={filters.campaign}
        onSelect={(n) => onSelectCampaign(filters.campaign === n ? null : n)}
      />
      <HBarPanel
        title="Custo por lead por campanha"
        items={byCampaign.map((g) => ({ name: g.key, value: g.cpl, detail: `${fmt.int(g.leads)} leads` }))}
        format={fmt.brl}
        selected={filters.campaign}
        onSelect={(n) => onSelectCampaign(filters.campaign === n ? null : n)}
      />
      <HBarPanel
        title="Custo por lead por conjunto"
        items={byAdset.map((g) => ({
          name: g.key,
          value: g.cpl,
          detail: `${fmt.int(g.leads)} leads · ${fmt.brl(g.spend)}`,
        }))}
        format={fmt.brl}
        selected={filters.adset}
      />
    </section>
  )
}

interface PanelProps {
  title: string
  subtitle?: string
  items: Item[]
  format: (v: number | null) => string
  selected: string | null
  onSelect?: (name: string) => void
}

function HBarPanel({ title, subtitle, items, format, selected, onSelect }: PanelProps) {
  const theme = useChartTheme()
  const height = Math.max(160, items.length * 34 + 16)
  const dim = selected !== null

  return (
    <figure className="panel">
      <figcaption className="panel-head">
        <h2>{title}</h2>
        {subtitle && <span className="panel-sub">{subtitle}</span>}
      </figcaption>
      {items.length === 0 ? (
        <p className="empty">Sem veiculação no período.</p>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={items} layout="vertical" margin={{ top: 0, right: 72, bottom: 0, left: 0 }} barCategoryGap={8}>
            <XAxis type="number" hide domain={[0, 'dataMax']} />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fill: theme.text, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: theme.cursor }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const it = payload[0].payload as Item
                return (
                  <div className="tooltip">
                    <div className="tooltip-title">{it.name}</div>
                    <div className="tooltip-row">
                      <span>{title}</span>
                      <strong>{format(it.value)}</strong>
                    </div>
                    <div className="tooltip-detail">{it.detail}</div>
                  </div>
                )
              }}
            />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              maxBarSize={22}
              isAnimationActive={false}
              cursor={onSelect ? 'pointer' : undefined}
              onClick={onSelect ? (d: { name?: string }) => d.name && onSelect(d.name) : undefined}
            >
              {items.map((it) => (
                <Cell key={it.name} fill={theme.series} fillOpacity={dim && it.name !== selected ? 0.3 : 1} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={(v: number | null) => format(v)}
                style={{ fill: theme.text, fontSize: 12 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </figure>
  )
}
