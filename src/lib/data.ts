import raw from '../data/meta.json'

export interface Metrics {
  spend: number
  impr: number
  clicks?: number
  leads: number
  conv: number
}
export interface CampaignRow extends Metrics { d: string; c: string }
export interface AdsetRow extends Metrics { d: string; c: string; s: string }
export interface AdRow extends Metrics { d: string; c: string; s: string; a: string }

interface Dataset {
  range: { start: string; end: string }
  status: { campaign: Record<string, string>; adset: Record<string, string>; ad: Record<string, string> }
  campaigns: CampaignRow[]
  adsets: AdsetRow[]
  ads: AdRow[]
}

export const data = raw as Dataset

export interface Filters {
  start: string
  end: string
  campaign: string | null
  adset: string | null
}

/** Métricas somadas + derivadas (CTR, CPC, CPM, custo/lead). */
export interface Totals extends Required<Metrics> {
  hasClicks: boolean
  ctr: number | null
  cpc: number | null
  cpm: number | null
  cpl: number | null
  cpconv: number | null
}

const div = (a: number, b: number) => (b > 0 ? a / b : null)

export function totals(rows: Metrics[]): Totals {
  let spend = 0, impr = 0, clicks = 0, leads = 0, conv = 0
  let hasClicks = rows.length > 0
  for (const r of rows) {
    spend += r.spend
    impr += r.impr
    leads += r.leads
    conv += r.conv
    if (r.clicks === undefined) hasClicks = false
    else clicks += r.clicks
  }
  return {
    spend, impr, clicks, leads, conv, hasClicks,
    ctr: hasClicks ? div(clicks, impr) : null,
    cpc: hasClicks ? div(spend, clicks) : null,
    cpm: div(spend * 1000, impr),
    cpl: div(spend, leads),
    cpconv: div(spend, conv),
  }
}

const inRange = (f: Filters) => (r: { d: string }) => r.d >= f.start && r.d <= f.end
const matches = (f: Filters) => (r: { c: string; s?: string }) =>
  (!f.campaign || r.c === f.campaign) && (!f.adset || r.s === f.adset)

export function filterCampaigns(f: Filters) {
  return data.campaigns.filter((r) => inRange(f)(r) && matches({ ...f, adset: null })(r))
}
export function filterAdsets(f: Filters) {
  return data.adsets.filter((r) => inRange(f)(r) && matches(f)(r))
}
export function filterAds(f: Filters) {
  return data.ads.filter((r) => inRange(f)(r) && matches(f)(r))
}

/**
 * Linhas diárias que alimentam KPIs e gráficos.
 *
 * Sem filtro de conjunto, investimento/cliques/leads vêm do relatório de campanhas,
 * que é o número consolidado do Meta (bate com o Gerenciador). Com filtro de conjunto,
 * vêm do relatório de conjuntos. Conversas de WhatsApp só existem no nível de conjunto.
 */
export function dailyFacts(f: Filters): (Metrics & { d: string })[] {
  const adsets = filterAdsets(f)
  const base: (Metrics & { d: string })[] = f.adset ? adsets : filterCampaigns(f)
  const byDay = new Map<string, Metrics & { d: string }>()
  for (const r of base) {
    const cur = byDay.get(r.d) ?? { d: r.d, spend: 0, impr: 0, clicks: 0, leads: 0, conv: 0 }
    cur.spend += r.spend
    cur.impr += r.impr
    cur.clicks = (cur.clicks ?? 0) + (r.clicks ?? 0)
    cur.leads += r.leads
    byDay.set(r.d, cur)
  }
  for (const r of adsets) {
    const cur = byDay.get(r.d) ?? { d: r.d, spend: 0, impr: 0, clicks: 0, leads: 0, conv: 0 }
    cur.conv += r.conv
    byDay.set(r.d, cur)
  }
  return [...byDay.values()].sort((a, b) => a.d.localeCompare(b.d))
}

// ---- datas ----

const toDate = (iso: string) => new Date(`${iso}T12:00:00Z`)
const toIso = (d: Date) => d.toISOString().slice(0, 10)

export function addDays(iso: string, n: number) {
  const d = toDate(iso)
  d.setUTCDate(d.getUTCDate() + n)
  return toIso(d)
}

export function daysBetween(a: string, b: string) {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86_400_000) + 1
}

/** Período anterior de mesma duração; null se não houver dados para ele. */
export function previousPeriod(f: Filters): Filters | null {
  const len = daysBetween(f.start, f.end)
  const end = addDays(f.start, -1)
  const start = addDays(f.start, -len)
  if (start < data.range.start) return null
  return { ...f, start, end }
}

/** Segunda-feira da semana de uma data. */
export function weekStart(iso: string) {
  const d = toDate(iso)
  const dow = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - dow)
  return toIso(d)
}

export type Grain = 'day' | 'week'

export interface SeriesPoint {
  key: string
  label: string
  spend: number
  leads: number
  conv: number
  cpl: number | null
  ctr: number | null
  cpc: number | null
  cpm: number | null
}

export function timeSeries(rows: (Metrics & { d: string })[], grain: Grain, f: Filters): SeriesPoint[] {
  const groups = new Map<string, (Metrics & { d: string })[]>()
  // Garante um ponto por dia/semana mesmo sem veiculação.
  for (let d = f.start; d <= f.end; d = addDays(d, 1)) {
    const k = grain === 'day' ? d : weekStart(d)
    if (!groups.has(k)) groups.set(k, [])
  }
  for (const r of rows) groups.get(grain === 'day' ? r.d : weekStart(r.d))?.push(r)
  return [...groups].map(([key, rs]) => {
    const t = totals(rs)
    const first = key < f.start ? f.start : key
    return {
      key,
      label: grain === 'day' ? key : first,
      spend: t.spend,
      leads: t.leads,
      conv: t.conv,
      cpl: t.cpl,
      ctr: rs.length ? t.ctr : null,
      cpc: t.cpc,
      cpm: t.cpm,
    }
  })
}

/** Agrupa linhas por uma chave e totaliza. */
export function groupBy<R extends Metrics>(rows: R[], key: (r: R) => string) {
  const map = new Map<string, R[]>()
  for (const r of rows) {
    const k = key(r)
    const list = map.get(k)
    if (list) list.push(r)
    else map.set(k, [r])
  }
  return [...map].map(([k, rs]) => ({ key: k, first: rs[0], ...totals(rs) }))
}

export const campaignNames = [...new Set(data.campaigns.map((r) => r.c))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
export const adsetNames = [...new Set(data.adsets.map((r) => r.s))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
