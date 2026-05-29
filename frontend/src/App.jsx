import { useState } from 'react'
import ComparisonPage from './components/ComparisonPage'
import DashboardPage from './components/DashboardPage'
import TrainingResultsPage from './components/TrainingResultsPage'
import AppStateProvider from './context/AppStateProvider'

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'results', label: 'Training Results' },
  { id: 'comparison', label: 'Comparison' },
]

const pagesByTab = {
  dashboard: DashboardPage,
  results: TrainingResultsPage,
  comparison: ComparisonPage,
}

const activeTabClass = 'border-[#0f172a] bg-[#0f172a] text-white shadow-sm'
const inactiveTabClass =
  'border-slate-300 bg-white text-slate-800 hover:border-sky-400 hover:text-sky-700'

function AppHeader({ activeTab, onTabChange }) {
  return (
    <header className="mb-6 border-b border-slate-200 pb-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-sky-700">
            IW-CLOUDMASIM
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 sm:text-[34px]">
            Live Multi-Agent Simulation Dashboard
          </h1>
          <p className="mt-3 max-w-3xl text-sm font-normal leading-6 text-slate-600 sm:text-base">
            Horizontal control surface for configuring, launching, and
            monitoring MADDPG cloud scheduling runs.
          </p>
        </div>

        <TabNavigation activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </header>
  )
}

function TabNavigation({ activeTab, onTabChange }) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="IW-CLOUDMASIM sections">
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        />
      ))}
    </nav>
  )
}

function TabButton({ tab, isActive, onClick }) {
  return (
    <button
      className={`min-h-10 rounded-lg border px-5 py-2 text-sm font-semibold transition ${
        isActive ? activeTabClass : inactiveTabClass
      }`}
      type="button"
      onClick={onClick}
    >
      {tab.label}
    </button>
  )
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const ActivePage = pagesByTab[activeTab]

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">
        <AppHeader activeTab={activeTab} onTabChange={setActiveTab} />

        {ActivePage ? <ActivePage /> : null}
      </div>
    </main>
  )
}

export default function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  )
}
