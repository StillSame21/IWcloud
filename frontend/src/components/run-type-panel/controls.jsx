import SelectCard from './SelectCard'
import { controlButtonBase, controlButtonStyles, fieldCardClass } from './styles'

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
  canStartRun,
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
          disabled={
            !canStartRun ||
            runStatus === 'running' ||
            runStatus === 'starting' ||
            runStatus === 'stopping'
          }
        >
          {runStatus === 'starting' ? 'Starting' : 'Run'}
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

export default function PrimaryControlsGroup({
  canStartRun,
  checkBackend,
  isChecking,
  isRunTypeLocked,
  onRunTypeChange,
  resetRun,
  runStatus,
  runTypes,
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
        disabled={isRunTypeLocked}
        onChange={onRunTypeChange}
        showLabel={false}
      />

      <div
        className="h-px bg-slate-200 lg:h-full lg:min-h-28 lg:w-px"
        aria-hidden="true"
      />

      <RunControlsCard
        canStartRun={canStartRun}
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
