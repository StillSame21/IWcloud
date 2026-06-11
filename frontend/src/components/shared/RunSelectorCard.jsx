import StatusBadge from '../StatusBadge'

export default function RunSelectorCard({
  badgeLabel,
  children,
  dateTime,
  isDisabled,
  isSelected,
  name,
  onToggle,
  statColsClass,
}) {
  const selectedClass = isSelected
    ? 'border-sky-500 ring-2 ring-sky-500/15'
    : 'border-slate-200'
  const disabledClass = isDisabled ? 'opacity-55' : ''

  return (
    <label
      className={`block rounded-xl border bg-white p-5 shadow-sm transition ${selectedClass} ${disabledClass}`}
    >
      <div className="flex items-start gap-3">
        <input
          className="mt-1 h-4 w-4 accent-sky-500"
          type="checkbox"
          checked={isSelected}
          disabled={isDisabled}
          onChange={onToggle}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-950">{name}</span>
            <StatusBadge label={badgeLabel} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{dateTime}</p>
          <div className={`mt-4 grid grid-cols-1 gap-3 ${statColsClass}`}>
            {children}
          </div>
        </div>
      </div>
    </label>
  )
}
