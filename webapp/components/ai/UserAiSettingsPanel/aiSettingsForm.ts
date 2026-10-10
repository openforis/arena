/**
 * Form model of the account part of the AI settings panel (switches and cloud provider). Pure.
 */
import { AiProvider } from '@common/ai/aiProvider'
import { AiFeatureCategory } from '@common/ai/features'
import type { AiHostingClass } from '@common/ai/policy'

export type FeatureCategory = AiFeatureCategory

export const FEATURE_CATEGORIES: FeatureCategory[] = Object.values(AiFeatureCategory)

export type FeatureToggles = Record<FeatureCategory, boolean>

/**
 * Returns the category switches, all off.
 * @returns {FeatureToggles} The switches.
 */
export const defaultFeatureToggles = (): FeatureToggles =>
  Object.fromEntries(FEATURE_CATEGORIES.map((category) => [category, false])) as FeatureToggles

export const OTHER_MODEL_VALUE = '__other__'

// UI-only provider meaning "the admin-configured provider": saved as `enabled: false`
export const DEFAULT_PROVIDER_VALUE = 'default'

export type ProviderSpec = {
  value: string
  isDefault?: boolean
  requiresBaseUrl: boolean
  requiresApiKey: boolean
  supportsModelList: boolean
}

export const PROVIDERS: ProviderSpec[] = [
  {
    value: DEFAULT_PROVIDER_VALUE,
    isDefault: true,
    requiresBaseUrl: false,
    requiresApiKey: false,
    supportsModelList: false,
  },
  { value: AiProvider.openai, requiresBaseUrl: false, requiresApiKey: true, supportsModelList: true },
  { value: AiProvider.anthropic, requiresBaseUrl: false, requiresApiKey: true, supportsModelList: true },
  { value: AiProvider.google, requiresBaseUrl: false, requiresApiKey: true, supportsModelList: true },
  { value: AiProvider.openaiCompatible, requiresBaseUrl: true, requiresApiKey: false, supportsModelList: true },
  { value: AiProvider.vercelAiSdk, requiresBaseUrl: true, requiresApiKey: false, supportsModelList: false },
]

export const BASE_URL_PLACEHOLDERS: Record<string, string> = {
  [AiProvider.openaiCompatible]: 'https://openrouter.ai/api/v1',
  [AiProvider.vercelAiSdk]: 'https://your-app.example.com/api/chat',
}

export const MODEL_PLACEHOLDERS: Record<string, string> = {
  [AiProvider.openai]: 'gpt-4o-mini',
  [AiProvider.anthropic]: 'claude-haiku-4-5',
  [AiProvider.google]: 'gemini-2.0-flash',
  [AiProvider.openaiCompatible]: 'llama3.3:70b',
}

// the instance default provider (GET /api/ai/settings → adminDefault)
export type AdminDefault = { provider: string; model: string | null; hostingClass: AiHostingClass | null }

export type AiSettings = {
  featuresEnabled?: boolean
  featureToggles?: Partial<FeatureToggles>
  enabled?: boolean
  provider?: string | null
  model?: string | null
  baseUrl?: string | null
  hasApiKey?: boolean
  apiKeyReadable?: boolean
  lastTestOk?: boolean | null
  aiFeaturesDisabled?: boolean
  effectiveSource?: string | null
  effectiveProvider?: string | null
  effectiveModel?: string | null
  hostingClass?: AiHostingClass | null
  adminDefault?: AdminDefault | null
  orgHostedBaseUrls?: string[]
  encryptionConfigured?: boolean
}

export type AiModel = {
  id: string
  description?: string
}

export type TestResult = {
  ok: boolean
  latencyMs?: number
  errorMessage?: string
  errorKey?: string
  errorParams?: Record<string, unknown>
}

export type SettingsUpdate = {
  featuresEnabled: boolean
  featureToggles: FeatureToggles
  enabled: boolean
  provider?: string
  model?: string | null
  baseUrl?: string | null
  apiKey?: string
}

export type FormState = {
  featuresEnabled: boolean
  featureToggles: FeatureToggles
  provider: string
  model: string
  baseUrl: string
  apiKey: string
  apiKeyDirty: boolean
  apiKeyVersion: number
  modelFreeText: boolean
}

/**
 * Returns the form before the settings are loaded.
 * @returns {FormState} The form.
 */
export const createEmptyForm = (): FormState => ({
  featuresEnabled: false,
  featureToggles: defaultFeatureToggles(),
  provider: DEFAULT_PROVIDER_VALUE,
  model: '',
  baseUrl: '',
  apiKey: '',
  apiKeyDirty: false,
  apiKeyVersion: 0,
  modelFreeText: false,
})

/**
 * Returns the key of a model list request: the list is fetched again only when it changes.
 * @param {object} params - Parameters.
 * @param {string} params.provider - Provider.
 * @param {string} params.baseUrl - Base URL.
 * @param {boolean} params.apiKeyDirty - An API key was typed.
 * @param {number} params.apiKeyVersion - Edit counter of the typed key.
 * @param {boolean} params.hasSavedApiKey - A key is stored.
 * @returns {string} The key.
 */
export const buildModelsKey = ({
  provider,
  baseUrl,
  apiKeyDirty,
  apiKeyVersion,
  hasSavedApiKey,
}: {
  provider: string
  baseUrl: string
  apiKeyDirty: boolean
  apiKeyVersion: number
  hasSavedApiKey: boolean
}): string => {
  const savedKeyFlag = hasSavedApiKey ? '1' : '0'
  const apiKeySegment = apiKeyDirty ? `dirty:v${apiKeyVersion}` : `saved:${savedKeyFlag}`
  return [provider, baseUrl || '', apiKeySegment].join('|')
}

/**
 * Returns the body of PUT /api/ai/settings for the form.
 * @param {object} params - Parameters.
 * @param {FormState} params.form - Form.
 * @param {ProviderSpec} params.spec - Spec of the chosen provider.
 * @returns {SettingsUpdate} The update.
 */
export const buildSettingsUpdate = ({ form, spec }: { form: FormState; spec: ProviderSpec }): SettingsUpdate => {
  const base = { featuresEnabled: form.featuresEnabled, featureToggles: form.featureToggles }
  // "Arena default": enabled false, so the server falls through to the admin default
  if (spec.isDefault) return { ...base, enabled: false }
  return {
    ...base,
    enabled: true,
    provider: form.provider,
    model: spec.supportsModelList ? form.model : null,
    baseUrl: spec.requiresBaseUrl ? form.baseUrl : null,
    ...(form.apiKeyDirty ? { apiKey: form.apiKey } : {}),
  }
}

/**
 * Returns the form after "Remove my provider": the provider fields are reset, the switches (saved or not) stay.
 * @param {FormState} form - Form.
 * @returns {FormState} The new form.
 */
export const withoutCloudProvider = (form: FormState): FormState => ({
  ...form,
  provider: DEFAULT_PROVIDER_VALUE,
  model: '',
  baseUrl: '',
  apiKey: '',
  apiKeyDirty: false,
  modelFreeText: false,
})
