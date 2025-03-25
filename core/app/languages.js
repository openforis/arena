import { LanguageCode, Languages, LanguagesISO639part2, Objects } from '@openforis/arena-core'

const standards = {
  ISO_639_1: 'ISO_639_1',
  ISO_639_2: 'ISO_639_2',
}

const { en } = LanguageCode

const languageMapByStandard = {
  [standards.ISO_639_1]: Languages,
  [standards.ISO_639_2]: LanguagesISO639part2,
}

const availableTranslationLanguages = [en]
const isLabelTranslationLanguageAvailable = (lang) => availableTranslationLanguages.includes(lang)

const _getLanguageLabel =
  (standard) =>
  ({ lang, translationLang = en }) => {
    const translationLanguage = isLabelTranslationLanguageAvailable(translationLang) ? translationLang : 'en'
    const languagesMap = languageMapByStandard[standard]
    return Objects.path([lang, translationLanguage])(languagesMap)
  }

export const getLanguageLabel = (lang, translationLang = en) =>
  _getLanguageLabel(standards.ISO_639_1)({ lang, translationLang })

export const getLanguageISO639part2Label = (lang, translationLang = en) =>
  _getLanguageLabel(standards.ISO_639_2)({ lang, translationLang })

export const languageCodes = Object.keys(Languages)

export const languageItemsSortedByEnLabel = languageCodes
  .map((lang) => ({ value: lang, label: getLanguageLabel(lang) }))
  .sort((lang1, lang2) => lang1.label.localeCompare(lang2.label))

export const languageCodesISO639part2 = Object.keys(LanguagesISO639part2)
