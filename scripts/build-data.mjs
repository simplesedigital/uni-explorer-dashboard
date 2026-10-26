// Converte os CSVs exportados do Gerenciador de Anúncios (data/raw/meta)
// em um JSON compacto consumido pelo dashboard (src/data/meta.json).
import fs from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'

const RAW = path.resolve('data/raw/meta')
const OUT = path.resolve('src/data/meta.json')

// Indicadores de resultado do Meta que contam como lead ou como conversa.
const LEAD_INDICATORS = new Set([
  'actions:lead', // nível de campanha (consolidado pelo Meta)
  'actions:leadgen.other', // formulário instantâneo
  'actions:offsite_conversion.fb_pixel_lead', // lead no site / landing page
])
const CONVERSATION_PREFIX = 'actions:onsite_conversion.messaging_conversation_started'

function read(file) {
  const text = fs.readFileSync(path.join(RAW, file), 'utf8')
  const { data, errors } = Papa.parse(text, { header: true, skipEmptyLines: true })
  if (errors.length) throw new Error(`${file}: ${errors[0].message}`)
  return data
}

const num = (v) => (v === undefined || v === '' ? 0 : Number(v))
const round = (v) => Math.round(v * 100) / 100

function metrics(r, withClicks) {
  const indicator = r['Indicador de resultados'] ?? ''
  const results = num(r['Resultados'])
  const m = {
    spend: round(num(r['Valor gasto (BRL)'])),
    impr: num(r['Impressões']),
    leads: LEAD_INDICATORS.has(indicator) ? results : 0,
    conv: indicator.startsWith(CONVERSATION_PREFIX) ? results : 0,
  }
  if (withClicks) m.clicks = num(r['Cliques no link'])
  return m
}

const hasActivity = (m) => m.spend > 0 || m.impr > 0 || m.leads > 0 || m.conv > 0

// Guarda o status de veiculação mais recente de cada entidade.
function trackStatus(map, key, date, status) {
  const prev = map.get(key)
  if (!prev || date >= prev.date) map.set(key, { date, status })
}

const status = { campaign: new Map(), adset: new Map(), ad: new Map() }

const campaigns = []
for (const r of read('campanhas.csv')) {
  const d = r['Início dos relatórios']
  const c = r['Nome da campanha']
  trackStatus(status.campaign, c, d, r['Veiculação da campanha'])
  const m = metrics(r, true)
  if (hasActivity(m)) campaigns.push({ d, c, ...m })
}

const adsets = []
for (const r of read('conjuntos.csv')) {
  const d = r['Início dos relatórios']
  const c = r['Nome da campanha']
  const s = r['Nome do conjunto de anúncios']
  trackStatus(status.adset, `${c}|${s}`, d, r['Veiculação do conjunto de anúncios'])
  const m = metrics(r, true)
  if (hasActivity(m)) adsets.push({ d, c, s, ...m })
}

// O relatório de anúncios não traz "Cliques no link".
const ads = []
for (const r of read('anuncios.csv')) {
  const d = r['Início dos relatórios']
  const c = r['Nome da campanha']
  const s = r['Nome do conjunto de anúncios']
  const a = r['Nome do anúncio']
  trackStatus(status.ad, `${c}|${s}|${a}`, d, r['Veiculação de anúncio'])
  const m = metrics(r, false)
  if (hasActivity(m)) ads.push({ d, c, s, a, ...m })
}

const dates = campaigns.map((r) => r.d).sort()
const toObj = (map) => Object.fromEntries([...map].map(([k, v]) => [k, v.status]))

const out = {
  range: { start: dates[0], end: dates[dates.length - 1] },
  status: { campaign: toObj(status.campaign), adset: toObj(status.adset), ad: toObj(status.ad) },
  campaigns,
  adsets,
  ads,
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(out))

const sum = (rows, k) => round(rows.reduce((t, r) => t + (r[k] ?? 0), 0))
console.log(
  `meta.json: ${campaigns.length} linhas de campanha, ${adsets.length} de conjunto, ${ads.length} de anúncio ` +
    `(${out.range.start} a ${out.range.end}) · investimento R$ ${sum(campaigns, 'spend')} · leads ${sum(campaigns, 'leads')}`,
)
