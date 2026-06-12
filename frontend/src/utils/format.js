export function formatNumber(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(value ?? 0)
}

export function formatPercent(value) {
  return `${formatNumber(value, 1)}%`
}

export function formatUtilizationRate(value) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0)
}
