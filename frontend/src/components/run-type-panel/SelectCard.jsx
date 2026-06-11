import { controlTitleClass, fieldCardClass, selectClass } from './styles'

export default function SelectCard({
  description,
  disabled = false,
  getOptionLabel,
  getOptionValue,
  label,
  onChange,
  options,
  showLabel = true,
  value,
}) {
  return (
    <label className={fieldCardClass}>
      {showLabel ? (
        <span className={`mb-2 block ${controlTitleClass}`}>{label}</span>
      ) : null}
      <select
        className={selectClass}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={getOptionValue(option)} value={getOptionValue(option)}>
            {getOptionLabel(option)}
          </option>
        ))}
      </select>
      {description ? (
        <span className="mt-2 block text-sm font-normal leading-5 text-slate-500">
          {description}
        </span>
      ) : null}
    </label>
  )
}
