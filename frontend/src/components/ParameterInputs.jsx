const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'

const sliderClass = 'w-full accent-sky-500'
const rangeMetaClass = 'flex items-center justify-between gap-3'
const rangeValueClass =
  'rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700'

const parseValue = (currentValue, nextValue) =>
  typeof currentValue === 'number' ? Number(nextValue) : nextValue

export default function ParameterInput({ disabled, field, value, onChange }) {
  if (field.control === 'select') {
    return (
      <SelectInput
        disabled={disabled}
        field={field}
        value={value}
        onChange={onChange}
      />
    )
  }

  if (field.control === 'slider') {
    return (
      <SliderInput
        disabled={disabled}
        field={field}
        value={value}
        onChange={onChange}
      />
    )
  }

  if (field.control === 'dualRange') {
    return (
      <DualRangeInput
        disabled={disabled}
        field={field}
        value={value}
        onChange={onChange}
      />
    )
  }

  return (
    <BasicInput
      disabled={disabled}
      field={field}
      value={value}
      onChange={onChange}
    />
  )
}

function SelectInput({ disabled, field, value, onChange }) {
  return (
    <select
      className={inputClass}
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(parseValue(value, event.target.value))}
    >
      {field.options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

function SliderInput({ disabled, field, value, onChange }) {
  return (
    <div className="space-y-2">
      <RangeMeta field={field}>
        <span className={rangeValueClass}>{value}</span>
      </RangeMeta>
      <input
        className={sliderClass}
        type="range"
        min={field.min}
        max={field.max}
        step={field.step}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}

function DualRangeInput({ disabled, field, value, onChange }) {
  const [minValue, maxValue] = value
  const updateMinimum = (nextValue) =>
    onChange([Math.min(nextValue, maxValue), maxValue])
  const updateMaximum = (nextValue) =>
    onChange([minValue, Math.max(nextValue, minValue)])

  return (
    <div className="space-y-2">
      <RangeMeta field={field}>
        <span className={rangeValueClass}>
          [{minValue}, {maxValue}]
        </span>
      </RangeMeta>
      <div className="grid grid-cols-2 gap-2">
        <RangeInput
          label="Min"
          disabled={disabled}
          field={field}
          value={minValue}
          onChange={updateMinimum}
        />
        <RangeInput
          label="Max"
          disabled={disabled}
          field={field}
          value={maxValue}
          onChange={updateMaximum}
        />
      </div>
    </div>
  )
}

function RangeMeta({ field, children }) {
  return (
    <div className={rangeMetaClass}>
      <span className="text-xs text-slate-500">
        {field.min} - {field.max}
      </span>
      {children}
    </div>
  )
}

function RangeInput({ disabled, label, field, value, onChange }) {
  return (
    <label className="space-y-1 text-xs text-slate-500">
      {label}
      <input
        className={sliderClass}
        type="range"
        min={field.min}
        max={field.max}
        step={field.step}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

function BasicInput({ disabled, field, value, onChange }) {
  return (
    <input
      className={inputClass}
      type={field.control === 'text' ? 'text' : 'number'}
      step={field.step}
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(parseValue(value, event.target.value))}
    />
  )
}
