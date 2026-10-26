import { addDays, adsetNames, campaignNames, data, type Filters as F } from '../lib/data'

interface Props {
  value: F
  onChange: (f: F) => void
}

const presets = [
  { label: 'Período completo', days: null },
  { label: 'Últimos 7 dias', days: 7 },
  { label: 'Últimos 14 dias', days: 14 },
] as const

export default function Filters({ value, onChange }: Props) {
  const { start: min, end: max } = data.range
  const set = (patch: Partial<F>) => onChange({ ...value, ...patch })
  const isPreset = (days: number | null) =>
    value.end === max && value.start === (days ? addDays(max, -(days - 1)) : min)
  const hasDimension = value.campaign !== null || value.adset !== null

  return (
    <section className="filters" aria-label="Filtros">
      <div className="filter-group">
        <span className="filter-label">Período</span>
        <div className="segmented">
          {presets.map((p) => (
            <button
              key={p.label}
              className={isPreset(p.days) ? 'active' : ''}
              onClick={() => set({ start: p.days ? addDays(max, -(p.days - 1)) : min, end: max })}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="date-range">
          <input
            type="date"
            aria-label="Data inicial"
            min={min}
            max={value.end}
            value={value.start}
            onChange={(e) => e.target.value && set({ start: e.target.value })}
          />
          <span>até</span>
          <input
            type="date"
            aria-label="Data final"
            min={value.start}
            max={max}
            value={value.end}
            onChange={(e) => e.target.value && set({ end: e.target.value })}
          />
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label" htmlFor="f-campaign">Campanha</label>
        <select
          id="f-campaign"
          value={value.campaign ?? ''}
          onChange={(e) => set({ campaign: e.target.value || null })}
        >
          <option value="">Todas</option>
          {campaignNames.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label" htmlFor="f-adset">Conjunto</label>
        <select id="f-adset" value={value.adset ?? ''} onChange={(e) => set({ adset: e.target.value || null })}>
          <option value="">Todos</option>
          {adsetNames.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {hasDimension && (
        <button className="link-button" onClick={() => set({ campaign: null, adset: null })}>
          Limpar filtros
        </button>
      )}
    </section>
  )
}
