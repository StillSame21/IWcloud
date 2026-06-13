import StatusBadge from './StatusBadge'
import { useAppState } from '../context/useAppState'

function getRunStatusCopy(runStatus) {
  if (runStatus === 'running') {
    return {
      badge: 'Running',
      heading: 'Running',
      text: 'Simulation is streaming live metrics.',
    }
  }

  if (runStatus === 'starting') {
    return {
      badge: 'Starting',
      heading: 'Starting',
      text: 'Backend accepted the run and the live stream is opening.',
    }
  }

  if (runStatus === 'stopping') {
    return {
      badge: 'Stopping',
      heading: 'Stopping',
      text: 'Stop request sent to the backend.',
    }
  }

  if (runStatus === 'completed') {
    return {
      badge: 'Done',
      heading: 'Completed',
      text: 'Run completed and metrics were saved.',
    }
  }

  if (runStatus === 'error') {
    return {
      badge: 'Error',
      heading: 'Error',
      text: 'Run failed. Check the dashboard message.',
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
    text: 'Waiting for a run.',
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
    backendInfo,
    lastHealthCheck,
    runError,
    runStatus,
  } = useAppState()

  const backendLabel = backendInfo.connected ? 'Connected' : 'Disconnected'
  const runStatusCopy = getRunStatusCopy(runStatus)

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
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

        <StatusCard label="Run Status">
          <StatusHeading badgeLabel={runStatusCopy.badge}>
            {runStatusCopy.heading}
          </StatusHeading>
          <p className="text-sm text-slate-500">
            {runError ?? runStatusCopy.text}
          </p>
        </StatusCard>
      </div>
    </div>
  )
}
