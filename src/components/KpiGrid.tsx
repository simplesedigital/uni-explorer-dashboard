import type { Filters, Totals } from '../lib/data'
import { fmt, shortDate } from '../lib/format'

interface Props {
  current: Totals
  prev: Totals | null
  prevFilters: Filters | null
}

type Key = 'spend' | 'leads' | 'cpl' | 'conv' | 'cpconv' | 'impr' | 'clicks' | 'ctr' | 'cpc' | 'cpm'

interface Kpi {
  key: Key
  label: string
  format: (v: number | null) => string
  /** true quando subir é ruim (custos). */
  lowerIsBetter?: boolean
  /** Métrica de volume, sem leitura de "bom/ruim". */
  neutral?: boolean
  hero?: boolean
}

const KPIS: Kpi[] = [
  { key: 'spend', label: 'Investimento', format: fmt.brl, neutral: true, hero: true },
  { key: 'leads', label: 'Leads', format: fmt.int, hero: true },
  { key: 'cpl', label: 'Custo por lead', format: fmt.brl, lowerIsBetter: true, hero: true },
  { key: 'conv', label: 'Conversas no WhatsApp', format: fmt.int, hero: true },
  { key: 'cpconv', label: 'Custo por conversa', format: fmt.brl, lowerIsBetter: true },
  { key: 'impr', label: 'Impressões', format: fmt.int, neutral: true },
  { key: 'clicks', label: 'Cliques no link', format: fmt.int },
  { key: 'ctr', label: 'CTR (link)', format: fmt.pct },
  { key: 'cpc', label: 'CPC (link)', format: fmt.brl, lowerIsBetter: true },
  { key: 'cpm', label: 'CPM', format: fmt.brl, lowerIsBetter: true },
]

function Delta({ kpi, cur, prev }: { kpi: Kpi; cur: number | null; prev: number | null }) {
  if (cur === null || prev === null || prev === 0) return <span className="delta muted">—</span>
  const change = cur / prev - 1
  const up = change > 0
  const tone = kpi.neutral || change === 0 ? 'neutral' : up !== !!kpi.lowerIsBetter ? 'good' : 'bad'
  return (
    <span className={`delta ${tone}`}>
      <span aria-hidden>{up ? '▲' : change < 0 ? '▼' : '■'}</span> {fmt.delta(change)}
    </span>
  )
}

export default function KpiGrid({ current, prev, prevFilters }: Props) {
  const compareLabel = prevFilters
    ? `vs. ${shortDate(prevFilters.start)}–${shortDate(prevFilters.end)}`
    : 'sem dados do período anterior'

  return (
    <section className="kpis" aria-label="Indicadores">
      {KPIS.map((k) => {
        const cur = current[k.key] as number | null
        const prevValue = prev ? (prev[k.key] as number | null) : null
        return (
          <div key={k.key} className={`kpi ${k.hero ? 'kpi-hero' : ''}`}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.format(cur)}</div>
            <div className="kpi-foot">
              {prev && <Delta kpi={k} cur={cur} prev={prevValue} />}
              <span className="kpi-compare">{compareLabel}</span>
            </div>
          </div>
        )
      })}
    </section>
  )
}
