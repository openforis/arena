import { LanguageCode, Languages, LanguagesISO639part2, Objects } from '@openforis/arena-core'

export const standards = {
  ISO_639_1: 'ISO_639_1',
  ISO_639_2: 'ISO_639_2',
} as const

const { en } = LanguageCode

type TranslationArgs = {
  lang: string
  translationLang?: string
}

const languageMapByStandard: Record<string, Record<string, Record<string, string>>> = {
  [standards.ISO_639_1]: Languages,
  [standards.ISO_639_2]: LanguagesISO639part2,
}

const availableTranslationLanguages = [en]
const isLabelTranslationLanguageAvailable = (lang: string): boolean =>
  availableTranslationLanguages.includes(lang as (typeof availableTranslationLanguages)[number])

const _getLanguageLabel =
  (standard: string) =>
  ({ lang, translationLang = en }: TranslationArgs): string | undefined => {
    const translationLanguage = isLabelTranslationLanguageAvailable(translationLang) ? translationLang : 'en'
    const languagesMap = languageMapByStandard[standard]
    return Objects.path([lang, translationLanguage])(languagesMap)
  }

export const getLanguageLabel = (lang: string, translationLang: string = en): string | undefined =>
  _getLanguageLabel(standards.ISO_639_1)({ lang, translationLang })

export const getLanguageISO639part2Label = (lang: string, translationLang: string = en): string | undefined =>
  _getLanguageLabel(standards.ISO_639_2)({ lang, translationLang })

export const languageCodes: string[] = Object.keys(Languages)

// language codes are used as JSON keys and export column names: codes outside the known list (e.g. from imported
// forms) are accepted when they have this format
const languageCodeFormatRegex = /^[A-Za-z][A-Za-z0-9_-]{0,31}$/

export const isLanguageCodeFormatValid = (lang: unknown): boolean =>
  typeof lang === 'string' && languageCodeFormatRegex.test(lang)

export const languageItemsSortedByEnLabel = languageCodes
  .map((lang) => ({ value: lang, label: getLanguageLabel(lang) ?? '' }))
  .sort((lang1, lang2) => lang1.label.localeCompare(lang2.label))

export const languageCodesISO639part2: string[] = Object.keys(LanguagesISO639part2)

export const languageItemsISO639part2SortedByEnLabel = languageCodesISO639part2
  .map((lang) => ({ value: lang, label: getLanguageISO639part2Label(lang) ?? '' }))
  .sort((lang1, lang2) => lang1.label.localeCompare(lang2.label))
