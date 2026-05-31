import DashboardVisualizations, {
  DashboardOverview,
} from './DashboardVisualizations'
import LiveSimulationPanel from './LiveSimulationPanel'
import RunTypePanel from './RunTypePanel'
import StatusBar from './StatusBar'
import { useAppState } from '../context/useAppState'

export default function DashboardPage() {
  const { selectedRunType } = useAppState()
  const shouldShowTrainingLivePanel = selectedRunType === 'training'

  return (
    <div className="space-y-6">
      <StatusBar />
      <RunTypePanel layout="horizontal" />
      <DashboardOverview />
      {shouldShowTrainingLivePanel ? <LiveSimulationPanel /> : null}
      <DashboardVisualizations />
    </div>
  )
}
