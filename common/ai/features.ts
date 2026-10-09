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
  | 'dataDictionary'
  | 'internalPing'

export type AiFeatureDef = {
  key: AiFeatureKey
  category: AiFeatureCategory | null
  dataClass: AiDataClass
  permission: AiFeaturePermission
  // true when the browser may call the model for this feature through POST /api/ai/model
  gateway: boolean
  // true when the browser may send tool definitions and tool calls through the gateway (assistant areas)
  tools?: boolean
}

const { chat, expressions, translation, dataDictionary, userActivity, dataQuery, assistant } = AiFeatureCategory
const { schema, data } = AiDataClass
const { loggedIn, surveyView, surveyEdit, recordListView, admin } = AiFeaturePermission

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
    permission: surveyEdit,
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
