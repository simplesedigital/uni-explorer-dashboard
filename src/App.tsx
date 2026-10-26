import { useMemo, useState } from 'react'
import { data, dailyFacts, previousPeriod, totals, type Filters as F, type Grain } from './lib/data'
import { fullDate } from './lib/format'
import Filters from './components/Filters'
import KpiGrid from './components/KpiGrid'
import TrendCharts from './components/TrendCharts'
import CampaignCharts from './components/CampaignCharts'
import DataTable from './components/DataTable'

export default function App() {
  const [filters, setFilters] = useState<F>({
    start: data.range.start,
    end: data.range.end,
    campaign: null,
    adset: null,
  })
  const [grain, setGrain] = useState<Grain>('day')

  const facts = useMemo(() => dailyFacts(filters), [filters])
  const current = useMemo(() => totals(facts), [facts])
  const prev = useMemo(() => {
    const p = previousPeriod(filters)
    return p ? { filters: p, totals: totals(dailyFacts(p)) } : null
  }, [filters])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>UE</span>
          <div>
            <div className="brand-title">Uni Explorer</div>
            <div className="brand-sub">Meta Ads</div>
          </div>
        </div>
        <div className="topbar-meta">
          Dados de {fullDate(data.range.start)} a {fullDate(data.range.end)}
        </div>
      </header>

      <main className="content">
        <Filters value={filters} onChange={setFilters} />

        <KpiGrid current={current} prev={prev?.totals ?? null} prevFilters={prev?.filters ?? null} />

        <TrendCharts facts={facts} filters={filters} grain={grain} onGrainChange={setGrain} />

        <CampaignCharts filters={filters} onSelectCampaign={(c) => setFilters({ ...filters, campaign: c })} />

        <DataTable filters={filters} onChange={setFilters} />
      </main>

      <footer className="footer">
        Fonte: exportação do Gerenciador de Anúncios do Meta (relatórios diários de campanhas, conjuntos e anúncios).
        Leads = formulário instantâneo + lead no site/landing page + conversas iniciadas por mensagem (WhatsApp).
      </footer>
    </div>
  )
}
