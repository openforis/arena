/**
 * Form model of the account part of the AI settings panel (switches and cloud provider). Pure.
 */
import { AiProvider } from '@common/ai/aiProvider'
import { AiFeatureCategory } from '@common/ai/features'
import { isLocalOrPrivateUrl, isOrgHostedUrl } from '@common/ai/localServerAddress'
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

export type TFunction = (key: string, params?: Record<string, unknown>) => string

/**
 * Returns a translation function bound to the i18n instance (the helpers here take a plain function).
 * @param {object} i18n - i18n instance (useI18n()).
 * @returns {TFunction} The translation function.
 */
export const toT =
  (i18n: { t: (key: any, params?: any) => unknown }): TFunction =>
  (key, params) =>
    // i18next's own return type is wider than string
    String(i18n.t(key, params ?? {}))
/**
 * Returns the spec of a provider ("Arena default" for an unknown one).
 * @param {string} provider - Provider value.
 * @returns {ProviderSpec} The spec.
 */
export const getProviderSpec = (provider: string): ProviderSpec =>
  PROVIDERS.find((spec) => spec.value === provider) ?? PROVIDERS[0]

/**
 * Returns the form for the loaded settings.
 * @param {AiSettings} data - GET /api/ai/settings response.
 * @returns {FormState} The form.
 */
export const settingsToForm = (data: AiSettings): FormState => ({
  ...createEmptyForm(),
  featuresEnabled: !!data.featuresEnabled,
  // known categories only: a stored legacy `assistant` is never sent back
  featureToggles: Object.fromEntries(
    FEATURE_CATEGORIES.map((category) => [category, !!data.featureToggles?.[category]])
  ) as FeatureToggles,
  // an active personal provider (`enabled`) is shown; otherwise "Arena default"
  provider: data.enabled && data.provider ? data.provider : DEFAULT_PROVIDER_VALUE,
  model: data.model || '',
  baseUrl: data.baseUrl || '',
})

/**
 * Returns true when the server has an API key to use: the typed one, else the stored one.
 * @param {object} params - Parameters.
 * @param {FormState} params.form - Form.
 * @param {AiSettings|null} params.settings - Loaded settings.
 * @returns {boolean} True when a key is available.
 */
export const hasCloudApiKey = ({ form, settings }: { form: FormState; settings: AiSettings | null }): boolean =>
  form.apiKeyDirty ? form.apiKey.trim().length > 0 : !!settings?.hasApiKey

/**
 * Returns true when the cloud Base URL points to this computer or the local network (and is not an org server).
 * @param {object} params - Parameters.
 * @param {ProviderSpec} params.spec - Provider spec.
 * @param {string} params.baseUrl - Typed Base URL.
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @returns {boolean} True when the hint to the local server shows.
 */
export const shouldShowLocalUrlHint = ({
  spec,
  baseUrl,
  allowlist,
}: {
  spec: ProviderSpec
  baseUrl: string
  allowlist: string[]
}): boolean => spec.requiresBaseUrl && isLocalOrPrivateUrl(baseUrl) && !isOrgHostedUrl(baseUrl, allowlist)

/**
 * Returns true when the model list can be requested (the server refuses local URLs, so they are skipped).
 * @param {object} params - Parameters.
 * @param {ProviderSpec} params.spec - Provider spec.
 * @param {FormState} params.form - Form.
 * @param {AiSettings|null} params.settings - Loaded settings.
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @returns {boolean} True when the list can be fetched.
 */
export const canListModels = ({
  spec,
  form,
  settings,
  allowlist,
}: {
  spec: ProviderSpec
  form: FormState
  settings: AiSettings | null
  allowlist: string[]
}): boolean => {
  if (!spec.supportsModelList) return false
  if (spec.requiresBaseUrl) {
    if (!form.baseUrl.trim()) return false
    if (shouldShowLocalUrlHint({ spec, baseUrl: form.baseUrl, allowlist })) return false
  }
  return !spec.requiresApiKey || hasCloudApiKey({ form, settings })
}

/**
 * Returns the key of the draft a cloud Test ran on; the key edit counter stands for the typed key.
 * @param {FormState} form - Tested form.
 * @returns {string} The key.
 */
export const buildCloudTestKey = (form: FormState): string =>
  [form.provider, form.baseUrl.trim(), form.model, `k${form.apiKeyVersion}`].join('|')

export type CloudTestState = { key: string; result: TestResult }

/**
 * Returns the cloud Test result when it was run on the current draft.
 * @param {object} params - Parameters.
 * @param {CloudTestState|null} params.test - Last Test.
 * @param {FormState} params.form - Form now.
 * @returns {TestResult|null} The result, or null after any edit.
 */
export const getCurrentCloudTestResult = ({
  test,
  form,
}: {
  test: CloudTestState | null
  form: FormState
}): TestResult | null => (test && test.key === buildCloudTestKey(form) ? test.result : null)

/**
 * Returns the model to keep after the list was fetched.
 * @param {object} params - Parameters.
 * @param {string} params.model - Model in the form.
 * @param {AiModel[]} params.models - Listed models.
 * @returns {string} The model when listed, else the first listed (unchanged for an empty list).
 */
export const chooseListedModel = ({ model, models }: { model: string; models: AiModel[] }): string =>
  models.some((listed) => listed.id === model) ? model : (models[0]?.id ?? model)

/**
 * Returns the body of POST /api/ai/settings/test for the draft (the stored key is used when none was typed).
 * @param {object} params - Parameters.
 * @param {FormState} params.form - Form.
 * @param {ProviderSpec} params.spec - Provider spec.
 * @returns {object} The draft to test.
 */
export const buildTestDraft = ({ form, spec }: { form: FormState; spec: ProviderSpec }) => ({
  provider: form.provider,
  model: spec.supportsModelList ? form.model : undefined,
  baseUrl: spec.requiresBaseUrl ? form.baseUrl : undefined,
  apiKey: form.apiKeyDirty ? form.apiKey : undefined,
})

/**
 * Returns true when the cloud part of the form equals the saved settings.
 * @param {object} params - Parameters.
 * @param {FormState} params.form - Form.
 * @param {AiSettings|null} params.settings - Saved settings.
 * @returns {boolean} True when nothing cloud-related was edited.
 */
export const isCloudDraftSaved = ({ form, settings }: { form: FormState; settings: AiSettings | null }): boolean => {
  if (!settings || form.apiKeyDirty) return false
  if (form.provider === DEFAULT_PROVIDER_VALUE) return !settings.enabled
  return (
    !!settings.enabled &&
    settings.provider === form.provider &&
    (settings.model || '') === form.model &&
    (settings.baseUrl || '') === form.baseUrl
  )
}

/**
 * Returns the text of a cloud Test result; a refused local URL gets the hint to the local server.
 * @param {object} params - Parameters.
 * @param {TestResult} params.result - Result.
 * @param {ProviderSpec} params.spec - Provider spec.
 * @param {string} params.baseUrl - Tested Base URL.
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @param {TFunction} params.t - Translation function.
 * @returns {string} The text.
 */
export const getCloudTestMessage = ({
  result,
  spec,
  baseUrl,
  allowlist,
  t,
}: {
  result: TestResult
  spec: ProviderSpec
  baseUrl: string
  allowlist: string[]
  t: TFunction
}): string => {
  if (result.ok) return t('userAiSettings:cloud.testOk', { latencyMs: result.latencyMs })
  // server keys may already carry the namespace prefix
  const errorKey = (result.errorKey ?? '').replace(/^appErrors:/, '')
  if (errorKey === 'aiBaseUrlNotAllowed' && shouldShowLocalUrlHint({ spec, baseUrl, allowlist })) {
    return t('userAiSettings:cloud.localUrlHint')
  }
  // the params hold URLs and model ids: no HTML escaping
  if (errorKey) return t(`appErrors:${errorKey}`, { ...result.errorParams, interpolation: { escapeValue: false } })
  return result.errorMessage || t('appErrors:aiProviderUnavailable')
}

/**
 * Returns the text of a failed API call.
 * @param {object} params - Parameters.
 * @param {*} params.error - Axios error.
 * @param {TFunction} params.t - Translation function.
 * @returns {string} The appErrors text when the response has a key, else the error message.
 */
export const getApiErrorMessage = ({ error, t }: { error: any; t: TFunction }): string => {
  const data = error?.response?.data
  const errorKey = typeof data?.key === 'string' ? data.key.replace(/^appErrors:/, '') : ''
  if (errorKey) return t(`appErrors:${errorKey}`, { ...data.params, interpolation: { escapeValue: false } })
  return data?.error || error?.message || 'unknown'
}
