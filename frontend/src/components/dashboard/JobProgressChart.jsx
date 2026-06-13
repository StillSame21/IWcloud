import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ChartCard from '../shared/ChartCard'
import { getAdaptiveDomain } from '../../utils/chartAxes'
import {
  axisStroke,
  axisTick,
  chartGridStroke,
  tooltipStyle,
} from '../../utils/chartTheme'

export default function JobProgressChart({ data }) {
  const yDomain = getAdaptiveDomain(data, ['acceptedJobs', 'activeJobs', 'rejectedJobs'], {
    zeroMin: true,
  })

  return (
    <ChartCard title="Job Progress Per Time Step">
      {data.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
          No job telemetry yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 24, bottom: 48 }}>
            <CartesianGrid stroke={chartGridStroke} strokeDasharray="4 4" />
            <XAxis
              dataKey="timeStep"
              height={58}
              label={{
                value: 'Time Step',
                position: 'insideBottom',
                offset: -4,
                fill: '#64748b',
              }}
              stroke={axisStroke}
              tick={axisTick}
            />
            <YAxis
              domain={yDomain}
              label={{
                value: 'Jobs',
                angle: -90,
                position: 'insideLeft',
                fill: '#64748b',
              }}
              stroke={axisStroke}
              tick={axisTick}
              width={48}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 12 }} />
            <Line
              type="monotone"
              dataKey="acceptedJobs"
              name="Accepted"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="activeJobs"
              name="Active"
              stroke="#2563eb"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="rejectedJobs"
              name="Rejected"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
