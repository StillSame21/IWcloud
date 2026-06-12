import SectionTitle from '../shared/SectionTitle'
import { cardClass } from '../../utils/chartTheme'

const phaseToneClasses = {
  neutral: 'bg-slate-100 text-slate-700',
  warning: 'bg-amber-200 text-amber-900',
  success: 'bg-emerald-300 text-emerald-950',
  info: 'bg-slate-300 text-slate-700',
}

function getActivePhase(timeline) {
  return timeline.phases.find(
    (phase) =>
      timeline.currentEpisode >= phase.start &&
      timeline.currentEpisode < phase.end,
  )
}

function getTimelineMarkers(timeline) {
  const markers = timeline.phases.map((phase) => phase.start)
  return [...new Set([...markers, timeline.totalEpisodes])]
}

export default function TrainingPhaseTimeline({ timeline }) {
  const activePhase = getActivePhase(timeline)
  const markers = getTimelineMarkers(timeline)

  return (
    <section className={cardClass}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Training Phase Timeline" />
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          {activePhase?.label ?? 'Waiting'}
        </span>
      </div>

      <div className="flex overflow-hidden rounded-lg border border-slate-200">
        {timeline.phases.map((phase) => {
          const width =
            ((phase.end - phase.start) / timeline.totalEpisodes) * 100
          const isActive = activePhase?.id === phase.id

          return (
            <div
              key={phase.id}
              className={`flex min-h-10 items-center justify-center px-3 text-xs font-semibold ${
                phaseToneClasses[phase.tone]
              } ${isActive ? 'ring-2 ring-inset ring-slate-900/20' : ''}`}
              style={{ width: `${width}%` }}
            >
              {isActive ? `${phase.label} now` : phase.label}
            </div>
          )
        })}
      </div>

      <div className="mt-2 flex justify-between text-xs text-slate-500">
        {markers.map((episode) => (
          <span key={episode}>Ep {episode}</span>
        ))}
      </div>
    </section>
  )
}
