import SectionTitle from '../shared/SectionTitle'
import { cardClass } from '../../utils/chartTheme'
import { formatUtilizationRate } from '../../utils/format'

function getUtilizationClass(value) {
  if (value < 0.45) {
    return 'bg-emerald-100 text-emerald-800'
  }

  if (value < 0.65) {
    return 'bg-teal-500 text-white'
  }

  if (value < 0.75) {
    return 'bg-amber-300 text-slate-950'
  }

  if (value < 0.85) {
    return 'bg-orange-400 text-white'
  }

  return 'bg-rose-500 text-white'
}

export default function ServerFarmHeatmap({
  data,
  title = 'Server Farm CPU Utilisation (Active VM Share)',
}) {
  const farms = data?.farms ?? []
  const maxServerCount = Math.max(
    1,
    ...farms.map((servers) => servers.length),
  )

  return (
    <section className={cardClass}>
      <SectionTitle title={title} />
      <div className="mt-4 overflow-x-auto">
        {farms.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm font-medium text-slate-500">
            CPU heatmap will appear after the episode completes.
          </div>
        ) : (
          <div className="min-w-[680px] space-y-2">
            {farms.map((servers, farmIndex) => (
              <div
                key={`farm-${farmIndex + 1}`}
                className="grid items-center gap-1"
                style={{
                  gridTemplateColumns: `2.75rem repeat(${maxServerCount}, minmax(3rem, 1fr))`,
                }}
              >
                <span className="text-xs font-medium text-slate-500">
                  F{farmIndex + 1}
                </span>
                {servers.map((value, serverIndex) => (
                  <span
                    key={`${farmIndex}-${serverIndex}`}
                    className={`rounded-md px-2 py-1.5 text-center text-xs font-semibold ${getUtilizationClass(
                      value,
                    )}`}
                    title={`Farm ${farmIndex + 1}, server ${
                      serverIndex + 1
                    }: ${formatUtilizationRate(value)} of VMs busy while active`}
                  >
                    {formatUtilizationRate(value)}
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {farms.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Low</span>
          {[0.28, 0.56, 0.7, 0.8, 0.9].map((value) => (
            <span
              key={value}
              className={`h-3 w-6 rounded-full ${getUtilizationClass(value)}`}
            />
          ))}
          <span>
            High - above optimal {formatUtilizationRate(data.optimalRate)}
          </span>
        </div>
      ) : null}
    </section>
  )
}
