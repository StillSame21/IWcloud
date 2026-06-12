function getNumericValues(data, keys) {
  return data.flatMap((point) =>
    keys
      .map((key) => point?.[key])
      .filter((value) => Number.isFinite(value)),
  )
}

function roundDomainValue(value) {
  const absoluteValue = Math.abs(value)

  if (absoluteValue === 0) {
    return 0
  }

  if (absoluteValue < 1) {
    return Number(value.toFixed(4))
  }

  if (absoluteValue < 100) {
    return Number(value.toFixed(2))
  }

  return Number(value.toFixed(0))
}

export function getAdaptiveDomain(data, keys, options = {}) {
  const normalizedOptions =
    typeof options === 'number' ? { paddingRatio: options } : options
  const {
    includeZero = false,
    paddingRatio = 0.12,
    zeroMin = false,
  } = normalizedOptions
  const values = getNumericValues(data, Array.isArray(keys) ? keys : [keys])

  if (values.length === 0) {
    return zeroMin || includeZero ? [0, 'auto'] : ['auto', 'auto']
  }

  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)

  if (zeroMin) {
    const domainMax = Math.max(maxValue, 0)
    const paddedMax = domainMax + Math.max(domainMax * paddingRatio, 0.01)
    return [0, roundDomainValue(paddedMax)]
  }

  if (includeZero) {
    const domainMin = Math.min(minValue, 0)
    const domainMax = Math.max(maxValue, 0)
    const padding = Math.max((domainMax - domainMin) * paddingRatio, 0.01)

    return [
      roundDomainValue(domainMin < 0 ? domainMin - padding : 0),
      roundDomainValue(domainMax > 0 ? domainMax + padding : 0),
    ]
  }

  if (minValue === maxValue) {
    const padding = Math.max(Math.abs(minValue) * paddingRatio, 0.01)
    return [
      roundDomainValue(minValue - padding),
      roundDomainValue(maxValue + padding),
    ]
  }

  const padding = (maxValue - minValue) * paddingRatio

  return [
    roundDomainValue(minValue - padding),
    roundDomainValue(maxValue + padding),
  ]
}

export function formatAdaptiveTick(value) {
  if (!Number.isFinite(value)) {
    return value
  }

  const absoluteValue = Math.abs(value)

  if (absoluteValue >= 1000000) {
    return Intl.NumberFormat('en-US', {
      maximumFractionDigits: 1,
      notation: 'compact',
    }).format(value)
  }

  if (absoluteValue >= 1000) {
    return Intl.NumberFormat('en-US', {
      maximumFractionDigits: 1,
      notation: 'compact',
    }).format(value)
  }

  if (absoluteValue > 0 && absoluteValue < 1) {
    return Intl.NumberFormat('en-US', {
      maximumFractionDigits: 4,
    }).format(value)
  }

  return Intl.NumberFormat('en-US', {
    maximumFractionDigits: absoluteValue < 100 ? 2 : 1,
  }).format(value)
}
