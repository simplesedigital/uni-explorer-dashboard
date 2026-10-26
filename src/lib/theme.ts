import { useEffect, useState } from 'react'

// Cores dos gráficos por tema. SVG do Recharts não lê CSS custom properties
// em atributos, então os valores vêm daqui (mesmos tokens do styles.css).
const light = {
  series: '#2a78d6',
  seriesAlt: '#eb6834',
  grid: '#e6e5e0',
  axis: '#8a8984',
  text: '#52514e',
  surface: '#ffffff',
  cursor: 'rgba(17, 26, 51, 0.06)',
}
const dark: typeof light = {
  series: '#3987e5',
  seriesAlt: '#d95926',
  grid: '#2c2c2a',
  axis: '#8a8984',
  text: '#c3c2b7',
  surface: '#1a1a19',
  cursor: 'rgba(255, 255, 255, 0.06)',
}

export type ChartTheme = typeof light

export function useChartTheme(): ChartTheme {
  const query = '(prefers-color-scheme: dark)'
  const [isDark, setDark] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = (e: MediaQueryListEvent) => setDark(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return isDark ? dark : light
}
