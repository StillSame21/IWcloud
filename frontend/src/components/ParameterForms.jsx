import {
  simulationParameterFields,
  trainingParameterFields,
} from '../mockData'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'

const sliderClass = 'w-full accent-sky-500'
const parameterGridClasses = {
  default: 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2',
  horizontal:
    'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4',
}
const fieldCardClass =
  'rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm'
const fieldHeaderClass = 'mb-2 flex items-start justify-between gap-2'
const rangeMetaClass = 'flex items-center justify-between gap-3'
const rangeValueClass =
  'rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700'

const parseValue = (currentValue, nextValue) =>
  typeof currentValue === 'number' ? Number(nextValue) : nextValue

function ParameterSection({
  description,
  fields,
  layout = 'default',
  onParamChange,
  params,
  title,
}) {
  const gridClass = parameterGridClasses[layout] ?? parameterGridClasses.default

  return (
    <section className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-normal text-slate-900">
          {title}
        </h3>
        <p className="mt-1 text-sm font-normal text-slate-500">{description}</p>
      </div>
      <ParameterGrid
        fields={fields}
        gridClass={gridClass}
        params={params}
        onParamChange={onParamChange}
      />
    </section>
  )
}

function ParameterGrid({ fields, gridClass, params, onParamChange }) {
  return (
    <div className={gridClass}>
      {fields.map((field) => (
        <ParameterField
          key={field.key}
          field={field}
          value={params[field.key]}
          onChange={(value) => onParamChange(field.key, value)}
        />
      ))}
    </div>
  )
}

function ParameterField({ field, value, onChange }) {
  return (
    <label className={fieldCardClass}>
      <div className={fieldHeaderClass}>
        <div>
          <span className="block text-sm font-medium text-slate-700">
            {field.label}
          </span>
          {field.hint ? (
            <span className="text-xs text-slate-500">{field.hint}</span>
          ) : null}
        </div>
      </div>
      <ParameterInput field={field} value={value} onChange={onChange} />
    </label>
  )
}

function ParameterInput({ field, value, onChange }) {
  if (field.control === 'select') {
    return <SelectInput field={field} value={value} onChange={onChange} />
  }

  if (field.control === 'slider') {
    return <SliderInput field={field} value={value} onChange={onChange} />
  }

  if (field.control === 'dualRange') {
    return <DualRangeInput field={field} value={value} onChange={onChange} />
  }

  return <BasicInput field={field} value={value} onChange={onChange} />
}

function SelectInput({ field, value, onChange }) {
  return (
    <select
      className={inputClass}
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

function SliderInput({ field, value, onChange }) {
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
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}

function DualRangeInput({ field, value, onChange }) {
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
          field={field}
          value={minValue}
          onChange={updateMinimum}
        />
        <RangeInput
          label="Max"
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

function RangeInput({ label, field, value, onChange }) {
  return (
    <label className="space-y-1 text-xs text-slate-500">
      {label}
      <input
        className={sliderClass}
        type="range"
        min={field.min}
        max={field.max}
        step={field.step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

function BasicInput({ field, value, onChange }) {
  return (
    <input
      className={inputClass}
      type={field.control === 'text' ? 'text' : 'number'}
      step={field.step}
      value={value}
      onChange={(event) => onChange(parseValue(value, event.target.value))}
    />
  )
}

export function SimulationParameters({
  layout = 'default',
  params,
  onParamChange,
}) {
  return (
    <ParameterSection
      title="Simulation Parameters"
      description="EcoPyCSIM Table 3 inputs"
      fields={simulationParameterFields}
      layout={layout}
      params={params}
      onParamChange={onParamChange}
    />
  )
}

export function TrainingParameters({
  layout = 'default',
  params,
  onParamChange,
}) {
  return (
    <ParameterSection
      title="Training Parameters"
      description="MADDPG Table 2 hyperparameters"
      fields={trainingParameterFields}
      layout={layout}
      params={params}
      onParamChange={onParamChange}
    />
  )
}
