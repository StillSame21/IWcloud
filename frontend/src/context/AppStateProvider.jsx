import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppStateContext } from './AppStateContext'
import {
  activePreset as fallbackPreset,
  backendStatus,
  defaultSimulationParams,
  defaultTrainingParams,
  simulationParameterFields as fallbackSimulationFields,
  trainingParameterFields as fallbackTrainingFields,
} from '../mockData'
import { dashboardApi } from '../services/dashboardApi'

const topologyKeys = [
  'numberOfServerFarms',
  'numberOfServers',
  'numberOfVmTypes',
]
const maxMetricPoints = 300

const fallbackRunTypes = [
  {
    id: 'random',
    label: 'Evaluation Random Algorithm',
    description: 'Evaluate EcoPyCSIM with stochastic scheduling inputs.',
  },
  {
    id: 'training',
    label: 'Train Model',
    description: 'Configure MADDPG and simulation parameters together.',
  },
  {
    id: 'inference',
    label: 'Evaluated Trained Model',
    description: 'Evaluate a saved policy model for scheduling decisions.',
  },
]

function formatPercent(value) {
  return `${Math.round(value)}%`
}

function appendPoint(points, point) {
  return [...points, point].slice(-maxMetricPoints)
}

function buildPhaseTimeline(currentEpisode = 0, totalEpisodes = 1) {
  const total = Math.max(Number(totalEpisodes) || 1, 1)
  const warmUpEnd = Math.max(1, Math.round(total * 0.1))
  const explorationEnd = Math.max(warmUpEnd + 1, Math.round(total * 0.35))
  const convergenceEnd = Math.max(explorationEnd + 1, Math.round(total * 0.7))

  return {
    currentEpisode,
    totalEpisodes: total,
    phases: [
      { id: 'warm-up', label: 'Warm-up', start: 0, end: warmUpEnd, tone: 'neutral' },
      {
        id: 'exploration',
        label: 'Exploration',
        start: warmUpEnd,
        end: explorationEnd,
        tone: 'warning',
      },
      {
        id: 'convergence',
        label: 'Convergence',
        start: explorationEnd,
        end: convergenceEnd,
        tone: 'success',
      },
      { id: 'stable', label: 'Stable', start: convergenceEnd, end: total, tone: 'info' },
    ],
  }
}

function createEmptyHeatmap(simParams = defaultSimulationParams) {
  return {
    optimalRate: Number((simParams.optimalUtilizationRate ?? 0.7).toFixed(2)),
    farms: [],
  }
}

function createDashboardTelemetry(
  simParams = defaultSimulationParams,
  trainingParams = defaultTrainingParams,
) {
  const totalEpisodes = trainingParams?.episodes ?? defaultTrainingParams.episodes

  return {
    kpis: {
      episode: {
        current: 0,
        total: totalEpisodes,
        helper: 'Waiting for training telemetry',
      },
      trainingPhase: {
        value: 'Waiting',
        helper: 'No training episode completed',
      },
      jobAcceptance: {
        value: 0,
        helper: 'Waiting for completed episodes',
      },
      averageEnergyUsage: {
        value: 0,
        helper: `${simParams.numberOfJobs ?? 0} jobs configured`,
      },
    },
    phaseTimeline: buildPhaseTimeline(0, totalEpisodes),
    rewardSeries: [],
    lossSeries: [],
    replaySeries: [],
    averageEnergySeries: [],
    jobOutcome: {
      acceptedPercent: 0,
      rejectedPercent: 0,
      wallTimeRatio: 0,
    },
    serverFarmUtilization: createEmptyHeatmap(simParams),
    diagnostics: [],
  }
}

function updateTrainingTelemetry(currentTelemetry, metric) {
  const totalEpisodes = metric.totalEpisodes ?? currentTelemetry.kpis.episode.total
  const acceptedJobs = metric.acceptedJobs ?? 0
  const totalJobs = acceptedJobs + (metric.rejectedJobs ?? 0)
  const acceptanceHelper =
    totalJobs > 0
      ? `${acceptedJobs}/${totalJobs} jobs accepted`
      : 'Waiting for job outcomes'
  const farmLosses = metric.losses?.server_farm ?? {}
  const serverLosses = metric.losses?.server ?? {}

  return {
    ...currentTelemetry,
    kpis: {
      ...currentTelemetry.kpis,
      episode: {
        current: metric.episode,
        total: totalEpisodes,
        helper: `${formatPercent((metric.episode / Math.max(totalEpisodes, 1)) * 100)} complete`,
      },
      trainingPhase: {
        value: metric.phase ?? 'Training',
        helper: 'Updated after completed episode',
      },
      jobAcceptance: {
        value: metric.jobAcceptanceRate ?? 0,
        helper: acceptanceHelper,
      },
      averageEnergyUsage: {
        value: metric.totalEnergyCost ?? 0,
        helper: `Episode ${metric.episode}`,
      },
    },
    phaseTimeline: buildPhaseTimeline(metric.episode, totalEpisodes),
    rewardSeries: appendPoint(currentTelemetry.rewardSeries, {
      episode: metric.episode,
      farmReward: metric.rewards?.server_farm ?? 0,
      serverReward: metric.rewards?.server ?? 0,
      smoothedFarmReward: metric.smoothedReward ?? metric.totalReward ?? 0,
    }),
    lossSeries: appendPoint(currentTelemetry.lossSeries, {
      episode: metric.episode,
      farmActor: farmLosses.actor ?? 0,
      farmCritic: farmLosses.critic ?? 0,
      serverActor: serverLosses.actor ?? 0,
      serverCritic: serverLosses.critic ?? 0,
    }),
    replaySeries: appendPoint(currentTelemetry.replaySeries, {
      episode: metric.episode,
      qValue: metric.qValue ?? 0,
      bufferFill: metric.bufferFill ?? 0,
    }),
  }
}

function upsertById(items, item) {
  if (!item?.id) {
    return items
  }

  return [item, ...items.filter((currentItem) => currentItem.id !== item.id)]
}

function buildStartRunPayload({
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

export default function AppStateProvider({ children }) {
  const streamRef = useRef(null)
  const [activePreset, setActivePreset] = useState(fallbackPreset)
  const [runTypes, setRunTypes] = useState(fallbackRunTypes)
  const [simulationParameterFields, setSimulationParameterFields] = useState(
    fallbackSimulationFields,
  )
  const [trainingParameterFields, setTrainingParameterFields] = useState(
    fallbackTrainingFields,
  )
  const [selectedRunType, setSelectedRunType] = useState('random')
  const [simParams, setSimParams] = useState(defaultSimulationParams)
  const [trainingParams, setTrainingParams] = useState(defaultTrainingParams)
  const [selectedModel, setSelectedModel] = useState('')
  const [savedModels, setSavedModels] = useState([])
  const [runStatus, setRunStatus] = useState('idle')
  const [activeRunId, setActiveRunId] = useState(null)
  const [runError, setRunError] = useState(null)
  const [liveMetrics, setLiveMetrics] = useState([])
  const [runHistory, setRunHistory] = useState([])
  const [dashboardTelemetry, setDashboardTelemetry] = useState(() =>
    createDashboardTelemetry(defaultSimulationParams, defaultTrainingParams),
  )
  const [backendInfo, setBackendInfo] = useState(backendStatus)
  const [lastHealthCheck, setLastHealthCheck] = useState(null)
  const [isChecking, setIsChecking] = useState(false)

  const selectedModelDetails = useMemo(
    () => savedModels.find((model) => model.id === selectedModel),
    [savedModels, selectedModel],
  )

  const lockedTopology = selectedModelDetails?.topology
  const lockedSimulationFields = useMemo(
    () =>
      selectedRunType === 'inference' && lockedTopology
        ? topologyKeys
        : [],
    [lockedTopology, selectedRunType],
  )
  const effectiveSimParams = useMemo(
    () =>
      selectedRunType === 'inference' && lockedTopology
        ? {
            ...simParams,
            numberOfServerFarms: lockedTopology.numberOfServerFarms,
            numberOfServers: lockedTopology.numberOfServers,
            numberOfVmTypes: lockedTopology.numberOfVmTypes,
          }
        : simParams,
    [lockedTopology, selectedRunType, simParams],
  )

  const closeStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.close()
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadDashboardData() {
      setIsChecking(true)

      try {
        const [config, models, history, status] = await Promise.all([
          dashboardApi.getConfig(),
          dashboardApi.getModels(),
          dashboardApi.getRunHistory(),
          dashboardApi.checkBackendStatus(),
        ])

        if (!isMounted) {
          return
        }

        setActivePreset(config.activePreset ?? fallbackPreset)
        setRunTypes(config.runTypes ?? fallbackRunTypes)
        setSimulationParameterFields(
          config.simulationParameterFields ?? fallbackSimulationFields,
        )
        setTrainingParameterFields(
          config.trainingParameterFields ?? fallbackTrainingFields,
        )
        setSimParams(config.simulationParams ?? defaultSimulationParams)
        setTrainingParams(config.trainingParams ?? defaultTrainingParams)
        setDashboardTelemetry(
          createDashboardTelemetry(
            config.simulationParams ?? defaultSimulationParams,
            config.trainingParams ?? defaultTrainingParams,
          ),
        )
        setSavedModels(models)
        setSelectedModel((currentModel) =>
          models.some((model) => model.id === currentModel)
            ? currentModel
            : models[0]?.id ?? '',
        )
        setRunHistory(history)
        setBackendInfo(status)
        setLastHealthCheck(status.checkedAt)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setBackendInfo({
          connected: false,
          trainingStatus: 'Unavailable',
          error: error.message,
        })
      } finally {
        if (isMounted) {
          setIsChecking(false)
        }
      }
    }

    loadDashboardData()

    return () => {
      isMounted = false
      closeStream()
    }
  }, [closeStream])

  const handleRunEvent = useCallback((event) => {
    if (event.type === 'run_started') {
      setRunStatus('running')
      setRunError(null)

      if (event.simParams) {
        setSimParams(event.simParams)
      }

      if (event.trainingParams) {
        setTrainingParams(event.trainingParams)
      }

      setDashboardTelemetry(
        createDashboardTelemetry(
          event.simParams ?? defaultSimulationParams,
          event.trainingParams ?? defaultTrainingParams,
        ),
      )
      return
    }

    if (event.type === 'step_metric') {
      setLiveMetrics((currentMetrics) => appendPoint(currentMetrics, event.metric))
      return
    }

    if (event.type === 'episode_metric') {
      setLiveMetrics((currentMetrics) => appendPoint(currentMetrics, event.metric))
      setDashboardTelemetry((currentTelemetry) =>
        updateTrainingTelemetry(currentTelemetry, event.metric),
      )
      return
    }

    if (event.type === 'heatmap') {
      setDashboardTelemetry((currentTelemetry) => ({
        ...currentTelemetry,
        serverFarmUtilization:
          event.heatmap ?? createEmptyHeatmap(effectiveSimParams),
      }))
      return
    }

    if (event.type === 'run_completed') {
      setRunStatus('completed')
      setActiveRunId(null)
      setRunHistory((currentHistory) =>
        upsertById(currentHistory, event.runHistoryEntry),
      )

      if (event.model) {
        setSavedModels((currentModels) => upsertById(currentModels, event.model))
        setSelectedModel(event.model.id)
      }

      closeStream()
      return
    }

    if (event.type === 'run_stopped') {
      setRunStatus('stopped')
      setActiveRunId(null)
      closeStream()
      return
    }

    if (event.type === 'run_error') {
      setRunStatus('error')
      setRunError(event.message)
      setActiveRunId(null)
      closeStream()
    }
  }, [closeStream, effectiveSimParams])

  const updateSimParam = useCallback(
    (key, value) => {
      if (lockedSimulationFields.includes(key)) {
        return
      }

      setSimParams((currentParams) => ({ ...currentParams, [key]: value }))
    },
    [lockedSimulationFields],
  )

  const updateTrainingParam = useCallback((key, value) => {
    setTrainingParams((currentParams) => ({ ...currentParams, [key]: value }))
  }, [])

  const startRun = useCallback(async () => {
    if (selectedRunType === 'inference' && !selectedModel) {
      setRunStatus('error')
      setRunError('Train a model before starting trained-model evaluation.')
      return
    }

    closeStream()
    setRunStatus('starting')
    setRunError(null)
    setLiveMetrics([])
    setDashboardTelemetry(createDashboardTelemetry(effectiveSimParams, trainingParams))

    try {
      const response = await dashboardApi.startRun(
        buildStartRunPayload({
          selectedModel,
          selectedRunType,
          simParams: effectiveSimParams,
          trainingParams,
        }),
      )
      const socket = dashboardApi.openRunStream(response.streamUrl)
      streamRef.current = socket
      setActiveRunId(response.runId)

      socket.onmessage = (message) => {
        handleRunEvent(JSON.parse(message.data))
      }

      socket.onerror = () => {
        setRunStatus('error')
        setRunError('Live stream connection failed.')
      }
    } catch (error) {
      setRunStatus('error')
      setRunError(error.message)
      setActiveRunId(null)
    }
  }, [
    closeStream,
    handleRunEvent,
    selectedModel,
    selectedRunType,
    effectiveSimParams,
    trainingParams,
  ])

  const stopRun = useCallback(async () => {
    setRunStatus('stopping')
    await dashboardApi.stopRun(activeRunId)
  }, [activeRunId])

  const resetRun = useCallback(async () => {
    closeStream()

    try {
      await dashboardApi.stopRun()
    } catch {
      // Reset is allowed to recover the local dashboard even if the backend is unavailable.
    }

    setActiveRunId(null)
    setRunError(null)
    setRunStatus('idle')
    setLiveMetrics([])
    setDashboardTelemetry(createDashboardTelemetry(effectiveSimParams, trainingParams))
  }, [closeStream, effectiveSimParams, trainingParams])

  const resetVisualizations = useCallback(() => {
    setActiveRunId(null)
    setRunError(null)
    setRunStatus('idle')
    setLiveMetrics([])
    setDashboardTelemetry(createDashboardTelemetry(effectiveSimParams, trainingParams))
  }, [effectiveSimParams, trainingParams])

  const checkBackend = useCallback(async () => {
    setIsChecking(true)
    const status = await dashboardApi.checkBackendStatus()
    setBackendInfo(status)
    setLastHealthCheck(status.checkedAt)
    setIsChecking(false)
  }, [])

  const modelLockMessage =
    selectedRunType === 'inference' && lockedTopology
      ? `Topology locked to ${lockedTopology.numberOfServerFarms} farms, ${lockedTopology.numberOfServers} servers, ${lockedTopology.numberOfVmTypes} VM types.`
      : ''

  const value = useMemo(
    () => ({
      activePreset,
      activeRunId,
      backendInfo,
      checkBackend,
      dashboardTelemetry,
      isChecking,
      lastHealthCheck,
      liveMetrics,
      lockedSimulationFields,
      modelLockMessage,
      resetRun,
      resetVisualizations,
      runError,
      runHistory,
      runStatus,
      runTypes,
      savedModels,
      selectedModel,
      selectedModelDetails,
      selectedRunType,
      setRunHistory,
      setSelectedModel,
      setSelectedRunType,
      simParams: effectiveSimParams,
      simulationParameterFields,
      startRun,
      stopRun,
      trainingParameterFields,
      trainingParams,
      updateSimParam,
      updateTrainingParam,
    }),
    [
      activePreset,
      activeRunId,
      backendInfo,
      checkBackend,
      dashboardTelemetry,
      isChecking,
      lastHealthCheck,
      liveMetrics,
      lockedSimulationFields,
      modelLockMessage,
      resetRun,
      resetVisualizations,
      runError,
      runHistory,
      runStatus,
      runTypes,
      savedModels,
      selectedModel,
      selectedModelDetails,
      selectedRunType,
      effectiveSimParams,
      simulationParameterFields,
      startRun,
      stopRun,
      trainingParameterFields,
      trainingParams,
      updateSimParam,
      updateTrainingParam,
    ],
  )

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  )
}
