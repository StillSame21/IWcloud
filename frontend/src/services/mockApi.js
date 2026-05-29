const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

function getCheckedAt() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
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
    throw new Error(`ecopycsim-api returned ${response.status}`)
  }

  return response.json()
}

export const mockApi = {
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
  startRun: (payload) =>
    requestJson('/api/runs/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  stopRun: () =>
    requestJson('/api/runs/stop', {
      method: 'POST',
    }),
}
