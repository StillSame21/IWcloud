import { cardClass } from '../../utils/chartTheme'

const kpiToneClasses = {
  sky: 'border-l-sky-500',
  emerald: 'border-l-emerald-500',
}

export default function KpiGrid({ cards }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <section
          key={card.id}
          className={`${cardClass} border-l-4 ${kpiToneClasses[card.tone]}`}
        >
          <p className="text-sm font-medium text-slate-500">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {card.value}
          </p>
          {card.helper ? (
            <p className="mt-1 text-sm text-slate-500">{card.helper}</p>
          ) : null}
        </section>
      ))}
    </div>
  )
}
