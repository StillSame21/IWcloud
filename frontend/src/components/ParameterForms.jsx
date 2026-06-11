import ParameterInput from './ParameterInputs'

const parameterGridClasses = {
  default: 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2',
  horizontal:
    'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4',
}
const fieldCardClass =
  'rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm'
const fieldHeaderClass = 'mb-2 flex items-start justify-between gap-2'

function ParameterSection({
  description,
  fields,
  lockedFields = [],
  layout = 'default',
  lockedMessage = '',
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
        lockedFields={lockedFields}
        lockedMessage={lockedMessage}
        params={params}
        onParamChange={onParamChange}
      />
    </section>
  )
}

function ParameterGrid({
  fields,
  gridClass,
  lockedFields,
  lockedMessage,
  params,
  onParamChange,
}) {
  return (
    <div className={gridClass}>
      {fields.map((field) => (
        <ParameterField
          key={field.key}
          disabled={field.readOnly || lockedFields.includes(field.key)}
          field={field}
          lockedMessage={lockedFields.includes(field.key) ? lockedMessage : ''}
          value={params[field.key]}
          onChange={(value) => onParamChange(field.key, value)}
        />
      ))}
    </div>
  )
}

function ParameterField({ disabled, field, lockedMessage, value, onChange }) {
  return (
    <label className={`${fieldCardClass} ${disabled ? 'opacity-70' : ''}`}>
      <div className={fieldHeaderClass}>
        <div>
          <span className="block text-sm font-medium text-slate-700">
            {field.label}
          </span>
          {lockedMessage || field.hint ? (
            <span className="text-xs text-slate-500">
              {lockedMessage || field.hint}
            </span>
          ) : null}
        </div>
      </div>
      <ParameterInput
        disabled={disabled}
        field={field}
        value={value}
        onChange={onChange}
      />
    </label>
  )
}

export function SimulationParameters({
  fields = [],
  layout = 'default',
  lockedFields = [],
  lockedMessage = '',
  params,
  onParamChange,
}) {
  return (
    <ParameterSection
      title="Simulation Parameters"
      description="EcoPyCSIM Table 3 inputs"
      fields={fields}
      lockedFields={lockedFields}
      lockedMessage={lockedMessage}
      layout={layout}
      params={params}
      onParamChange={onParamChange}
    />
  )
}

export function TrainingParameters({
  fields = [],
  layout = 'default',
  params,
  onParamChange,
}) {
  return (
    <ParameterSection
      title="Training Parameters"
      description="MADDPG Table 2 hyperparameters"
      fields={fields}
      layout={layout}
      params={params}
      onParamChange={onParamChange}
    />
  )
}
