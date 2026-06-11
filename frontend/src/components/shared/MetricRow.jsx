import { tableLabelClass, tableValueClass } from '../../utils/chartTheme'

export default function MetricRow({ getValue, label, selectedRuns }) {
  return (
    <tr>
      <td className={tableLabelClass}>{label}</td>
      {selectedRuns.map((run) => (
        <td key={`${run.id}-${label}`} className={tableValueClass}>
          {getValue(run) ?? 'Not recorded'}
        </td>
      ))}
    </tr>
  )
}
