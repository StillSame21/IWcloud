const round = (value, digits = 2) => Number(value.toFixed(digits))

export const backendStatus = {
  connected: true,
  trainingStatus: 'Idle',
}

export const activePreset = 'Normal'

export const savedModels = [
  { id: 'maddpg-normal-v1', name: 'MADDPG Normal v1' },
  { id: 'maddpg-balanced-v2', name: 'MADDPG Balanced v2' },
  { id: 'maddpg-energy-saver', name: 'MADDPG Energy Saver' },
]

export const defaultSimulationParams = {
  numberOfJobs: 100,
  numberOfTasks: 800,
  numberOfServerFarms: 2,
  numberOfServers: 30,
  jobArrivalLambda: 0.5,
  taskArrivalMu: 5,
  taskArrivalVariance: 1.6,
  requestCpuRange: [0, 1],
  requestRamRange: [0, 1],
  numberOfVmTypes: 10,
  energyCoeffAlpha: 0.5,
  energyCoeffBeta: 10,
  optimalUtilizationRate: 0.7,
  staticPower: 0.035,
}

export const defaultTrainingParams = {
  episodes: 1000,
  numberOfAgents: 2,
  networkArchitecture: 'MLP(64,64)',
  memorySize: 100000,
  batchSize: 1024,
  randomSteps: 'jobs × 0.1',
  criticLearningRate: 0.0005,
  actorLearningRate: 0.0005,
  discountFactor: 0.9,
  targetUpdateSteps: 5,
  optimizer: 'Adam',
  tau: 0.1,
}

export const simulationParameterFields = [
  {
    key: 'numberOfJobs',
    label: 'Number of Jobs',
    control: 'select',
    options: [50, 100, 300, 500],
  },
  {
    key: 'numberOfTasks',
    label: 'Number of Tasks',
    control: 'select',
    options: [600, 800, 3600, 9000],
  },
  {
    key: 'numberOfServerFarms',
    label: 'Number of Server Farms',
    control: 'select',
    options: [2, 5, 10],
  },
  {
    key: 'numberOfServers',
    label: 'Number of Servers',
    control: 'select',
    options: [5, 30, 100],
  },
  {
    key: 'jobArrivalLambda',
    label: 'Job Arrival Time λ',
    control: 'slider',
    min: 0.1,
    max: 2,
    step: 0.1,
  },
  { key: 'taskArrivalMu', label: 'Task Arrival μ', control: 'number', step: 0.1 },
  {
    key: 'taskArrivalVariance',
    label: 'Task Arrival σ²',
    control: 'number',
    step: 0.1,
  },
  {
    key: 'requestCpuRange',
    label: 'Request CPU Range',
    control: 'dualRange',
    min: 0,
    max: 1,
    step: 0.05,
  },
  {
    key: 'requestRamRange',
    label: 'Request RAM Range',
    control: 'dualRange',
    min: 0,
    max: 1,
    step: 0.05,
  },
  { key: 'numberOfVmTypes', label: 'Number of VM Types', control: 'number' },
  {
    key: 'energyCoeffAlpha',
    label: 'Energy Coeff Alpha',
    control: 'slider',
    min: 0.3,
    max: 0.8,
    step: 0.05,
  },
  { key: 'energyCoeffBeta', label: 'Energy Coeff Beta', control: 'number' },
  {
    key: 'optimalUtilizationRate',
    label: 'Optimal Utilization Rate',
    control: 'slider',
    min: 0,
    max: 1,
    step: 0.05,
  },
  { key: 'staticPower', label: 'Static Power', control: 'number', step: 0.001 },
]

export const trainingParameterFields = [
  { key: 'episodes', label: 'Episodes', control: 'number' },
  { key: 'numberOfAgents', label: 'Number of Agents', control: 'number' },
  {
    key: 'networkArchitecture',
    label: 'Network Architecture',
    control: 'select',
    options: ['MLP(64,64)', 'MLP(128,128)', 'MLP(256,256)'],
  },
  { key: 'memorySize', label: 'Memory Size', control: 'number' },
  { key: 'batchSize', label: 'Batch Size', control: 'number' },
  {
    key: 'randomSteps',
    label: 'Random Steps',
    control: 'text',
    hint: 'Formula hint',
  },
  {
    key: 'criticLearningRate',
    label: 'Critic Learning Rate',
    control: 'number',
    step: 0.0001,
  },
  {
    key: 'actorLearningRate',
    label: 'Actor Learning Rate',
    control: 'number',
    step: 0.0001,
  },
  {
    key: 'discountFactor',
    label: 'Discount Factor γ',
    control: 'slider',
    min: 0,
    max: 1,
    step: 0.01,
  },
  { key: 'targetUpdateSteps', label: 'Target Update Steps', control: 'number' },
  {
    key: 'optimizer',
    label: 'Optimizer',
    control: 'select',
    options: ['Adam', 'SGD', 'RMSProp'],
  },
  {
    key: 'tau',
    label: 'Tau',
    control: 'slider',
    min: 0,
    max: 1,
    step: 0.01,
  },
]

const generateRewardSeries = () =>
  Array.from({ length: 66 }, (_, index) => {
    const episode = index * 10
    const convergence = 1 / (1 + Math.exp(-(episode - 230) / 72))
    const baseReward = -340 + convergence * 1230

    return {
      episode,
      farmReward: round(
        baseReward + Math.sin(episode / 9) * 72 + Math.cos(episode / 18) * 36,
      ),
      serverReward: round(
        baseReward - 72 + Math.cos(episode / 11) * 64 + Math.sin(episode / 27) * 22,
      ),
      smoothedFarmReward: round(-305 + convergence * 1195),
    }
  })

const generateLossSeries = () =>
  Array.from({ length: 66 }, (_, index) => {
    const episode = index * 10
    const plateau = episode >= 520 && episode <= 580 ? 0.55 : 0

    return {
      episode,
      farmActor: round(1.8 * Math.exp(-episode / 180) + 0.12, 3),
      farmCritic: round(4.7 * Math.exp(-episode / 210) + 0.16, 3),
      serverActor: round(4.9 * Math.exp(-episode / 92) + 0.1 + plateau, 3),
      serverCritic: round(4.5 * Math.exp(-episode / 190) + 0.18 + plateau, 3),
    }
  })

const generateReplaySeries = () =>
  Array.from({ length: 66 }, (_, index) => {
    const episode = index * 10
    const qValue = 78.4 * (1 - Math.exp(-episode / 125))
    const bufferFill = Math.min(100, episode * 2.6)

    return {
      episode,
      qValue: round(qValue + Math.sin(episode / 9) * 1.1, 2),
      bufferFill: round(bufferFill, 1),
    }
  })

export const dashboardTelemetry = {
  kpis: {
    episode: {
      current: 650,
      total: 1000,
      helper: '65% complete',
    },
    trainingPhase: {
      value: 'Convergence',
      helper: 'Reward slope flattening',
    },
    taskAcceptance: {
      value: 84,
      helper: 'Up from 67% at ep 100',
    },
    averageEnergyUsage: {
      value: 42.8,
      unit: 'kWh',
      helper: '300 jobs, 10 farms',
    },
  },
  phaseTimeline: {
    currentEpisode: 650,
    totalEpisodes: 1000,
    phases: [
      { id: 'warm-up', label: 'Warm-up', start: 0, end: 100, tone: 'neutral' },
      {
        id: 'exploration',
        label: 'Exploration',
        start: 100,
        end: 350,
        tone: 'warning',
      },
      {
        id: 'convergence',
        label: 'Convergence',
        start: 350,
        end: 700,
        tone: 'success',
      },
      { id: 'stable', label: 'Stable', start: 700, end: 1000, tone: 'info' },
    ],
  },
  rewardSeries: generateRewardSeries(),
  lossSeries: generateLossSeries(),
  replaySeries: generateReplaySeries(),
  averageEnergySeries: [
    { workload: '50 jobs', averageEnergy: 15.4 },
    { workload: '100 jobs', averageEnergy: 20.1 },
    { workload: '300 jobs', averageEnergy: 42.8 },
    { workload: '500 jobs', averageEnergy: 63.6 },
  ],
  taskOutcome: {
    acceptedPercent: 84,
    rejectedPercent: 16,
    wallTimeRatio: 0.96,
  },
  serverFarmUtilization: {
    optimalRate: 70,
    farms: [
      [44, 52, 60, 38, 70, 43, 57, 62, 40, 54],
      [74, 69, 82, 78, 66, 74, 70, 86, 71, 63],
      [32, 40, 37, 43, 35, 39, 34, 41, 38, 36],
      [89, 92, 80, 84, 87, 91, 85, 88, 93, 81],
      [57, 61, 54, 66, 59, 56, 63, 58, 65, 60],
      [72, 75, 68, 77, 71, 69, 74, 67, 73, 76],
      [21, 28, 24, 31, 27, 20, 22, 26, 25, 29],
      [66, 62, 69, 64, 67, 71, 63, 68, 65, 70],
      [47, 50, 45, 52, 48, 49, 46, 53, 51, 44],
      [84, 88, 81, 86, 89, 83, 87, 85, 90, 82],
    ],
  },
  diagnostics: [
    {
      id: 'critic-loss-plateau',
      tone: 'warning',
      title: 'Warning - server agent critic loss plateau (ep 520-580)',
      message:
        'Critic loss stalled at 0.82 for about 60 episodes before resuming descent. Monitor for recurrence.',
    },
    {
      id: 'replay-buffer-saturated',
      tone: 'success',
      title: 'Replay buffer saturated at ep 32',
      message:
        'Warm-up complete, with both agents receiving diverse samples.',
    },
    {
      id: 'q-value-stable',
      tone: 'success',
      title: 'No Q-value explosion',
      message: 'Max Q is 78.4, within expected range for gamma 0.9 and tau 0.1.',
    },
  ],
}

const generateMetricSeries = ({ start, drift, wave, rejectedEvery }) =>
  Array.from({ length: 50 }, (_, index) => {
    const step = index + 1
    const episode = index + 1
    const decay = start - step * drift
    const energyCost = Math.max(18, decay + Math.sin(step / 4) * wave)
    const totalEnergyCost = round(energyCost)
    const rejectedTasks = Math.floor(step / rejectedEvery)
    const stepTime = 0.18 + Math.cos(step / 6) * 0.025 + step * 0.001

    return {
      step,
      episode,
      energyCost: totalEnergyCost,
      totalEnergyCost,
      rejectedTasks,
      stepTime: round(stepTime, 3),
    }
  })

const getEnergyCost = (point) => point.totalEnergyCost ?? point.energyCost

const summarizeMetrics = (metrics) => {
  const finalPoint = metrics.at(-1)
  const totalEnergy = metrics.reduce(
    (total, point) => total + getEnergyCost(point),
    0,
  )
  const avgStepTime =
    metrics.reduce((total, point) => total + point.stepTime, 0) / metrics.length

  return {
    totalSteps: metrics.length,
    finalEnergyCost: getEnergyCost(finalPoint),
    rejectedTasks: finalPoint.rejectedTasks,
    totalEnergy: round(totalEnergy),
    avgStepTime: round(avgStepTime, 3),
  }
}

const buildRun = ({ id, type, dateTime, parameters, metrics }) => ({
  id,
  type,
  dateTime,
  parameters,
  metrics,
  summary: summarizeMetrics(metrics),
})

export const runHistory = [
  buildRun({
    id: 'RUN-2401',
    type: 'Random',
    dateTime: '2026-05-25 09:30',
    parameters: {
      ...defaultSimulationParams,
      numberOfJobs: 50,
      numberOfTasks: 600,
      numberOfServers: 5,
    },
    metrics: generateMetricSeries({
      start: 126,
      drift: 1.05,
      wave: 4.2,
      rejectedEvery: 18,
    }),
  }),
  buildRun({
    id: 'RUN-2402',
    type: 'Training',
    dateTime: '2026-05-26 14:10',
    parameters: {
      ...defaultSimulationParams,
      numberOfJobs: 300,
      numberOfTasks: 3600,
      numberOfServerFarms: 5,
      training: { ...defaultTrainingParams, networkArchitecture: 'MLP(128,128)' },
    },
    metrics: generateMetricSeries({
      start: 152,
      drift: 1.42,
      wave: 5.8,
      rejectedEvery: 16,
    }),
  }),
  buildRun({
    id: 'RUN-2403',
    type: 'Inference',
    dateTime: '2026-05-27 11:45',
    parameters: {
      ...defaultSimulationParams,
      numberOfJobs: 500,
      numberOfTasks: 9000,
      numberOfServerFarms: 10,
      selectedModel: 'maddpg-energy-saver',
    },
    metrics: generateMetricSeries({
      start: 136,
      drift: 1.58,
      wave: 3.4,
      rejectedEvery: 25,
    }),
  }),
  buildRun({
    id: 'RUN-2404',
    type: 'Training',
    dateTime: '2026-05-28 18:20',
    parameters: {
      ...defaultSimulationParams,
      numberOfJobs: 100,
      numberOfTasks: 800,
      numberOfServers: 100,
      energyCoeffAlpha: 0.65,
      training: { ...defaultTrainingParams, optimizer: 'RMSProp', tau: 0.08 },
    },
    metrics: generateMetricSeries({
      start: 118,
      drift: 0.94,
      wave: 4.9,
      rejectedEvery: 22,
    }),
  }),
]
