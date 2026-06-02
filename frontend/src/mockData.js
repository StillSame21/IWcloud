const round = (value, digits = 2) => Number(value.toFixed(digits))

export const backendStatus = {
  connected: true,
  trainingStatus: 'Idle',
}

export const activePreset = 'Normal'

export const savedModels = [
  { id: 'maddpg-normal-v1', name: 'Model 1' },
  { id: 'maddpg-balanced-v2', name: 'Model 2' },
  { id: 'maddpg-energy-saver', name: 'Model 3' },
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
    jobAcceptance: {
      value: 84,
      helper: 'Up from 67% at ep 100',
    },
    averageEnergyUsage: {
      value: 42.8,
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
  jobOutcome: {
    acceptedPercent: 84,
    rejectedPercent: 16,
    wallTimeRatio: 0.96,
  },
  serverFarmUtilization: {
    optimalRate: 0.7,
    farms: [
      [0.44, 0.52, 0.6, 0.38, 0.7, 0.43, 0.57, 0.62, 0.4, 0.54],
      [0.74, 0.69, 0.82, 0.78, 0.66, 0.74, 0.7, 0.86, 0.71, 0.63],
      [0.32, 0.4, 0.37, 0.43, 0.35, 0.39, 0.34, 0.41, 0.38, 0.36],
      [0.89, 0.92, 0.8, 0.84, 0.87, 0.91, 0.85, 0.88, 0.93, 0.81],
      [0.57, 0.61, 0.54, 0.66, 0.59, 0.56, 0.63, 0.58, 0.65, 0.6],
      [0.72, 0.75, 0.68, 0.77, 0.71, 0.69, 0.74, 0.67, 0.73, 0.76],
      [0.21, 0.28, 0.24, 0.31, 0.27, 0.2, 0.22, 0.26, 0.25, 0.29],
      [0.66, 0.62, 0.69, 0.64, 0.67, 0.71, 0.63, 0.68, 0.65, 0.7],
      [0.47, 0.5, 0.45, 0.52, 0.48, 0.49, 0.46, 0.53, 0.51, 0.44],
      [0.84, 0.88, 0.81, 0.86, 0.89, 0.83, 0.87, 0.85, 0.9, 0.82],
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
    const rejectedJobs = Math.floor(step / rejectedEvery)
    const rejectedTasks = rejectedJobs
    const stepTime = 0.18 + Math.cos(step / 6) * 0.025 + step * 0.001

    return {
      step,
      episode,
      energyCost: totalEnergyCost,
      totalEnergyCost,
      rejectedJobs,
      rejectedTasks,
      stepTime: round(stepTime, 3),
    }
  })

const generateTrainingRewardSeries = ({ rewardOffset = 0, totalEpisodes }) =>
  Array.from({ length: 51 }, (_, index) => {
    const episode = index * (totalEpisodes / 50)
    const convergence = 1 / (1 + Math.exp(-(episode - 320) / 90))
    const reward =
      -430 + convergence * (1280 + rewardOffset) + Math.sin(episode / 44) * 42

    return {
      episode: round(episode, 0),
      reward: round(reward),
    }
  })

const generateTrainingLossSeries = ({ lossScale = 1, totalEpisodes }) =>
  Array.from({ length: 51 }, (_, index) => {
    const episode = index * (totalEpisodes / 50)
    const actorLoss = (1.7 * Math.exp(-episode / 230) + 0.08) * lossScale
    const criticLoss = (4.9 * Math.exp(-episode / 260) + 0.14) * lossScale

    return {
      episode: round(episode, 0),
      actorLoss: round(actorLoss, 3),
      criticLoss: round(criticLoss, 3),
    }
  })

const generateTrainingReplaySeries = ({ qOffset = 0, totalEpisodes }) =>
  Array.from({ length: 51 }, (_, index) => {
    const episode = index * (totalEpisodes / 50)
    const qValue = 82 * (1 - Math.exp(-episode / 180)) + qOffset
    const bufferFill = Math.min(100, episode / 7.5)

    return {
      episode: round(episode, 0),
      qValue: round(qValue + Math.sin(episode / 48) * 1.4, 2),
      bufferFill: round(bufferFill, 1),
    }
  })

const generateAverageEnergyByJobLoad = ({ baseEnergy = 10, energyFactor = 0.11 }) =>
  [50, 100, 300, 500].map((jobs) => ({
    jobs,
    workload: `${jobs} jobs`,
    averageEnergy: round(baseEnergy + jobs * energyFactor + Math.sin(jobs / 80) * 1.2),
  }))

const generateWallTimeByJobLoad = ({
  baseWallTime = 0.2,
  wallTimeFactor = 0.004,
}) =>
  [50, 100, 300, 500].map((jobs) => ({
    jobs,
    workload: `${jobs} jobs`,
    averageWallTime: round(
      baseWallTime + jobs * wallTimeFactor + Math.cos(jobs / 90) * 0.08,
      3,
    ),
  }))

const generateServerFarmAverageCpu = ({
  cpuBase = 0.62,
  farmCount = defaultSimulationParams.numberOfServerFarms,
  spread = 0.09,
}) =>
  Array.from({ length: farmCount }, (_, index) => ({
    farm: `Farm ${index + 1}`,
    averageCpu: round(cpuBase + Math.sin((index + 1) * 1.4) * spread, 2),
  }))

const buildTrainingResults = ({
  cpuBase,
  currentEpisode = defaultTrainingParams.episodes,
  energyFactor,
  farmCount,
  lossScale,
  qOffset,
  rewardOffset,
  totalEpisodes = defaultTrainingParams.episodes,
}) => ({
  episode: {
    current: currentEpisode,
    total: totalEpisodes,
  },
  rewardSeries: generateTrainingRewardSeries({
    rewardOffset,
    totalEpisodes,
  }),
  lossSeries: generateTrainingLossSeries({
    lossScale,
    totalEpisodes,
  }),
  replaySeries: generateTrainingReplaySeries({
    qOffset,
    totalEpisodes,
  }),
  averageEnergyByJobLoad: generateAverageEnergyByJobLoad({
    energyFactor,
  }),
  serverFarmAverageCpu: generateServerFarmAverageCpu({
    cpuBase,
    farmCount,
  }),
})

const buildEvaluationResults = ({
  cpuBase,
  currentEpisode = 50,
  energyFactor,
  farmCount,
  totalEpisodes = 50,
  wallTimeBase,
  wallTimeFactor,
}) => ({
  episode: {
    current: currentEpisode,
    total: totalEpisodes,
  },
  averageEnergyByJobLoad: generateAverageEnergyByJobLoad({
    energyFactor,
  }),
  wallTimeByJobLoad: generateWallTimeByJobLoad({
    baseWallTime: wallTimeBase,
    wallTimeFactor,
  }),
  serverFarmAverageCpu: generateServerFarmAverageCpu({
    cpuBase,
    farmCount,
  }),
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
    rejectedJobs: finalPoint.rejectedJobs ?? finalPoint.rejectedTasks,
    rejectedTasks: finalPoint.rejectedTasks,
    totalEnergy: round(totalEnergy),
    avgStepTime: round(avgStepTime, 3),
  }
}

const buildRun = ({
  displayName,
  id,
  type,
  dateTime,
  evaluationResults,
  parameters,
  metrics,
  trainingResults,
}) => ({
  id,
  ...(displayName ? { displayName } : {}),
  type,
  dateTime,
  parameters,
  metrics,
  summary: summarizeMetrics(metrics),
  evaluationResults,
  trainingResults,
})

export const trainingModelExamples = [
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
    trainingResults: buildTrainingResults({
      cpuBase: 0.68,
      energyFactor: 0.112,
      farmCount: 5,
      lossScale: 1,
      qOffset: 0,
      rewardOffset: 20,
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
    trainingResults: buildTrainingResults({
      cpuBase: 0.57,
      energyFactor: 0.094,
      farmCount: 2,
      lossScale: 0.86,
      qOffset: 4.5,
      rewardOffset: 95,
    }),
  }),
]

export const evaluationComparisonExamples = [
  buildRun({
    id: 'RUN-2401',
    displayName: 'Random Evaluation-1',
    type: 'Evaluation Random Algorithm',
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
    evaluationResults: buildEvaluationResults({
      cpuBase: 0.61,
      energyFactor: 0.126,
      farmCount: 2,
      wallTimeBase: 0.26,
      wallTimeFactor: 0.0062,
    }),
  }),
  buildRun({
    id: 'RUN-2403',
    displayName: 'MADDPG Evaluation-1',
    type: 'Evaluated Trained Model',
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
    evaluationResults: buildEvaluationResults({
      cpuBase: 0.54,
      energyFactor: 0.087,
      farmCount: 10,
      wallTimeBase: 0.18,
      wallTimeFactor: 0.0041,
    }),
  }),
]

export const runHistory = [
  evaluationComparisonExamples[0],
  ...trainingModelExamples,
  evaluationComparisonExamples[1],
]
