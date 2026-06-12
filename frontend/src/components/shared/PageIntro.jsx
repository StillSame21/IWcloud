import { cardClass } from '../../utils/chartTheme'
import SectionTitle from './SectionTitle'

export default function PageIntro({ badges = [], description, title }) {
  return (
    <section className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <SectionTitle title={title} />
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
