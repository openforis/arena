/**
 * The one place the i18n tests get the languages and their resources from. The languages are the ones the app
 * registers (`core/i18n/i18nFactory`, one folder each in `core/i18n/resources`), never a list written in a test, so a
 * new language is checked by every parity test without touching them.
 */
import { resources, supportedLanguages } from '@core/i18n/i18nFactory'

export type LanguageResources = Record<string, any>

export const RESOURCES: Record<string, LanguageResources> = resources
export const LANGUAGES: string[] = supportedLanguages
export const DEFAULT_LANGUAGE = 'en'
// the languages other than English (the ones that must follow it)
export const OTHER_LANGUAGES: string[] = LANGUAGES.filter((lang) => lang !== DEFAULT_LANGUAGE)

export const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/
export const CYRILLIC = /[Ѐ-ӿ]/

/**
 * Returns a namespace (common, appErrors, userAiSettings...) in every language.
 * @param {string} namespace - Namespace.
 * @returns {Record<string, any>} The namespace by language.
 */
export const namespaceByLanguage = (namespace: string): Record<string, any> =>
  Object.fromEntries(LANGUAGES.map((lang) => [lang, RESOURCES[lang][namespace]]))

/**
 * Returns the plural forms the texts of a language must have: the ones ordinary counts reach (what i18next picks),
 * plus "other". Intl also lists "many" for the languages that use it only for millions, which no text needs.
 * @param {string} lang - Language.
 * @returns {string[]} The forms, in the order Intl lists them.
 */
export const pluralFormsOf = (lang: string): string[] => {
  const rules = new Intl.PluralRules(lang)
  const reached = new Set<string>(['other'])
  for (let count = 0; count <= 1000; count += 1) reached.add(rules.select(count))
  return rules.resolvedOptions().pluralCategories.filter((form) => reached.has(form))
}

/**
 * Returns every plural category of a language (what Intl lists), including the ones only a very large count reaches.
 * @param {string} lang - Language.
 * @returns {string[]} The categories, sorted.
 */
export const pluralCategoriesOf = (lang: string): string[] =>
  [...new Intl.PluralRules(lang).resolvedOptions().pluralCategories].sort()

/**
 * Tells whether a language is written in the Cyrillic script (its texts must then contain Cyrillic letters).
 * @param {string} lang - Language.
 * @returns {boolean} True for Cyrillic.
 */
export const usesCyrillic = (lang: string): boolean => new Intl.Locale(lang).maximize().script === 'Cyrl'

export const CYRILLIC_LANGUAGES: string[] = LANGUAGES.filter(usesCyrillic)

/**
 * Resolves a dotted path in an object.
 * @param {object} obj - The object.
 * @param {string} path - The path.
 * @returns {any} The value, or undefined.
 */
export const getPath = (obj: unknown, path: string): any =>
  path.split('.').reduce((value: any, key) => (value == null ? undefined : value[key]), obj)

/**
 * Resolves an i18n key such as 'appErrors:record.lockTimeout' (no namespace: common) in a language.
 * @param {string} lang - Language.
 * @param {string} key - The key.
 * @returns {any} The text, or undefined.
 */
export const resolveKey = (lang: string, key: string): any => {
  const [namespace, path] = key.includes(':') ? key.split(':') : ['common', key]
  return getPath(RESOURCES[lang][namespace], path)
}

/**
 * Flattens a resource: the dotted path of every string leaf, with its text.
 * @param {object} obj - Resource.
 * @param {string} [prefix] - Path prefix.
 * @returns {Record<string, string>} The texts by path.
 */
export const flattenTexts = (obj: unknown, prefix = ''): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries((obj ?? {}) as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') result[path] = value
    else if (value && typeof value === 'object') Object.assign(result, flattenTexts(value, path))
  }
  return result
}

/**
 * Returns the dotted paths of the string leaves, sorted.
 * @param {object} obj - Resource.
 * @returns {string[]} The paths.
 */
export const leafPaths = (obj: unknown): string[] => Object.keys(flattenTexts(obj)).sort()

/**
 * Returns the sorted {{placeholder}} names of a text.
 * @param {string} text - Text.
 * @returns {string[]} The names.
 */
export const placeholdersOf = (text: string): string[] =>
  Array.from(String(text).matchAll(/{{\s*(\w+)\s*}}/g), (match) => match[1]).sort()

/**
 * Strips the plural suffix of a path (a plural text has one key per form: seeAll_one, seeAll_few...).
 * @param {string} path - Dotted path.
 * @returns {string} The path of the base key.
 */
export const baseKeyOf = (path: string): string => path.replace(PLURAL_SUFFIX, '')

/**
 * Returns the sorted base keys of flattened texts (plural forms together).
 * @param {Record<string, string>} flat - Texts by path.
 * @returns {string[]} The base keys.
 */
export const baseKeysOf = (flat: Record<string, string>): string[] =>
  [...new Set(Object.keys(flat).map(baseKeyOf))].sort()

/**
 * Returns the general form of a text: the "other" form of a plural, else the text itself.
 * @param {Record<string, string>} flat - Texts by path.
 * @param {string} baseKey - Base key.
 * @returns {string} The text ('' when missing).
 */
export const generalForm = (flat: Record<string, string>, baseKey: string): string =>
  flat[`${baseKey}_other`] ?? flat[baseKey] ?? ''

/**
 * Lists the plural texts whose forms differ from the plural categories of the language (i18next shows the raw key for a
 * category without a text).
 * @param {string} lang - Language.
 * @param {Record<string, string>} flat - Texts of the language by path.
 * @returns {{ baseKey: string, forms: string[] }[]} The plural texts with the wrong forms (empty: all right).
 */
export const getPluralMismatches = (
  lang: string,
  flat: Record<string, string>
): { baseKey: string; forms: string[] }[] => {
  const expected = pluralCategoriesOf(lang).join()
  const formsByKey = new Map<string, string[]>()
  for (const path of Object.keys(flat)) {
    const match = PLURAL_SUFFIX.exec(path)
    if (match) formsByKey.set(baseKeyOf(path), [...(formsByKey.get(baseKeyOf(path)) ?? []), match[1]])
  }
  return [...formsByKey.entries()]
    .map(([baseKey, forms]) => ({ baseKey, forms: forms.sort() }))
    .filter(({ forms }) => forms.join() !== expected)
}

/**
 * Groups the texts by base key (plural forms together).
 * @param {Record<string, string>} texts - Texts by path.
 * @returns {Map<string, string[]>} The texts of each base key.
 */
const groupByBaseKey = (texts: Record<string, string>): Map<string, string[]> => {
  const groups = new Map<string, string[]>()
  for (const [path, text] of Object.entries(texts)) {
    const base = baseKeyOf(path)
    groups.set(base, [...(groups.get(base) ?? []), text])
  }
  return groups
}

/**
 * Compares a group of texts of a language with the same group in English, by base key (a language has the plural
 * forms of its own language): the keys that are missing or extra, and the keys with a text whose placeholders differ
 * from the English ones.
 * @param {string} lang - Language.
 * @param {string} group - Dotted path of the group in the resources, with its namespace first (e.g. "common.aiBatch").
 * @returns {{ missing: string[], extra: string[], placeholders: string[] }} The differences (all empty: same keys and
 *   placeholders).
 */
export const diffWithDefaultLanguage = (
  lang: string,
  group: string
): { missing: string[]; extra: string[]; placeholders: string[] } => {
  const reference = groupByBaseKey(flattenTexts(getPath(RESOURCES[DEFAULT_LANGUAGE], group)))
  const texts = groupByBaseKey(flattenTexts(getPath(RESOURCES[lang], group)))
  // the placeholders of a key: those of all its forms (one form may leave out {{count}})
  const placeholdersOfKey = (groups: Map<string, string[]>, base: string): string =>
    [...new Set(groups.get(base)!.flatMap(placeholdersOf))].sort().join()
  return {
    missing: [...reference.keys()].filter((base) => !texts.has(base)),
    extra: [...texts.keys()].filter((base) => !reference.has(base)),
    placeholders: [...texts.keys()].filter(
      (base) => reference.has(base) && placeholdersOfKey(texts, base) !== placeholdersOfKey(reference, base)
    ),
  }
}
