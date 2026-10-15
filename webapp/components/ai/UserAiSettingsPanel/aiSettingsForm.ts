/**
 * Form model of the account part of the AI settings panel: the access level and the feature switches, saved with the
 * profile's Save (providers save from their own dialog and menu). Pure.
 */
import {
  type AiAccessLevel,
  isCategoryWithinAccessLevel,
  raiseAccessLevelToggles,
  resolveAiAccessLevel,
} from '@common/ai/accessLevel'
import { AiFeatureCategory, isAiCategoryOnByDefault } from '@common/ai/features'

import type { AiAdminDefault, AiPublicProvider } from '@webapp/ai/engines/providerEntries'

export type FeatureCategory = AiFeatureCategory

export const FEATURE_CATEGORIES: FeatureCategory[] = Object.values(AiFeatureCategory)

export type FeatureToggles = Record<FeatureCategory, boolean>

/**
 * Returns the category switches of a user who set none: off, except the categories on by default.
 * @returns {FeatureToggles} The switches.
 */
export const defaultFeatureToggles = (): FeatureToggles =>
  Object.fromEntries(
    FEATURE_CATEGORIES.map((category) => [category, isAiCategoryOnByDefault(category)])
  ) as FeatureToggles

/**
 * Returns a loaded switch: a stored boolean, else the category default.
 * @param {unknown} value - Stored value.
 * @param {FeatureCategory} category - Category.
 * @returns {boolean} The switch.
 */
const toToggle = (value: unknown, category: FeatureCategory): boolean =>
  typeof value === 'boolean' ? value : isAiCategoryOnByDefault(category)

// GET /api/ai/settings: the fields the panel reads
export type AiSettings = {
  accessLevel?: number
  featuresEnabled?: boolean
  featureToggles?: Partial<FeatureToggles>
  aiFeaturesDisabled?: boolean
  adminDefault?: AiAdminDefault | null
  orgHostedBaseUrls?: string[]
  encryptionConfigured?: boolean
  // test servers only: the dialog offers the mock type
  mockProviderEnabled?: boolean
  defaultProviderId?: string
  providers?: AiPublicProvider[]
}

export type SettingsUpdate = {
  accessLevel: AiAccessLevel
  featuresEnabled: boolean
  featureToggles: FeatureToggles
}

export type FormState = {
  accessLevel: AiAccessLevel
  featureToggles: FeatureToggles
}

/**
 * Returns the form before the settings are loaded.
 * @returns {FormState} The form.
 */
export const createEmptyForm = (): FormState => ({
  accessLevel: 0,
  featureToggles: defaultFeatureToggles(),
})

/**
 * Returns the body of PUT /api/ai/settings for the form (no provider field: the server keeps the providers).
 * @param {FormState} form - Form.
 * @returns {SettingsUpdate} The update.
 */
export const buildSettingsUpdate = (form: FormState): SettingsUpdate => ({
  accessLevel: form.accessLevel,
  // the server derives it anyway, but readers of the response see it at once
  featuresEnabled: form.accessLevel > 0,
  featureToggles: form.featureToggles,
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
 * Returns the form for the loaded settings.
 * @param {AiSettings} data - GET /api/ai/settings response.
 * @returns {FormState} The form.
 */
export const settingsToForm = (data: AiSettings): FormState => {
  // known categories only: a stored legacy `assistant` is never sent back
  const featureToggles = Object.fromEntries(
    FEATURE_CATEGORIES.map((category) => [category, toToggle(data.featureToggles?.[category], category)])
  ) as FeatureToggles
  return {
    accessLevel: resolveAiAccessLevel({
      accessLevel: data.accessLevel,
      featuresEnabled: !!data.featuresEnabled,
      featureToggles,
    }),
    featureToggles,
  }
}

/**
 * Returns the form with a new access level; a higher level switches on the features it adds.
 * @param {FormState} form - Form.
 * @param {AiAccessLevel} accessLevel - New level.
 * @returns {FormState} The new form.
 */
export const withAccessLevel = (form: FormState, accessLevel: AiAccessLevel): FormState => ({
  ...form,
  accessLevel,
  featureToggles: raiseAccessLevelToggles({ from: form.accessLevel, to: accessLevel, toggles: form.featureToggles }),
})

/**
 * Returns how many features of the level are on ("8 of 10 features on").
 * @param {object} params - Parameters.
 * @param {AiAccessLevel} params.accessLevel - Level.
 * @param {FeatureToggles} params.featureToggles - Switches.
 * @returns {{on: number, total: number}} The counts.
 */
export const countAccessLevelFeatures = ({
  accessLevel,
  featureToggles,
}: {
  accessLevel: AiAccessLevel
  featureToggles: FeatureToggles
}): { on: number; total: number } => {
  const within = FEATURE_CATEGORIES.filter((category) => isCategoryWithinAccessLevel(category, accessLevel))
  return { on: within.filter((category) => featureToggles[category]).length, total: within.length }
}

/**
 * Returns the text of an error the settings UI shows (a failed API call, a failed provider test): the appErrors text of
 * its key, else its message, else "Unknown error". The one place that turns such an error into text.
 * @param {object} params - Parameters.
 * @param {*} [params.key] - Error key of the response (with or without the `appErrors:` prefix).
 * @param {Record<string, unknown>} [params.params] - Parameters of the key.
 * @param {string} [params.message] - Message to show when there is no key.
 * @param {TFunction} params.t - Translation function.
 * @returns {string} The text.
 */
export const getErrorText = ({
  key,
  params,
  message,
  t,
}: {
  key?: unknown
  params?: Record<string, unknown>
  message?: string
  t: TFunction
}): string => {
  const errorKey = typeof key === 'string' ? key.replace(/^appErrors:/, '') : ''
  // the params hold URLs and model ids: no HTML escaping
  if (errorKey) return t(`appErrors:${errorKey}`, { ...params, interpolation: { escapeValue: false } })
  return message || t('userAiSettings:unknownError')
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
  return getErrorText({ key: data?.key, params: data?.params, message: data?.error || error?.message, t })
}
