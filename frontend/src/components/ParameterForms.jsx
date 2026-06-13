import { useState } from 'react'
import ParameterInput from './ParameterInputs'
import {
  controlButtonBase,
  controlButtonStyles,
} from './run-type-panel/styles'

const BASIC_SIMULATION_PARAM_KEYS = [
  'numberOfJobs',
  'numberOfTasks',
  'numberOfServerFarms',
  'numberOfServers',
]

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
  headerAction = null,
  lockedFields = [],
  layout = 'default',
  lockedMessage = '',
  onParamChange,
  params,
  title,
  children,
}) {
  const gridClass = parameterGridClasses[layout] ?? parameterGridClasses.default

  return (
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-normal text-slate-900">
            {title}
          </h3>
          <p className="mt-1 text-sm font-normal text-slate-500">{description}</p>
        </div>
        {headerAction}
      </div>
      <ParameterGrid
        fields={fields}
        gridClass={gridClass}
        lockedFields={lockedFields}
        lockedMessage={lockedMessage}
        params={params}
        onParamChange={onParamChange}
      />
      {children}
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
  onResetParams,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const basicFields = fields.filter((field) =>
    BASIC_SIMULATION_PARAM_KEYS.includes(field.key),
  )
  const advancedFields = fields.filter(
    (field) => !BASIC_SIMULATION_PARAM_KEYS.includes(field.key),
  )
  const gridClass = parameterGridClasses[layout] ?? parameterGridClasses.default

  return (
    <ParameterSection
      title="Simulation Parameters"
      description="EcoPyCSIM Table 3 inputs"
      fields={basicFields}
      headerAction={
        onResetParams ? (
          <button
            type="button"
            className={`${controlButtonBase} ${controlButtonStyles.check}`}
            onClick={onResetParams}
          >
            Reset to defaults
          </button>
        ) : null
      }
      lockedFields={lockedFields}
      lockedMessage={lockedMessage}
      layout={layout}
      params={params}
      onParamChange={onParamChange}
    >
      {advancedFields.length > 0 ? (
        <div className="space-y-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition hover:text-sky-900"
            aria-expanded={showAdvanced}
            onClick={() => setShowAdvanced((current) => !current)}
          >
            <span
              className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
            >
              ▸
            </span>
            Advanced settings
          </button>
          {showAdvanced ? (
            <ParameterGrid
              fields={advancedFields}
              gridClass={gridClass}
              lockedFields={lockedFields}
              lockedMessage={lockedMessage}
              params={params}
              onParamChange={onParamChange}
            />
          ) : null}
        </div>
      ) : null}
    </ParameterSection>
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
