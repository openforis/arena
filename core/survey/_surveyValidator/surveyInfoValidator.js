const R = require('ramda')

const Survey = require('../../survey/survey')
const Validator = require('../../validation/validator')
const Validation = require('../../validation/validation')

const SurveyCyclesValidator = require('./surveyCyclesValidator')

const validateSurveyNameUniqueness = surveyInfos => (propName, survey) => {
  return !R.isEmpty(surveyInfos) && R.find(s => s.id !== survey.id, surveyInfos)
    ? { key: Validation.messageKeys.nameDuplicate }
    : null
}

const validateNewSurvey = async (survey, surveyInfos) => await Validator.validate(
  survey,
  {
    'name': [
      Validator.validateRequired(Validation.messageKeys.nameRequired),
      Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
      validateSurveyNameUniqueness(surveyInfos)
    ],
    'lang': [Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.langRequired)],
  }
)

const validateSurveyInfo = async (surveyInfo, surveyInfos) => {
  const validation = await Validator.validate(
    surveyInfo,
    {
      'props.name': [
        Validator.validateRequired(Validation.messageKeys.nameRequired),
        Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
        validateSurveyNameUniqueness(surveyInfos)
      ],
      'props.languages': [Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.langRequired)],
      'props.srs': [Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.srsRequired)],
    }
  )

  const cyclesValidation = await SurveyCyclesValidator.validateCycles(Survey.getCycles(surveyInfo))

  return Validation.assocFieldValidation(Survey.infoKeys.cycles, cyclesValidation)(validation)
}

module.exports = {
  validateNewSurvey,
  validateSurveyInfo,
}
