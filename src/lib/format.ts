const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const brlCompact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const int = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const pct = new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const delta = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
})

const guard = (fn: (v: number) => string) => (v: number | null | undefined) =>
  v === null || v === undefined || !Number.isFinite(v) ? '—' : fn(v)

export const fmt = {
  brl: guard((v) => brl.format(v)),
  brlCompact: guard((v) => brlCompact.format(v)),
  int: guard((v) => int.format(v)),
  compact: guard((v) => compact.format(v)),
  pct: guard((v) => pct.format(v)),
  delta: guard((v) => delta.format(v)),
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** "2026-10-05" -> "05/out" */
export function shortDate(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}/${MONTHS[Number(m) - 1]}`
}

/** "2026-10-05" -> "05/10/2026" */
export function fullDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
