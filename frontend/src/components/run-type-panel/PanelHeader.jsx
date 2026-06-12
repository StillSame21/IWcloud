import { panelHeaderClass } from './styles'

export default function PanelHeader({ layout = 'default' }) {
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
