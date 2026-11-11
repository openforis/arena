import * as A from '@core/arena'
import { languageCodes } from '@core/app/languages'
import * as Srs from '@core/geo/srs'
import * as Survey from '@core/survey/survey'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

import * as SurveyCyclesValidator from './surveyCyclesValidator'

const { infoKeys } = Survey

const validateSurveyNameUniqueness =
  (surveyInfos = null) =>
  (_propName, survey) =>
    surveyInfos?.find((s) => s.id !== survey.id) ? { key: Validation.messageKeys.nameDuplicate } : null

export const getSurveyNameValidations = ({ surveyInfos = null, required = true } = {}) => [
  ...(required ? [Validator.validateRequired(Validation.messageKeys.nameRequired)] : []),
  Validator.validateMinLength({ minLength: 6 }),
  Validator.validateName(Validation.messageKeys.nameInvalid),
  Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
  validateSurveyNameUniqueness(surveyInfos),
]

const validateFieldManualLinks = (_propName, survey) => {
  const links = Object.values(Survey.getFieldManualLinks(survey))
  return links.every((link) => URL.canParse(link))
    ? null
    : { key: Validation.messageKeys.surveyInfoEdit.fieldManualLinksInvalid }
}

/**
 * Returns the language codes not supported by Arena (not in the ISO 639-1 list).
 * @param {string[]} languages - The language codes to check.
 * @returns {string[]} - The invalid language codes.
 */
export const getInvalidLanguageCodes = (languages) => languages.filter((lang) => !languageCodes.includes(lang))

// spatial reference system codes are EPSG codes
const srsCodeRegex = /^\d{1,10}$/

/**
 * Returns the codes of the spatial reference systems that are not EPSG codes (numbers).
 * @param {object[]} srss - The spatial reference systems to check (with code and name).
 * @returns {string[]} - The invalid codes.
 */
export const getInvalidSrsCodes = (srss) =>
  srss.map((srs) => srs?.[Srs.keys.code]).filter((code) => !srsCodeRegex.test(String(code)))

const validateSrsCodes = (propName, obj) => {
  const codesInvalid = getInvalidSrsCodes([Validator.getProp(propName)(obj) ?? []].flat())
  return codesInvalid.length > 0
    ? { key: Validation.messageKeys.surveyInfoEdit.srsInvalid, params: { code: codesInvalid.join(', ') } }
    : null
}

const validateLanguageCodes = (propName, obj) => {
  const value = Validator.getProp(propName)(obj)
  if (A.isEmpty(value)) return null
  const langsInvalid = getInvalidLanguageCodes([value].flat())
  return langsInvalid.length > 0
    ? { key: Validation.messageKeys.surveyInfoEdit.langInvalid, params: { lang: langsInvalid.join(', ') } }
    : null
}

const languageValidations = [
  Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.langRequired),
  validateLanguageCodes,
]

export const validateNewSurvey = async ({ newSurvey, surveyInfos }) =>
  Validator.validate(newSurvey, {
    name: getSurveyNameValidations({ surveyInfos }),
    lang: languageValidations,
  })

export const validateSurveyClone = async ({ newSurvey, surveyInfos }) =>
  Validator.validate(newSurvey, {
    name: getSurveyNameValidations({ surveyInfos, required: false }),
    cloneFromCycle: [Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.cyclesRequired)],
  })

export const validateSurveyImportFromCollect = async ({ newSurvey, surveyInfos }) =>
  Validator.validate(newSurvey, {
    name: getSurveyNameValidations({ surveyInfos, required: false }),
  })

export const validateSurveyInfo = async (surveyInfo, surveyInfos) => {
  const validation = await Validator.validate(surveyInfo, {
    [`${infoKeys.props}.${infoKeys.languages}`]: languageValidations,
    [`${infoKeys.props}.${infoKeys.name}`]: getSurveyNameValidations({ surveyInfos }),
    [`${infoKeys.props}.${infoKeys.srs}`]: [
      Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.srsRequired),
      validateSrsCodes,
    ],
    [`${infoKeys.props}.${infoKeys.fieldManualLinks}`]: [validateFieldManualLinks],
  })

  const cyclesValidation = await SurveyCyclesValidator.validateCycles(Survey.getCycles(surveyInfo))

  return Validation.assocFieldValidation(Survey.infoKeys.cycles, cyclesValidation)(validation)
}
