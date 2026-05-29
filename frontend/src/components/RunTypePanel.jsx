import { useState } from 'react'
import {
  SimulationParameters,
  TrainingParameters,
} from './ParameterForms'
import { useAppState } from '../context/useAppState'

const runTypes = [
  {
    id: 'random',
    label: 'Random Simulation',
    description: 'Run EcoPyCSIM with stochastic scheduling inputs.',
  },
  {
    id: 'training',
    label: 'Train Model',
    description: 'Configure MADDPG and simulation parameters together.',
  },
  {
    id: 'inference',
    label: 'Run Trained Model',
    description: 'Use a saved policy model for scheduling inference.',
  },
]

const parameterTabs = [
  { id: 'simulation', label: 'Simulation Parameters' },
  { id: 'training', label: 'Training Parameters' },
]

const panelClass = 'rounded-xl border border-slate-200 bg-white shadow-sm'
const panelHeaderClass = 'border-b border-slate-200 p-6'
const fieldCardClass =
  'block rounded-xl border border-slate-200 bg-slate-50 p-3'
const selectClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
const controlButtonBase =
  'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45'
const activeTabClass = 'border-[#0f172a] bg-[#0f172a] text-white shadow-sm'
const inactiveTabClass =
  'border-slate-300 bg-white text-slate-700 hover:border-sky-400 hover:text-sky-700'
const controlButtonStyles = {
  run: 'bg-[#0ea5e9] text-white shadow-sm hover:bg-sky-600',
  stop: 'bg-slate-300 text-white hover:bg-slate-400',
  reset: 'bg-[#0f172a] text-white hover:bg-slate-800',
  check: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50',
}

const panelBodyClasses = {
  default: 'space-y-5 p-5',
  horizontal: 'space-y-5 p-5',
}

const controlsLayoutClasses = {
  default: 'space-y-5',
  horizontal: 'space-y-3',
}

const controlTitleClass =
  'text-xs font-semibold uppercase tracking-normal text-slate-500'

function PanelHeader({ layout = 'default' }) {
  if (layout === 'horizontal') {
    return (
      <div className={panelHeaderClass}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] lg:items-start">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-normal text-slate-950">
              Run Type
            </h2>
            <p className="mt-2 text-sm font-normal text-slate-500">
              Choose between simulation and training workflows.
            </p>
          </div>

          <div
            className="hidden w-px self-stretch bg-slate-200 lg:block"
            aria-hidden="true"
          />

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-normal text-slate-950">
              Run Controls
            </h2>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={panelHeaderClass}>
      <h2 className="text-sm font-semibold uppercase tracking-normal text-slate-950">
        Run Type
      </h2>
      <p className="mt-2 text-sm font-normal text-slate-500">
        Choose between simulation and training workflows.
      </p>
    </div>
  )
}

function SelectCard({
  description,
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

function ControlButton({ children, disabled, icon, onClick, variant }) {
  return (
    <button
      className={`${controlButtonBase} ${controlButtonStyles[variant]}`}
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      <span aria-hidden="true">{icon}</span>
      {children}
    </button>
  )
}

function RunControlsCard({
  checkBackend,
  isChecking,
  resetRun,
  runStatus,
  startRun,
  stopRun,
}) {
  return (
    <section className={fieldCardClass}>
      <div className="grid grid-cols-2 gap-2">
        <ControlButton
          icon="▶"
          variant="run"
          onClick={startRun}
          disabled={runStatus === 'running'}
        >
          Run
        </ControlButton>
        <ControlButton
          icon="■"
          variant="stop"
          onClick={stopRun}
          disabled={runStatus !== 'running'}
        >
          Stop
        </ControlButton>
        <ControlButton icon="↺" variant="reset" onClick={resetRun}>
          Reset
        </ControlButton>
        <ControlButton
          icon="✓"
          variant="check"
          onClick={checkBackend}
          disabled={isChecking}
        >
          {isChecking ? 'Checking' : 'Check'}
        </ControlButton>
      </div>
    </section>
  )
}

function PrimaryControlsGroup({
  checkBackend,
  isChecking,
  onRunTypeChange,
  resetRun,
  runStatus,
  selectedRunType,
  selectedRunTypeDetails,
  startRun,
  stopRun,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] lg:items-start">
      <SelectCard
        label="Run Mode"
        value={selectedRunType}
        options={runTypes}
        getOptionValue={(runType) => runType.id}
        getOptionLabel={(runType) => runType.label}
        description={selectedRunTypeDetails?.description}
        onChange={onRunTypeChange}
        showLabel={false}
      />

      <div
        className="h-px bg-slate-200 lg:h-full lg:min-h-28 lg:w-px"
        aria-hidden="true"
      />

      <RunControlsCard
        checkBackend={checkBackend}
        isChecking={isChecking}
        resetRun={resetRun}
        runStatus={runStatus}
        startRun={startRun}
        stopRun={stopRun}
      />
    </div>
  )
}

function ParameterTabs({ activeTab, onTabChange }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
      {parameterTabs.map((tab) => (
        <ParameterTabButton
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        />
      ))}
    </div>
  )
}

function ParameterTabButton({ tab, isActive, onClick }) {
  return (
    <button
      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
        isActive ? activeTabClass : inactiveTabClass
      }`}
      type="button"
      onClick={onClick}
    >
      {tab.label}
    </button>
  )
}

export default function RunTypePanel({ layout = 'default' }) {
  return <RunTypePanelContent layout={layout} />
}

export function RunTypePanelContent({ layout = 'default' }) {
  const [activeParameterTab, setActiveParameterTab] = useState('simulation')
  const {
    checkBackend,
    isChecking,
    resetRun,
    savedModels,
    selectedModel,
    selectedRunType,
    setSelectedModel,
    setSelectedRunType,
    simParams,
    startRun,
    stopRun,
    runStatus,
    trainingParams,
    updateSimParam,
    updateTrainingParam,
  } = useAppState()

  const selectedRunTypeDetails = runTypes.find(
    (runType) => runType.id === selectedRunType,
  )

  const handleRunTypeChange = (runType) => {
    setSelectedRunType(runType)
    setActiveParameterTab('simulation')
  }

  const shouldShowSimulationParameters =
    selectedRunType !== 'training' || activeParameterTab === 'simulation'
  const shouldShowTrainingParameters =
    selectedRunType === 'training' && activeParameterTab === 'training'
  const parameterLayout = layout === 'horizontal' ? 'horizontal' : 'default'
  const bodyClass = panelBodyClasses[layout] ?? panelBodyClasses.default
  const controlsClass =
    controlsLayoutClasses[layout] ?? controlsLayoutClasses.default

  return (
    <section className={panelClass}>
      <PanelHeader layout={layout} />

      <div className={bodyClass}>
        <div className={controlsClass}>
          <PrimaryControlsGroup
            checkBackend={checkBackend}
            isChecking={isChecking}
            onRunTypeChange={handleRunTypeChange}
            resetRun={resetRun}
            runStatus={runStatus}
            selectedRunType={selectedRunType}
            selectedRunTypeDetails={selectedRunTypeDetails}
            startRun={startRun}
            stopRun={stopRun}
          />

          {selectedRunType === 'inference' ? (
            <SelectCard
              label="Saved Model"
              value={selectedModel}
              options={savedModels}
              getOptionValue={(model) => model.id}
              getOptionLabel={(model) => model.name}
              onChange={setSelectedModel}
            />
          ) : null}
        </div>

        {selectedRunType === 'training' ? (
          <ParameterTabs
            activeTab={activeParameterTab}
            onTabChange={setActiveParameterTab}
          />
        ) : null}

        {shouldShowSimulationParameters ? (
          <SimulationParameters
            layout={parameterLayout}
            params={simParams}
            onParamChange={updateSimParam}
          />
        ) : null}

        {shouldShowTrainingParameters ? (
          <TrainingParameters
            layout={parameterLayout}
            params={trainingParams}
            onParamChange={updateTrainingParam}
          />
        ) : null}
      </div>
    </section>
  )
}
