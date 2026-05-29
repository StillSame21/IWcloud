import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppStateContext } from './AppStateContext'
import {
  activePreset,
  backendStatus,
  dashboardTelemetry,
  defaultSimulationParams,
  defaultTrainingParams,
  runHistory as initialRunHistory,
  savedModels,
} from '../mockData'
import { mockApi } from '../services/mockApi'

const createInitialLivePoint = () => ({
  step: 1,
  episode: 1,
  energyCost: 132,
  totalEnergyCost: 132,
  rejectedTasks: 0,
  stepTime: 0.18,
})

const createNextLivePoint = (previous) => {
  const nextStep = previous.step + 1
  const energyDrift = 1.1 + Math.sin(nextStep / 3) * 1.7
  const energyCost = Math.max(
    18,
    previous.energyCost - energyDrift + Math.random() * 1.4,
  )

  return {
    step: nextStep,
    episode: nextStep,
    energyCost: Number(energyCost.toFixed(2)),
    totalEnergyCost: Number(energyCost.toFixed(2)),
    rejectedTasks:
      previous.rejectedTasks + (nextStep % 17 === 0 || nextStep % 31 === 0 ? 1 : 0),
    stepTime: Number((0.18 + Math.sin(nextStep / 5) * 0.025).toFixed(3)),
  }
}

const getInitialLiveMetrics = () => initialRunHistory[0].metrics.slice(0, 12)

const appendNextLivePoint = (currentMetrics) => {
  const previous = currentMetrics.at(-1) ?? createInitialLivePoint()
  return [...currentMetrics, createNextLivePoint(previous)].slice(-60)
}

const ensureLiveMetrics = (currentMetrics) =>
  currentMetrics.length > 0 ? currentMetrics : [createInitialLivePoint()]

const buildStartRunPayload = ({
  selectedModel,
  selectedRunType,
  simParams,
  trainingParams,
}) => ({
  runType: selectedRunType,
  simParams,
  trainingParams: selectedRunType === 'training' ? trainingParams : undefined,
  selectedModel: selectedRunType === 'inference' ? selectedModel : undefined,
})

export default function AppStateProvider({ children }) {
  const [selectedRunType, setSelectedRunType] = useState('random')
  const [simParams, setSimParams] = useState(defaultSimulationParams)
  const [trainingParams, setTrainingParams] = useState(defaultTrainingParams)
  const [selectedModel, setSelectedModel] = useState(savedModels[0].id)
  const [runStatus, setRunStatus] = useState('idle')
  const [liveMetrics, setLiveMetrics] = useState(getInitialLiveMetrics)
  const [runHistory, setRunHistory] = useState(initialRunHistory)
  const [backendInfo, setBackendInfo] = useState(backendStatus)
  const [lastHealthCheck, setLastHealthCheck] = useState(null)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    if (runStatus !== 'running') {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setLiveMetrics(appendNextLivePoint)
    }, 2000)

    return () => window.clearInterval(intervalId)
  }, [runStatus])

  const updateSimParam = useCallback((key, value) => {
    setSimParams((currentParams) => ({ ...currentParams, [key]: value }))
  }, [])

  const updateTrainingParam = useCallback((key, value) => {
    setTrainingParams((currentParams) => ({ ...currentParams, [key]: value }))
  }, [])

  const startRun = useCallback(async () => {
    await mockApi.startRun(
      buildStartRunPayload({
        selectedModel,
        selectedRunType,
        simParams,
        trainingParams,
      }),
    )

    setLiveMetrics(ensureLiveMetrics)
    setRunStatus('running')
  }, [selectedRunType, selectedModel, simParams, trainingParams])

  const stopRun = useCallback(async () => {
    await mockApi.stopRun()
    setRunStatus('stopped')
  }, [])

  const resetRun = useCallback(() => {
    setRunStatus('idle')
    setLiveMetrics([])
  }, [])

  const checkBackend = useCallback(async () => {
    setIsChecking(true)
    const status = await mockApi.checkBackendStatus()
    setBackendInfo(status)
    setLastHealthCheck(status.checkedAt)
    setIsChecking(false)
  }, [])

  const value = useMemo(
    () => ({
      activePreset,
      backendInfo,
      checkBackend,
      dashboardTelemetry,
      isChecking,
      lastHealthCheck,
      liveMetrics,
      resetRun,
      runHistory,
      runStatus,
      savedModels,
      selectedModel,
      selectedRunType,
      setRunHistory,
      setSelectedModel,
      setSelectedRunType,
      simParams,
      startRun,
      stopRun,
      trainingParams,
      updateSimParam,
      updateTrainingParam,
    }),
    [
      backendInfo,
      checkBackend,
      isChecking,
      lastHealthCheck,
      liveMetrics,
      resetRun,
      runHistory,
      runStatus,
      selectedModel,
      selectedRunType,
      simParams,
      startRun,
      stopRun,
      trainingParams,
      updateSimParam,
      updateTrainingParam,
    ],
  )

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  )
}
