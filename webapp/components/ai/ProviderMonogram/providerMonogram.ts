/**
 * Two-letter mark of a provider type (provider list, dialog, chat switcher). Pure.
 */
export type ProviderMonogramTone = 'local' | 'openai' | 'anthropic' | 'google' | 'compatible' | 'default' | 'other'

const MONOGRAMS: Record<string, { text: string; tone: ProviderMonogramTone }> = {
  local: { text: 'LS', tone: 'local' },
  orgServer: { text: 'OS', tone: 'compatible' },
  openai: { text: 'OA', tone: 'openai' },
  anthropic: { text: 'An', tone: 'anthropic' },
  google: { text: 'Go', tone: 'google' },
  'openai-compatible': { text: '≈', tone: 'compatible' },
  'vercel-ai-sdk': { text: 'Ve', tone: 'other' },
  mock: { text: 'Mo', tone: 'other' },
  'arena-default': { text: 'Ar', tone: 'default' },
}

/**
 * Returns the mark of a provider type.
 * @param {string} type - Provider type, dialog type ('orgServer') or 'arena-default'.
 * @returns {{text: string, tone: ProviderMonogramTone}} The text and its colour tone.
 */
export const getProviderMonogram = (type: string): { text: string; tone: ProviderMonogramTone } =>
  MONOGRAMS[type] ?? { text: 'AI', tone: 'other' }
