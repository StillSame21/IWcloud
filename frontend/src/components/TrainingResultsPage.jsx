import { useState } from 'react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import StatusBadge from './StatusBadge'
import { useAppState } from '../context/useAppState'

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value)
}

function Sparkline({ data }) {
  return (
    <div className="h-24 rounded-lg border border-slate-700 bg-slate-950/35 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="step" hide />
          <YAxis hide domain={['dataMin - 8', 'dataMax + 8']} />
          <Tooltip
            cursor={false}
            contentStyle={{
              borderColor: '#334155',
              borderRadius: '10px',
              background: '#0f172a',
              color: '#ffffff',
            }}
          />
          <Line
            type="monotone"
            dataKey="energyCost"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function DetailStat({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/35 p-3">
      <p className="text-xs uppercase tracking-normal text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  )
}

function PageIntro() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-normal text-slate-950">
        Training Results
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Completed evaluation, training, and trained model runs.
      </p>
    </div>
  )
}

function RunCard({ isExpanded, onToggle, run }) {
  return (
    <article className="rounded-xl border border-slate-700 bg-[#1e293b] p-5 shadow-sm">
      <RunHeader run={run} />
      <RunSummaryStats run={run} />

      <div className="mt-5">
        <Sparkline data={run.metrics} />
      </div>

      <button
        className="mt-5 w-full rounded-lg bg-[#0ea5e9] px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600"
        type="button"
        onClick={onToggle}
      >
        {isExpanded ? 'Hide Details' : 'View Details'}
      </button>

      {isExpanded ? <RunDetailStats run={run} /> : null}
    </article>
  )
}

function RunHeader({ run }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold text-white">{run.id}</h3>
        <p className="mt-1 text-sm text-slate-400">{run.dateTime}</p>
      </div>
      <StatusBadge label={run.type} />
    </div>
  )
}

function RunSummaryStats({ run }) {
  const stats = [
    ['Total Steps', run.summary.totalSteps],
    ['Final Energy', run.summary.finalEnergyCost.toFixed(2)],
    ['Rejected Tasks', run.summary.rejectedTasks],
    ['Total Energy', formatNumber(run.summary.totalEnergy)],
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map(([label, value]) => (
        <DetailStat key={label} label={label} value={value} />
      ))}
    </div>
  )
}

function RunDetailStats({ run }) {
  const training = run.parameters.training
  const stats = [
    ['Jobs', run.parameters.numberOfJobs],
    ['Tasks', run.parameters.numberOfTasks],
    ['Server Farms', run.parameters.numberOfServerFarms],
    ['Servers', run.parameters.numberOfServers],
    ['Avg Step Time', `${run.summary.avgStepTime}s`],
    [
      'Model',
      run.parameters.selectedModel ?? training?.networkArchitecture ?? 'Not used',
    ],
  ]

  return (
    <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-700 pt-5 sm:grid-cols-2">
      {stats.map(([label, value]) => (
        <DetailStat key={label} label={label} value={value} />
      ))}
    </div>
  )
}

export default function TrainingResultsPage() {
  const { runHistory } = useAppState()
  const [expandedRunId, setExpandedRunId] = useState(null)

  const toggleRunDetails = (runId) => {
    setExpandedRunId((currentRunId) => (currentRunId === runId ? null : runId))
  }

  return (
    <section className="space-y-5">
      <PageIntro />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {runHistory.map((run) => (
          <RunCard
            key={run.id}
            run={run}
            isExpanded={expandedRunId === run.id}
            onToggle={() => toggleRunDetails(run.id)}
          />
        ))}
      </div>
    </section>
  )
}
