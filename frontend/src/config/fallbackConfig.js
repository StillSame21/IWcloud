// Offline fallbacks used until /api/dashboard/config responds. The backend
// (ecopycsim_api/config.py) is the source of truth; keep these minimal copies
// in sync only as far as the UI needs to render before the first fetch.

export const backendStatus = {
  connected: true,
  trainingStatus: 'Idle',
}

export const fallbackRunTypes = [
  {
    id: 'random',
    label: 'Evaluation Random Algorithm',
    description: 'Evaluate EcoPyCSIM with stochastic scheduling inputs.',
  },
  {
    id: 'training',
    label: 'Train Model',
    description: 'Configure MADDPG and simulation parameters together.',
  },
  {
    id: 'inference',
    label: 'Evaluated Trained Model',
    description: 'Evaluate a saved policy model for scheduling decisions.',
  },
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
  randomSteps: 0.1,
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
    control: 'number',
    min: 0,
    step: 0.1,
    hint: 'Multiplied by Number of Jobs',
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
