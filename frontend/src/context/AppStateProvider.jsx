import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppStateContext } from './AppStateContext'
import {
  buildStartRunPayload,
  topologyKeys,
  upsertById,
} from './appStateHelpers'
import {
  backendStatus,
  defaultSimulationParams,
  defaultTrainingParams,
  fallbackRunTypes,
  simulationParameterFields as fallbackSimulationFields,
  trainingParameterFields as fallbackTrainingFields,
} from '../config/fallbackConfig'
import { dashboardApi } from '../services/dashboardApi'
import {
  appendPoint,
  createDashboardTelemetry,
  createEmptyHeatmap,
  updateTrainingTelemetry,
} from '../utils/telemetry'

export default function AppStateProvider({ children }) {
  const streamRef = useRef(null)
  const [runTypes, setRunTypes] = useState(fallbackRunTypes)
  const [simulationParameterFields, setSimulationParameterFields] = useState(
    fallbackSimulationFields,
  )
  const [trainingParameterFields, setTrainingParameterFields] = useState(
    fallbackTrainingFields,
  )
  const [selectedRunType, setSelectedRunType] = useState('random')
  const [simParamDefaults, setSimParamDefaults] = useState(defaultSimulationParams)
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

        setRunTypes(config.runTypes ?? fallbackRunTypes)
        setSimulationParameterFields(
          config.simulationParameterFields ?? fallbackSimulationFields,
        )
        setTrainingParameterFields(
          config.trainingParameterFields ?? fallbackTrainingFields,
        )
        setSimParamDefaults(config.simulationParams ?? defaultSimulationParams)
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

  const resetSimParams = useCallback(() => {
    setSimParams(simParamDefaults)
  }, [simParamDefaults])

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
      resetSimParams,
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
      resetSimParams,
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
