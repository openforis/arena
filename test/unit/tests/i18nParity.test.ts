import {
  baseKeyOf,
  diffWithDefaultLanguage,
  flattenTexts,
  OTHER_LANGUAGES,
  PLURAL_SUFFIX,
  pluralCategoriesOf,
  pluralFormsOf,
  RESOURCES,
} from '../utils/i18nParity'

// emails are sent in English only
const ENGLISH_ONLY_NAMESPACES = new Set(['emails'])

const NAMESPACES = Object.keys(RESOURCES.en).filter((namespace) => !ENGLISH_ONLY_NAMESPACES.has(namespace))

const LANGUAGE_NAMESPACES = OTHER_LANGUAGES.flatMap((lang) => NAMESPACES.map((namespace) => [lang, namespace]))

/**
 * Lists the plural problems of the texts of a language: a form the language needs that is missing (with no base key
 * for i18next to fall back to), or a form the language does not have (i18next never reads it).
 */
const pluralProblemsOf = (lang: string, flat: Record<string, string>): string[] => {
  const needed = pluralFormsOf(lang)
  const allowed = new Set(pluralCategoriesOf(lang))
  const problems: string[] = []
  const pluralBaseKeys = new Set(
    Object.keys(flat)
      .filter((path) => PLURAL_SUFFIX.test(path))
      .map(baseKeyOf)
  )
  for (const baseKey of pluralBaseKeys) {
    if (flat[baseKey] === undefined) {
      problems.push(...needed.filter((form) => flat[`${baseKey}_${form}`] === undefined).map((f) => `${baseKey}_${f}`))
    }
  }
  for (const path of Object.keys(flat)) {
    const form = PLURAL_SUFFIX.exec(path)?.[1]
    if (form && !allowed.has(form)) problems.push(path)
  }
  return problems.sort((a, b) => a.localeCompare(b))
}

describe('i18n parity with en, every namespace', () => {
  test.each(LANGUAGE_NAMESPACES)('%s has the keys and placeholders of en in %s', (lang, namespace) => {
    expect(diffWithDefaultLanguage(lang, namespace)).toEqual({ missing: [], extra: [], placeholders: [] })
  })

  test.each(LANGUAGE_NAMESPACES)('%s has only non-empty texts in %s', (lang, namespace) => {
    const empty = Object.entries(flattenTexts(RESOURCES[lang][namespace])).filter(([, text]) => !text.trim())
    expect(empty).toEqual([])
  })

  test.each(LANGUAGE_NAMESPACES)('%s has the plural forms of its language in %s', (lang, namespace) => {
    expect(pluralProblemsOf(lang, flattenTexts(RESOURCES[lang][namespace]))).toEqual([])
  })
})
