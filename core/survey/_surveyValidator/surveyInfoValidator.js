import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

import * as SurveyCyclesValidator from './surveyCyclesValidator'

const validateSurveyNameUniqueness = (surveyInfos) => (propName, survey) =>
  !R.isEmpty(surveyInfos) && R.find((s) => s.id !== survey.id, surveyInfos)
    ? { key: Validation.messageKeys.nameDuplicate }
    : null

const getSurveyNameValidations = ({ surveyInfos, required = true }) => [
  ...(required ? [Validator.validateRequired(Validation.messageKeys.nameRequired)] : []),
  Validator.validateMinLength({ minLength: 6 }),
  Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
  validateSurveyNameUniqueness(surveyInfos),
]

export const validateNewSurvey = async ({ newSurvey, surveyInfos }) =>
  Validator.validate(newSurvey, {
    name: getSurveyNameValidations({ surveyInfos }),
    lang: [Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.langRequired)],
  })

export const validateSurveyClone = async ({ newSurvey, surveyInfos }) =>
  Validator.validate(newSurvey, {
    name: getSurveyNameValidations({ surveyInfos, required: false }),
  })

export const validateSurveyInfo = async (surveyInfo, surveyInfos) => {
  const validation = await Validator.validate(surveyInfo, {
    'props.name': getSurveyNameValidations({ surveyInfos }),
    'props.languages': [Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.langRequired)],
    'props.srs': [Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.srsRequired)],
  })

  const cyclesValidation = await SurveyCyclesValidator.validateCycles(Survey.getCycles(surveyInfo))

  return Validation.assocFieldValidation(Survey.infoKeys.cycles, cyclesValidation)(validation)
}
