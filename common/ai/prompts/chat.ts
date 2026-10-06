import { getLanguageLabel } from '@core/app/languages'
import { defaultLanguage, supportedLanguages } from '@core/i18n/i18nFactory'

export const CHAT_SYSTEM_PROMPT =
  'You are the Arena documentation assistant. Answer concisely and accurately based on what you know about the ' +
  'Open Foris Arena platform (a cloud platform for forest-inventory survey design, data collection, and ' +
  'analysis). If a question is outside that scope, say so briefly.'

/**
 * Builds the chatbot system prompt, asking the model to answer in the given language.
 * Unsupported values fall back to the default language, so no free text reaches the prompt.
 * @param {string} [language] - Language code chosen in the chat panel.
 * @returns {string} The system prompt.
 */
export const buildChatSystemPrompt = (language?: string): string => {
  const lang = supportedLanguages.includes(language) ? language : defaultLanguage
  const label = getLanguageLabel(lang) || 'English'
  return `${CHAT_SYSTEM_PROMPT} Always respond in ${label}, regardless of the language of the question.`
}
