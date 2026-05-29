const badgeStyles = {
  Connected: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  Ready: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  Running: 'border-sky-200 bg-sky-100 text-sky-700',
  Idle: 'border-slate-200 bg-slate-100 text-slate-600',
  Stopped: 'border-slate-200 bg-slate-100 text-slate-600',
  Disconnected: 'border-rose-200 bg-rose-100 text-rose-700',
  Random: 'border-cyan-200 bg-cyan-100 text-cyan-700',
  Training: 'border-indigo-200 bg-indigo-100 text-indigo-700',
  Inference: 'border-violet-200 bg-violet-100 text-violet-700',
}

export default function StatusBadge({ label }) {
  const style = badgeStyles[label] ?? badgeStyles.Idle

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${style}`}
    >
      {label}
    </span>
  )
}
