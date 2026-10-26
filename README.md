# Uni Explorer · Dashboard

Dashboard de mídia paga da [Uni Explorer](https://uniexplorer.com.br/). Fase 1: visão de **Meta Ads**
(campanhas, conjuntos e anúncios), substituindo o relatório antigo do Looker Studio.

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/ (site estático)
```

`npm run dev` e `npm run build` rodam antes `npm run data`, que converte os CSVs em `src/data/meta.json`.

## Atualizando os dados

1. No Gerenciador de Anúncios, exporte os relatórios **diários** (detalhamento por dia) de
   Campanhas, Conjuntos de anúncios e Anúncios, em CSV.
2. Substitua os arquivos em `data/raw/meta/` mantendo os nomes `campanhas.csv`, `conjuntos.csv` e `anuncios.csv`.
3. Rode `npm run build`.

Para incluir CTR e CPC no nível de anúncio, adicione a coluna "Cliques no link" na exportação de anúncios.

## Definições

| Métrica | Como é calculada |
|---|---|
| Leads | Resultados com indicador `lead` (campanha), `leadgen.other` (formulário) ou `fb_pixel_lead` (site/LP) |
| Conversas no WhatsApp | Resultados `messaging_conversation_started_7d` (só existem no nível de conjunto) |
| CTR / CPC | Baseados em **cliques no link** |
| Comparação | Período anterior de mesma duração; aparece quando há dados para ele |

Sem filtro de conjunto, investimento, cliques e leads vêm do relatório de campanhas (o número
consolidado do Meta). Com filtro de conjunto, vêm do relatório de conjuntos.

## Stack

Vite + React + TypeScript + Recharts. Sem backend: os dados entram no build como JSON.
