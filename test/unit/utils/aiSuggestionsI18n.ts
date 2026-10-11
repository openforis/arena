/**
 * Helpers shared by the i18n tests of the AI assistant suggestion card texts (namespace aiSuggestions).
 */
import en from '@core/i18n/resources/en'
import es from '@core/i18n/resources/es'
import fr from '@core/i18n/resources/fr'
import ja from '@core/i18n/resources/ja'
import mn from '@core/i18n/resources/mn'
import pt from '@core/i18n/resources/pt'
import ru from '@core/i18n/resources/ru'

export const RESOURCES: Record<string, any> = { en, es, fr, ja, mn, pt, ru }
export const LANGUAGES = Object.keys(RESOURCES)

// plural forms each language must have (i18next 26, Intl.PluralRules)
export const PLURAL_FORMS: Record<string, string[]> = {
  en: ['one', 'other'],
  es: ['one', 'other'],
  fr: ['one', 'other'],
  ja: ['other'],
  mn: ['one', 'other'],
  pt: ['one', 'other'],
  ru: ['one', 'few', 'many', 'other'],
}
export const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/
export const CYRILLIC = /[Ѐ-ӿ]/

/**
 * Returns the aiSuggestions resource of a language.
 * @param {string} lang - Language.
 * @returns {Record<string, unknown>} The resource.
 */
export const getResource = (lang: string): Record<string, unknown> => RESOURCES[lang].aiSuggestions

/**
 * Flattens a resource: "a.b.c" paths to the string leaves.
 * @param {object} obj - Resource.
 * @param {string} [prefix] - Path prefix.
 * @returns {Record<string, string>} The texts by path.
 */
export const flatten = (obj: Record<string, unknown>, prefix = ''): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') result[path] = value
    else Object.assign(result, flatten(value as Record<string, unknown>, path))
  }
  return result
}

/**
 * Returns the sorted keys of a language, plural suffixes stripped.
 * @param {string} lang - Language.
 * @returns {string[]} The base keys.
 */
export const baseKeys = (lang: string): string[] =>
  [...new Set(Object.keys(flatten(getResource(lang))).map((key) => key.replace(PLURAL_SUFFIX, '')))].sort()

/**
 * Returns the sorted placeholder names of a text.
 * @param {string} text - Text.
 * @returns {string[]} The names.
 */
export const placeholders = (text: string): string[] =>
  [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((match) => match[1]).sort()

/**
 * Returns the English text of a base key (the _other form of a plural).
 * @param {string} key - Key, without plural suffix.
 * @returns {string} The text.
 */
export const enTextOf = (key: string): string => {
  const texts = flatten(getResource('en'))
  return texts[key] ?? texts[`${key}_other`]
}

/**
 * Returns the text at a dotted path of a language.
 * @param {string} lang - Language.
 * @param {string} path - Dotted path.
 * @returns {unknown} The text; undefined when missing.
 */
export const getText = (lang: string, path: string): unknown =>
  path.split('.').reduce((value, key) => (value as any)?.[key], getResource(lang) as unknown)

/**
 * Lists the texts a language must have for card keys: every plural form of its language for the plural keys.
 * @param {string} lang - Language.
 * @param {object} keys - Card keys.
 * @param {string[]} keys.plural - Keys with plural forms.
 * @param {string[]} keys.single - Keys without plural forms.
 * @returns {{path: string, enPath: string}[]} The texts, each with the English text whose placeholders it keeps.
 */
export const expectedTexts = (
  lang: string,
  { plural, single }: { plural: string[]; single: string[] }
): { path: string; enPath: string }[] => [
  ...plural.flatMap((key) => PLURAL_FORMS[lang].map((form) => ({ path: `${key}_${form}`, enPath: `${key}_other` }))),
  ...single.map((key) => ({ path: key, enPath: key })),
]

/**
 * Returns the text at a dotted path of another namespace (common, appErrors...) of a language.
 * @param {string} lang - Language.
 * @param {string} namespace - Namespace.
 * @param {string} path - Dotted path.
 * @returns {unknown} The text; undefined when missing.
 */
export const getNamespaceText = (lang: string, namespace: string, path: string): unknown =>
  path.split('.').reduce((value, key) => (value as any)?.[key], RESOURCES[lang][namespace] as unknown)
