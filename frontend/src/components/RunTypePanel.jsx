import { useState } from 'react'
import {
  SimulationParameters,
  TrainingParameters,
} from './ParameterForms'
import PanelHeader from './run-type-panel/PanelHeader'
import ParameterTabs from './run-type-panel/ParameterTabs'
import SelectCard from './run-type-panel/SelectCard'
import PrimaryControlsGroup from './run-type-panel/controls'
import { panelClass } from './run-type-panel/styles'
import { useAppState } from '../context/useAppState'

const panelBodyClasses = {
  default: 'space-y-5 p-5',
  horizontal: 'space-y-5 p-5',
}

const controlsLayoutClasses = {
  default: 'space-y-5',
  horizontal: 'space-y-3',
}

export default function RunTypePanel({ layout = 'default' }) {
  const [activeParameterTab, setActiveParameterTab] = useState('simulation')
  const {
    checkBackend,
    isChecking,
    lockedSimulationFields,
    modelLockMessage,
    resetRun,
    resetVisualizations,
    runTypes,
    savedModels,
    selectedModel,
    selectedRunType,
    setSelectedModel,
    setSelectedRunType,
    simParams,
    simulationParameterFields,
    startRun,
    stopRun,
    runStatus,
    trainingParameterFields,
    trainingParams,
    updateSimParam,
    updateTrainingParam,
  } = useAppState()

  const selectedRunTypeDetails = runTypes.find(
    (runType) => runType.id === selectedRunType,
  )
  const isRunTypeLocked = ['starting', 'running', 'stopping'].includes(runStatus)

  const handleRunTypeChange = (runType) => {
    if (isRunTypeLocked || runType === selectedRunType) {
      return
    }

    setSelectedRunType(runType)
    resetVisualizations()
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
  const canStartRun = selectedRunType !== 'inference' || savedModels.length > 0
  const modelDescription =
    savedModels.length === 0
      ? 'Train a model before evaluating a saved policy.'
      : modelLockMessage

  return (
    <section className={panelClass}>
      <PanelHeader layout={layout} />

      <div className={bodyClass}>
        <div className={controlsClass}>
          <PrimaryControlsGroup
            canStartRun={canStartRun}
            checkBackend={checkBackend}
            isChecking={isChecking}
            isRunTypeLocked={isRunTypeLocked}
            onRunTypeChange={handleRunTypeChange}
            resetRun={resetRun}
            runStatus={runStatus}
            runTypes={runTypes}
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
              description={modelDescription}
              disabled={savedModels.length === 0}
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
            fields={simulationParameterFields}
            lockedFields={lockedSimulationFields}
            lockedMessage={modelLockMessage}
            layout={parameterLayout}
            params={simParams}
            onParamChange={updateSimParam}
          />
        ) : null}

        {shouldShowTrainingParameters ? (
          <TrainingParameters
            fields={trainingParameterFields}
            layout={parameterLayout}
            params={trainingParams}
            onParamChange={updateTrainingParam}
          />
        ) : null}
      </div>
    </section>
  )
}
