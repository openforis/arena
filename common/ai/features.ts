/**
 * Registry of the AI features: single source of truth for the category toggle, the data class,
 * the survey permission and whether the browser may call the feature through the gateway.
 */

export const AiFeatureCategory = {
  chat: 'chat',
  expressions: 'expressions',
  translation: 'translation',
  dataDictionary: 'dataDictionary',
  userActivity: 'userActivity',
  dataQuery: 'dataQuery',
  assistant: 'assistant',
} as const

export type AiFeatureCategory = (typeof AiFeatureCategory)[keyof typeof AiFeatureCategory]

// What the prompt contains: survey structure only, or collected data / user activity (enforced from step B).
export const AiDataClass = {
  schema: 'schema',
  data: 'data',
} as const

export type AiDataClass = (typeof AiDataClass)[keyof typeof AiDataClass]

export const AiFeaturePermission = {
  loggedIn: 'loggedIn',
  surveyView: 'surveyView',
  surveyEdit: 'surveyEdit',
  recordListView: 'recordListView',
  recordCleanse: 'recordCleanse',
  admin: 'admin',
} as const

export type AiFeaturePermission = (typeof AiFeaturePermission)[keyof typeof AiFeaturePermission]

export type AiFeatureKey =
  | 'expressionGenerate'
  | 'expressionExplain'
  | 'translation'
  | 'activityLogSummary'
  | 'dataQueryGenerate'
  | 'dataQuerySummarize'
  | 'chatbot'
  | 'assistantDesign'
  | 'assistantAnalysis'
  | 'assistantCleaning'
  | 'dataDictionary'
  | 'internalPing'

export type AiFeatureDef = {
  key: AiFeatureKey
  category: AiFeatureCategory | null
  dataClass: AiDataClass
  // true: a request may declare a data class at or below `dataClass` (assistant conversations start as schema)
  variableDataClass?: boolean
  permission: AiFeaturePermission
  // true when the browser may call the model for this feature through POST /api/ai/model
  gateway: boolean
  // true when the browser may send tool definitions and tool calls through the gateway (assistant areas)
  tools?: boolean
}

const { chat, expressions, translation, dataDictionary, userActivity, dataQuery, assistant } = AiFeatureCategory
const { schema, data } = AiDataClass
const { loggedIn, surveyView, surveyEdit, recordListView, recordCleanse, admin } = AiFeaturePermission

export const AiFeatures: Record<AiFeatureKey, AiFeatureDef> = {
  expressionGenerate: {
    key: 'expressionGenerate',
    category: expressions,
    dataClass: schema,
    permission: surveyEdit,
    gateway: true,
  },
  expressionExplain: {
    key: 'expressionExplain',
    category: expressions,
    dataClass: schema,
    permission: surveyEdit,
    gateway: true,
  },
  translation: { key: 'translation', category: translation, dataClass: schema, permission: surveyEdit, gateway: true },
  activityLogSummary: {
    key: 'activityLogSummary',
    category: userActivity,
    dataClass: data,
    permission: surveyView,
    gateway: true,
  },
  dataQueryGenerate: {
    key: 'dataQueryGenerate',
    category: dataQuery,
    dataClass: schema,
    permission: recordListView,
    gateway: true,
  },
  dataQuerySummarize: {
    key: 'dataQuerySummarize',
    category: dataQuery,
    dataClass: schema,
    permission: recordListView,
    gateway: true,
  },
  // Help area of the assistant: no survey content, only the handbook tools
  chatbot: { key: 'chatbot', category: chat, dataClass: schema, permission: loggedIn, gateway: true, tools: true },
  // Design area of the assistant: reads the draft survey, proposes change sets
  assistantDesign: {
    key: 'assistantDesign',
    category: assistant,
    dataClass: schema,
    variableDataClass: true,
    permission: surveyEdit,
    gateway: true,
    tools: true,
  },
  // Analysis area of the assistant: explores collected data through the Explorer endpoints
  assistantAnalysis: {
    key: 'assistantAnalysis',
    category: assistant,
    dataClass: data,
    variableDataClass: true,
    permission: recordListView,
    gateway: true,
    tools: true,
  },
  // the cleaning assistant reads and edits record values: data from the first message
  assistantCleaning: {
    key: 'assistantCleaning',
    category: assistant,
    dataClass: data,
    variableDataClass: false,
    permission: recordCleanse,
    gateway: true,
    tools: true,
  },
  // server jobs
  dataDictionary: {
    key: 'dataDictionary',
    category: dataDictionary,
    dataClass: schema,
    permission: surveyView,
    gateway: false,
  },
  internalPing: { key: 'internalPing', category: null, dataClass: schema, permission: admin, gateway: false },
}

/**
 * Returns the definition of the given feature.
 * @param {string} key - Feature key (untrusted input allowed).
 * @returns {AiFeatureDef|null} The definition, or null when the key is unknown.
 */
export const getAiFeature = (key: string): AiFeatureDef | null =>
  typeof key === 'string' && Object.hasOwn(AiFeatures, key) ? AiFeatures[key as AiFeatureKey] : null

/**
 * Returns true when the browser may call the model for the given feature through the gateway.
 * @param {string} key - Feature key.
 * @returns {boolean} Whether the feature is a gateway feature.
 */
export const isGatewayFeature = (key: string): boolean => getAiFeature(key)?.gateway === true

/**
 * Returns true when at least one feature of the category is not disabled (UI entry points of a category whose
 * features are all disabled by the server are hidden).
 * @param {string} category - Feature category.
 * @param {string[]} disabledFeatures - Feature keys disabled by the server.
 * @returns {boolean} Whether the category can be used.
 */
export const isAiCategoryAvailable = (category: string, disabledFeatures: string[]): boolean =>
  Object.values(AiFeatures).some((feature) => feature.category === category && !disabledFeatures.includes(feature.key))

const dataClassLevels: Record<AiDataClass, number> = { schema: 0, data: 1 }

/**
 * Returns true when the value is a known data class.
 * @param {unknown} value - Value to check (untrusted input allowed).
 * @returns {boolean} Whether the value is a data class.
 */
export const isAiDataClass = (value: unknown): value is AiDataClass =>
  typeof value === 'string' && Object.hasOwn(dataClassLevels, value)

/**
 * Returns the level of a data class (schema 0, data 1).
 * @param {AiDataClass} dataClass - The data class.
 * @returns {number} The level.
 */
export const getAiDataClassLevel = (dataClass: AiDataClass): number => dataClassLevels[dataClass]

/**
 * Returns the highest of the given data classes.
 * @param {...AiDataClass} dataClasses - Data classes.
 * @returns {AiDataClass} The highest class, schema when none is given.
 */
export const getMaxAiDataClass = (...dataClasses: AiDataClass[]): AiDataClass =>
  dataClasses.reduce<AiDataClass>(
    (max, dataClass) => (getAiDataClassLevel(dataClass) > getAiDataClassLevel(max) ? dataClass : max),
    AiDataClass.schema
  )

/**
 * Returns true when a request for the feature may declare the given data class.
 * @param {object} params - Parameters.
 * @param {AiFeatureDef} params.featureDef - The feature.
 * @param {unknown} params.dataClass - The declared class (untrusted input allowed).
 * @returns {boolean} Whether the declared class is accepted.
 */
export const isDeclaredDataClassAllowed = ({
  featureDef,
  dataClass,
}: {
  featureDef: AiFeatureDef
  dataClass: unknown
}): boolean => {
  if (!isAiDataClass(dataClass)) return false
  if (featureDef.variableDataClass) return getAiDataClassLevel(dataClass) <= getAiDataClassLevel(featureDef.dataClass)
  return dataClass === featureDef.dataClass
}

/**
 * Returns the lowest data class a request for the feature can declare.
 * @param {string} key - Feature key (untrusted input allowed).
 * @returns {AiDataClass} Schema for variable features, otherwise the feature's class; data (fail closed) for an unknown key.
 */
export const getAiFeatureMinDataClass = (key: AiFeatureKey | string): AiDataClass => {
  const featureDef = getAiFeature(key)
  if (!featureDef) return AiDataClass.data
  return featureDef.variableDataClass ? AiDataClass.schema : featureDef.dataClass
}
