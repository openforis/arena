/**
 * Card and prompt of the missing translations suggestion (missing translations).
 */
import { getLanguageLabel } from '@core/app/languages'

import { getSuggestionScopeKey } from '../detectors/designTargets'
import { buildMissingTranslationsPrompt } from '../prompts/designPrompts'
import type { SuggestionDefinition } from './types'

/**
 * Returns the name of a language in the interface language ("French", "francés").
 * @param {string} lang - Language code.
 * @param {string} uiLang - Interface language.
 * @returns {string} The name; the English name or the code when the engine has none.
 */
export const getLanguageDisplayName = (lang: string, uiLang: string): string => {
  try {
    return new Intl.DisplayNames([uiLang], { type: 'language' }).of(lang) ?? lang
  } catch {
    // an engine without language names, or a code it refuses
    return getLanguageLabel(lang) || lang
  }
}

export const missingTranslationsDefinition: SuggestionDefinition = {
  kind: 'missingTranslations',
  card: (suggestion, ctx) => ({
    key: 'missingTranslations.card',
    params: {
      count: suggestion.targets.length,
      language: getLanguageDisplayName(getSuggestionScopeKey(suggestion.id), ctx.lang),
    },
  }),
  prompt: (suggestion) => {
    const lang = getSuggestionScopeKey(suggestion.id)
    return buildMissingTranslationsPrompt({ lang, langLabel: getLanguageLabel(lang) || lang })
  },
}
