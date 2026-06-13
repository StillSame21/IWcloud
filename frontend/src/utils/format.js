export function formatNumber(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(value ?? 0)
}

export function formatPercent(value) {
  return `${formatNumber(value, 1)}%`
}

export function formatUtilizationRate(value) {
  return `${Math.round((value ?? 0) * 100)}%`
}
