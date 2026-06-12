import { useMemo } from 'react'
import CombinedEnergyWorkloadChart from './CombinedEnergyWorkloadChart'
import ConfigurationTable from './ConfigurationTable'
import EnergyPerTimeStepChart from './EnergyPerTimeStepChart'
import JobAcceptanceRateCard from './JobAcceptanceRateCard'
import ServerFarmCpuComparisonChart from './ServerFarmCpuComparisonChart'
import WallTimePerWorkloadChart from './WallTimePerWorkloadChart'
import {
  buildEnergyPerTimeStepData,
  buildEnergyWorkloadData,
  buildServerFarmCpuData,
  buildWallTimePerWorkloadData,
} from './comparisonData'

export default function ComparisonResults({ selectedRuns }) {
  const energyPerTimeStepData = useMemo(
    () => buildEnergyPerTimeStepData(selectedRuns),
    [selectedRuns],
  )
  const energyWorkloadData = useMemo(
    () => buildEnergyWorkloadData(selectedRuns),
    [selectedRuns],
  )
  const wallTimePerWorkloadData = useMemo(
    () => buildWallTimePerWorkloadData(selectedRuns),
    [selectedRuns],
  )
  const serverFarmCpuData = useMemo(
    () => buildServerFarmCpuData(selectedRuns),
    [selectedRuns],
  )

  return (
    <>
      <ConfigurationTable selectedRuns={selectedRuns} />
      <EnergyPerTimeStepChart
        data={energyPerTimeStepData}
        selectedRuns={selectedRuns}
      />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <JobAcceptanceRateCard selectedRuns={selectedRuns} />
        <WallTimePerWorkloadChart
          data={wallTimePerWorkloadData}
          selectedRuns={selectedRuns}
        />
      </div>
      <CombinedEnergyWorkloadChart
        data={energyWorkloadData}
        selectedRuns={selectedRuns}
      />
      <ServerFarmCpuComparisonChart
        data={serverFarmCpuData}
        selectedRuns={selectedRuns}
      />
    </>
  )
}
