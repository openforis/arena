/**
 * Limits of the account providers a user can save: how many, and how long the values typed for one can be (the name
 * has its own limit, see providerIds). The server enforces them; the settings dialog can use them as `maxLength`.
 */
export const AI_MAX_ACCOUNT_PROVIDERS = 20

// the longest values accepted, in characters: far above what a real model id, URL or key needs
export const AI_PROVIDER_FIELD_MAX_CHARS = {
  model: 200,
  baseUrl: 2048,
  apiKey: 4096,
} as const

export type AiProviderLimitedField = keyof typeof AI_PROVIDER_FIELD_MAX_CHARS
