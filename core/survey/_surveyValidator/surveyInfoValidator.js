const R = require('ramda')

const Validator = require('../../validation/validator')
const Validation = require('../../validation/validation')

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

const validateSurveyInfo = async (surveyInfo, surveyInfos) => await Validator.validate(
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

module.exports = {
  validateNewSurvey,
  validateSurveyInfo,
}
