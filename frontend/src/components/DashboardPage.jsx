import DashboardVisualizations, {
  DashboardOverview,
} from './DashboardVisualizations'
import LiveSimulationPanel from './LiveSimulationPanel'
import RunTypePanel from './RunTypePanel'
import StatusBar from './StatusBar'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <StatusBar />
      <RunTypePanel layout="horizontal" />
      <DashboardOverview />
      <LiveSimulationPanel />
      <DashboardVisualizations />
    </div>
  )
}
