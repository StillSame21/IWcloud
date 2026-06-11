import { activeTabClass, inactiveTabClass } from './styles'

const parameterTabs = [
  { id: 'simulation', label: 'Simulation Parameters' },
  { id: 'training', label: 'Training Parameters' },
]

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

export default function ParameterTabs({ activeTab, onTabChange }) {
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
