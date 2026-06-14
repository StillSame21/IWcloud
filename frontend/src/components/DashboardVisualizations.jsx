import { useMemo } from 'react'
import ActorCriticLossChart from './dashboard/ActorCriticLossChart'
import AgentRewardChart from './dashboard/AgentRewardChart'
import EnergyUsagePerTimeStepChart from './dashboard/EnergyUsagePerTimeStepChart'
import KpiGrid from './dashboard/KpiGrid'
import ReplayBufferChart from './dashboard/ReplayBufferChart'
import ServerFarmCpuTrendChart from './dashboard/ServerFarmCpuTrendChart'
import ServerFarmHeatmap from './dashboard/ServerFarmHeatmap'
import {
  buildEvaluationKpiCards,
  buildTrainingKpiCards,
} from './dashboard/kpiCards'
import { useAppState } from '../context/useAppState'
import { getMetricStep } from '../utils/runMetrics'

function isTrainingRun(selectedRunType) {
  return selectedRunType === 'training'
}

function getMetricEnergyUsage(point) {
  return point?.energyUsage ?? point?.energyCost ?? point?.totalEnergyCost ?? 0
}

function buildEnergyUsageSeries(liveMetrics) {
  return liveMetrics.map((metric, index) => ({
    timeStep: getMetricStep(metric, index),
    energyUsage: getMetricEnergyUsage(metric),
  }))
}


function TrainingDashboardOverview({ dashboardTelemetry }) {
  const kpiCards = useMemo(
    () => buildTrainingKpiCards(dashboardTelemetry.kpis),
    [dashboardTelemetry.kpis],
  )

  return (
    <section className="space-y-6">
      <KpiGrid cards={kpiCards} />
    </section>
  )
}

function EvaluationDashboardOverview({
  liveMetrics,
  savedModels,
  selectedModel,
  selectedRunType,
  simParams,
}) {
  const kpiCards = useMemo(
    () =>
      buildEvaluationKpiCards({
        liveMetrics,
        savedModels,
        selectedModel,
        selectedRunType,
        simParams,
      }),
    [liveMetrics, savedModels, selectedModel, selectedRunType, simParams],
  )

  return (
    <section className="space-y-6">
      <KpiGrid cards={kpiCards} />
    </section>
  )
}

function TrainingVisualizations({ dashboardTelemetry }) {
  return (
    <section className="space-y-6">
      <AgentRewardChart data={dashboardTelemetry.rewardSeries} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ActorCriticLossChart data={dashboardTelemetry.lossSeries} />
        <ReplayBufferChart data={dashboardTelemetry.replaySeries} />
      </div>

      <ServerFarmHeatmap data={dashboardTelemetry.serverFarmUtilization} />
      <ServerFarmCpuTrendChart
        data={dashboardTelemetry.cpuSeries}
        optimalRate={dashboardTelemetry.optimalRate}
      />
    </section>
  )
}

function EvaluationVisualizations({ dashboardTelemetry, liveMetrics }) {
  const energyUsageSeries = useMemo(
    () => buildEnergyUsageSeries(liveMetrics),
    [liveMetrics],
  )

  return (
    <section className="space-y-6">
      <EnergyUsagePerTimeStepChart data={energyUsageSeries} />
      <ServerFarmHeatmap
        data={dashboardTelemetry.serverFarmUtilization}
        title="Server Farm CPU Utilisation Heatmap"
      />
    </section>
  )
}

export function DashboardOverview() {
  const {
    dashboardTelemetry,
    liveMetrics,
    savedModels,
    selectedModel,
    selectedRunType,
    simParams,
  } = useAppState()

  if (isTrainingRun(selectedRunType)) {
    return <TrainingDashboardOverview dashboardTelemetry={dashboardTelemetry} />
  }

  return (
    <EvaluationDashboardOverview
      liveMetrics={liveMetrics}
      savedModels={savedModels}
      selectedModel={selectedModel}
      selectedRunType={selectedRunType}
      simParams={simParams}
    />
  )
}

export default function DashboardVisualizations() {
  const { dashboardTelemetry, liveMetrics, selectedRunType } = useAppState()

  if (isTrainingRun(selectedRunType)) {
    return <TrainingVisualizations dashboardTelemetry={dashboardTelemetry} />
  }

  return (
    <EvaluationVisualizations
      dashboardTelemetry={dashboardTelemetry}
      liveMetrics={liveMetrics}
    />
  )
}
