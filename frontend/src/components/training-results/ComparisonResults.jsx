import { useMemo } from 'react'
import ActorCriticLossChart from './ActorCriticLossChart'
import AverageEnergyByJobLoadChart from './AverageEnergyByJobLoadChart'
import ComparisonTable from './ComparisonTable'
import EnergyWallTimeComparisonChart from './EnergyWallTimeComparisonChart'
import QValueReplayBufferChart from './QValueReplayBufferChart'
import RewardComparisonChart from './RewardComparisonChart'
import ServerFarmAverageCpuChart from './ServerFarmAverageCpuChart'
import {
  buildAverageEnergyComparisonData,
  buildEnergyWallTimeComparisonData,
  buildRewardComparisonData,
} from './comparisonData'

export default function ComparisonResults({ savedModels, selectedRuns }) {
  const rewardComparisonData = useMemo(
    () => buildRewardComparisonData(selectedRuns),
    [selectedRuns],
  )
  const energyWallTimeData = useMemo(
    () => buildEnergyWallTimeComparisonData(selectedRuns),
    [selectedRuns],
  )
  const averageEnergyData = useMemo(
    () => buildAverageEnergyComparisonData(selectedRuns),
    [selectedRuns],
  )

  return (
    <>
      <ComparisonTable savedModels={savedModels} selectedRuns={selectedRuns} />
      <RewardComparisonChart
        data={rewardComparisonData}
        savedModels={savedModels}
        selectedRuns={selectedRuns}
      />
      <EnergyWallTimeComparisonChart
        data={energyWallTimeData}
        savedModels={savedModels}
        selectedRuns={selectedRuns}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {selectedRuns.map((run) => (
          <ActorCriticLossChart
            key={run.id}
            run={run}
            savedModels={savedModels}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {selectedRuns.map((run) => (
          <QValueReplayBufferChart
            key={run.id}
            run={run}
            savedModels={savedModels}
          />
        ))}
      </div>

      <AverageEnergyByJobLoadChart
        data={averageEnergyData}
        savedModels={savedModels}
        selectedRuns={selectedRuns}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {selectedRuns.map((run) => (
          <ServerFarmAverageCpuChart
            key={run.id}
            run={run}
            savedModels={savedModels}
          />
        ))}
      </div>
    </>
  )
}
