import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

import * as SurveyCyclesValidator from './surveyCyclesValidator'

const validateSurveyNameUniqueness = (surveyInfos) => (propName, survey) =>
  !R.isEmpty(surveyInfos) && R.find((s) => s.id !== survey.id, surveyInfos)
    ? { key: Validation.messageKeys.nameDuplicate }
    : null

export const validateNewSurvey = async ({ newSurvey, surveyInfos }) =>
  Validator.validate(newSurvey, {
    name: [
      Validator.validateRequired(Validation.messageKeys.nameRequired),
      Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
      validateSurveyNameUniqueness(surveyInfos),
    ],
    lang: [Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.langRequired)],
  })

export const validateSurveyClone = async ({ newSurvey, surveyInfos }) =>
  Validator.validate(newSurvey, {
    name: [
      Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
      validateSurveyNameUniqueness(surveyInfos),
    ],
  })

export const validateSurveyInfo = async (surveyInfo, surveyInfos) => {
  const validation = await Validator.validate(surveyInfo, {
    'props.name': [
      Validator.validateRequired(Validation.messageKeys.nameRequired),
      Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
      validateSurveyNameUniqueness(surveyInfos),
    ],
    'props.languages': [Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.langRequired)],
    'props.srs': [Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.srsRequired)],
  })

  const cyclesValidation = await SurveyCyclesValidator.validateCycles(Survey.getCycles(surveyInfo))

  return Validation.assocFieldValidation(Survey.infoKeys.cycles, cyclesValidation)(validation)
}
