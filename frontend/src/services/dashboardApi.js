const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

function getCheckedAt() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function getWebSocketBaseUrl() {
  return apiBaseUrl.replace(/^http/, 'ws')
}

function getStreamUrl(streamUrl) {
  if (streamUrl.startsWith('ws://') || streamUrl.startsWith('wss://')) {
    return streamUrl
  }

  return `${getWebSocketBaseUrl()}${streamUrl}`
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const detail = await response.json().catch(() => null)
    const message =
      detail?.detail?.message ??
      detail?.message ??
      `ecopycsim-api returned ${response.status}`
    const error = new Error(message)
    error.detail = detail?.detail ?? detail
    throw error
  }

  return response.json()
}

export const dashboardApi = {
  checkBackendStatus: async () => {
    try {
      return await requestJson('/api/health')
    } catch (error) {
      return {
        connected: false,
        trainingStatus: 'Unavailable',
        checkedAt: getCheckedAt(),
        error: error.message,
      }
    }
  },
  getConfig: () => requestJson('/api/dashboard/config'),
  getModels: () => requestJson('/api/models'),
  getRunHistory: () => requestJson('/api/runs/history'),
  startRun: (payload) =>
    requestJson('/api/runs/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  stopRun: (runId) =>
    requestJson(runId ? `/api/runs/${runId}/stop` : '/api/runs/stop', {
      method: 'POST',
    }),
  openRunStream: (streamUrl) => new WebSocket(getStreamUrl(streamUrl)),
}
