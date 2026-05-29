import StatusBadge from './StatusBadge'
import { useAppState } from '../context/useAppState'

function getTrainingStatusCopy(runStatus) {
  if (runStatus === 'running') {
    return {
      badge: 'Running',
      heading: 'Running',
      text: 'Simulation is streaming live metrics.',
    }
  }

  if (runStatus === 'stopped') {
    return {
      badge: 'Idle',
      heading: 'Idle',
      text: 'Run stopped. Metrics are preserved.',
    }
  }

  return {
    badge: 'Ready',
    heading: 'Idle',
    text: 'Training is waiting for a run.',
  }
}

function StatusCard({ label, children }) {
  return (
    <section className="min-h-28 border-b border-slate-200 bg-white p-5 last:border-b-0 sm:border-r sm:last:border-r-0 xl:border-b-0">
      <p className="mb-2 text-xs font-semibold uppercase tracking-normal text-slate-500">
        {label}
      </p>
      {children}
    </section>
  )
}

function StatusHeading({ badgeLabel, children }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-slate-950">{children}</h2>
      <StatusBadge label={badgeLabel} />
    </div>
  )
}

export default function StatusBar() {
  const {
    activePreset,
    backendInfo,
    lastHealthCheck,
    runStatus,
  } = useAppState()

  const backendLabel = backendInfo.connected ? 'Connected' : 'Disconnected'
  const trainingStatus = getTrainingStatusCopy(runStatus)

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatusCard label="Engine">
          <h2 className="text-base font-semibold text-slate-950">EcoPyCSIM</h2>
          <p className="mt-1 text-sm text-slate-500">
            Python-based simulation engine
          </p>
        </StatusCard>

        <StatusCard label="Backend Status">
          <StatusHeading badgeLabel={backendLabel}>ecopycsim-api</StatusHeading>
          <p className="text-sm text-slate-500">
            FastAPI bridge: {backendLabel}
            {lastHealthCheck ? ` at ${lastHealthCheck}` : ''}
          </p>
        </StatusCard>

        <StatusCard label="Training Status">
          <StatusHeading badgeLabel={trainingStatus.badge}>
            {trainingStatus.heading}
          </StatusHeading>
          <p className="text-sm text-slate-500">{trainingStatus.text}</p>
        </StatusCard>

        <StatusCard label="Active Preset">
          <h2 className="text-base font-semibold text-slate-950">
            {activePreset}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Current environment preset
          </p>
        </StatusCard>
      </div>
    </div>
  )
}
