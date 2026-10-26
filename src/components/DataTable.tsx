import { useMemo, useState } from 'react'
import { data, filterAds, filterAdsets, filterCampaigns, groupBy, totals, type Filters, type Totals } from '../lib/data'
import { fmt } from '../lib/format'

type Level = 'campaign' | 'adset' | 'ad'

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
}

interface Row extends Totals {
  id: string
  name: string
  context: string | null
  status: string | undefined
  campaign: string
  adset: string | null
}

type SortKey = 'name' | 'spend' | 'impr' | 'clicks' | 'ctr' | 'cpc' | 'cpm' | 'leads' | 'cpl'

const COLUMNS: { key: SortKey; label: string; format: (v: number | null) => string }[] = [
  { key: 'spend', label: 'Investimento', format: fmt.brl },
  { key: 'impr', label: 'Impressões', format: fmt.int },
  { key: 'clicks', label: 'Cliques', format: fmt.int },
  { key: 'ctr', label: 'CTR', format: fmt.pct },
  { key: 'cpc', label: 'CPC', format: fmt.brl },
  { key: 'cpm', label: 'CPM', format: fmt.brl },
  { key: 'leads', label: 'Leads', format: fmt.int },
  { key: 'cpl', label: 'Custo/lead', format: fmt.brl },
]

const TABS: { level: Level; label: string }[] = [
  { level: 'campaign', label: 'Campanhas' },
  { level: 'adset', label: 'Conjuntos' },
  { level: 'ad', label: 'Anúncios' },
]

function buildRows(level: Level, f: Filters): Row[] {
  if (level === 'campaign') {
    const rows = f.adset ? filterAdsets(f) : filterCampaigns(f)
    return groupBy(rows, (r) => r.c).map((g) => ({
      ...g,
      id: g.key,
      name: g.key,
      context: null,
      status: data.status.campaign[g.key],
      campaign: g.key,
      adset: null,
    }))
  }
  if (level === 'adset') {
    return groupBy(filterAdsets(f), (r) => `${r.c}|${r.s}`).map((g) => ({
      ...g,
      id: g.key,
      name: g.first.s,
      context: g.first.c,
      status: data.status.adset[g.key],
      campaign: g.first.c,
      adset: g.first.s,
    }))
  }
  return groupBy(filterAds(f), (r) => `${r.c}|${r.s}|${r.a}`).map((g) => ({
    ...g,
    id: g.key,
    name: g.first.a,
    context: `${g.first.c} › ${g.first.s}`,
    status: data.status.ad[g.key],
    campaign: g.first.c,
    adset: g.first.s,
  }))
}

export default function DataTable({ filters, onChange }: Props) {
  const [level, setLevel] = useState<Level>('campaign')
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'spend', desc: true })
  const [query, setQuery] = useState('')

  const rows = useMemo(() => buildRows(level, filters), [level, filters])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q ? rows.filter((r) => `${r.name} ${r.context ?? ''}`.toLowerCase().includes(q)) : rows
    const dir = sort.desc ? -1 : 1
    return [...filtered].sort((a, b) => {
      if (sort.key === 'name') return dir * a.name.localeCompare(b.name, 'pt-BR')
      const av = a[sort.key], bv = b[sort.key]
      // Valores vazios sempre no fim.
      if (av === null) return 1
      if (bv === null) return -1
      return dir * ((av as number) - (bv as number))
    })
  }, [rows, query, sort])

  const total = useMemo(() => {
    const t = totals(visible.map((r) => ({ spend: r.spend, impr: r.impr, clicks: r.hasClicks ? r.clicks : undefined, leads: r.leads, msg: r.msg })))
    return t
  }, [visible])

  const drill = (r: Row) => {
    if (level === 'campaign') {
      onChange({ ...filters, campaign: r.campaign })
      setLevel('adset')
    } else if (level === 'adset') {
      onChange({ ...filters, campaign: r.campaign, adset: r.adset })
      setLevel('ad')
    }
  }

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key !== 'name' }))

  const value = (r: Totals, key: SortKey) => {
    if ((key === 'clicks' || key === 'ctr' || key === 'cpc') && !r.hasClicks) return null
    return r[key as keyof Totals] as number | null
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.level}
              role="tab"
              aria-selected={level === t.level}
              className={level === t.level ? 'active' : ''}
              onClick={() => setLevel(t.level)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          className="search"
          type="search"
          placeholder="Buscar por nome…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {level === 'ad' && (
        <p className="note">O relatório de anúncios exportado não traz cliques no link, então CTR e CPC aparecem como “—” neste nível.</p>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <SortHeader label={TABS.find((t) => t.level === level)!.label.slice(0, -1)} k="name" sort={sort} onSort={toggleSort} align="left" />
              <th className="left">Status</th>
              {COLUMNS.map((c) => (
                <SortHeader key={c.key} label={c.label} k={c.key} sort={sort} onSort={toggleSort} />
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className={level !== 'ad' ? 'clickable' : ''} onClick={() => drill(r)}>
                <td className="left name-cell">
                  <div className="name">{r.name}</div>
                  {r.context && <div className="context">{r.context}</div>}
                </td>
                <td className="left">
                  <span className={`status ${r.status === 'active' ? 'on' : 'off'}`}>
                    {r.status === 'active' ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                {COLUMNS.map((c) => (
                  <td key={c.key}>{c.format(value(r, c.key))}</td>
                ))}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td className="left empty" colSpan={COLUMNS.length + 2}>Nada encontrado para os filtros atuais.</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="left">Total ({visible.length})</td>
              <td />
              {COLUMNS.map((c) => (
                <td key={c.key}>{c.format(value(total, c.key))}</td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      {level !== 'ad' && <p className="hint">Clique numa linha para ver os {level === 'campaign' ? 'conjuntos' : 'anúncios'} dela.</p>}
    </section>
  )
}

function SortHeader({
  label,
  k,
  sort,
  onSort,
  align = 'right',
}: {
  label: string
  k: SortKey
  sort: { key: SortKey; desc: boolean }
  onSort: (k: SortKey) => void
  align?: 'left' | 'right'
}) {
  const active = sort.key === k
  return (
    <th className={align} aria-sort={active ? (sort.desc ? 'descending' : 'ascending') : 'none'}>
      <button className={`sort ${active ? 'active' : ''}`} onClick={() => onSort(k)}>
        {label}
        <span aria-hidden>{active ? (sort.desc ? ' ▼' : ' ▲') : ''}</span>
      </button>
    </th>
  )
}
