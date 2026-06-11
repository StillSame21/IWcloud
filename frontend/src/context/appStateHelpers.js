export const topologyKeys = [
  'numberOfServerFarms',
  'numberOfServers',
  'numberOfVmTypes',
]

export function upsertById(items, item) {
  if (!item?.id) {
    return items
  }

  return [item, ...items.filter((currentItem) => currentItem.id !== item.id)]
}

export function buildStartRunPayload({
  selectedModel,
  selectedRunType,
  simParams,
  trainingParams,
}) {
  return {
    runType: selectedRunType,
    simParams,
    trainingParams: selectedRunType === 'training' ? trainingParams : undefined,
    selectedModel: selectedRunType === 'inference' ? selectedModel : undefined,
  }
}
