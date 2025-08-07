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

export const validateNewSurvey = async ({ newSurvey, surveyInfos }) =>
  Validator.validate(newSurvey, {
    name: getSurveyNameValidations({ surveyInfos }),
    lang: [Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.langRequired)],
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
    [`${infoKeys.props}.${infoKeys.languages}`]: [
      Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.langRequired),
    ],
    [`${infoKeys.props}.${infoKeys.name}`]: getSurveyNameValidations({ surveyInfos }),
    [`${infoKeys.props}.${infoKeys.srs}`]: [
      Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.srsRequired),
    ],
    [`${infoKeys.props}.${infoKeys.fieldManualLinks}`]: [validateFieldManualLinks],
  })

  const cyclesValidation = await SurveyCyclesValidator.validateCycles(Survey.getCycles(surveyInfo))

  return Validation.assocFieldValidation(Survey.infoKeys.cycles, cyclesValidation)(validation)
}
