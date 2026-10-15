/**
 * Helpers shared by the i18n tests of the AI assistant suggestion card texts (namespace aiSuggestions).
 */
import {
  CYRILLIC,
  CYRILLIC_LANGUAGES,
  flattenTexts,
  LANGUAGES,
  PLURAL_SUFFIX,
  placeholdersOf,
  pluralFormsOf,
  RESOURCES,
} from './i18nParity'

export { CYRILLIC, CYRILLIC_LANGUAGES, LANGUAGES, PLURAL_SUFFIX, RESOURCES }

// plural forms each language must have (derived from the language, not listed)
export const PLURAL_FORMS: Record<string, string[]> = Object.fromEntries(
  LANGUAGES.map((lang) => [lang, pluralFormsOf(lang)])
)

/**
 * Returns the aiSuggestions resource of a language.
 * @param {string} lang - Language.
 * @returns {Record<string, unknown>} The resource.
 */
export const getResource = (lang: string): Record<string, unknown> => RESOURCES[lang].aiSuggestions

export const flatten = flattenTexts

/**
 * Returns the sorted keys of a language, plural suffixes stripped.
 * @param {string} lang - Language.
 * @returns {string[]} The base keys.
 */
export const baseKeys = (lang: string): string[] =>
  [...new Set(Object.keys(flatten(getResource(lang))).map((key) => key.replace(PLURAL_SUFFIX, '')))].sort()

export const placeholders = placeholdersOf

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
