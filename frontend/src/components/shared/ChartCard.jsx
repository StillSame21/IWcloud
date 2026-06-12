import { chartCardClass } from '../../utils/chartTheme'
import SectionTitle from './SectionTitle'

export default function ChartCard({ bodyClass = 'mt-4 h-80', children, title }) {
  return (
    <section className={chartCardClass}>
      <SectionTitle title={title} />
      <div className={bodyClass}>{children}</div>
    </section>
  )
}
