const R = require('ramda')

const Validator = require('../../../common/validation/validator')

const validateSurveyNameUniqueness = surveyInfos => (propName, survey) => {
  return !R.isEmpty(surveyInfos) && R.find(s => s.id !== survey.id, surveyInfos)
    ? { key: Validator.messageKeys.nameDuplicate }
    : null
}

const validateNewSurvey = async (survey, surveyInfos) => await Validator.validate(
  survey,
  {
    'name': [
      Validator.validateRequired(Validator.messageKeys.nameRequired),
      Validator.validateNotKeyword(Validator.messageKeys.nameCannotBeKeyword),
      validateSurveyNameUniqueness(surveyInfos)
    ],
    'lang': [Validator.validateRequired(Validator.messageKeys.surveyInfoEdit.langRequired)],
  }
)

const validateSurveyInfo = async (surveyInfo, surveyInfos) => await Validator.validate(
  surveyInfo,
  {
    'props.name': [
      Validator.validateRequired(Validator.messageKeys.nameRequired),
      Validator.validateNotKeyword(Validator.messageKeys.nameCannotBeKeyword),
      validateSurveyNameUniqueness(surveyInfos)
    ],
    'props.languages': [Validator.validateRequired(Validator.messageKeys.surveyInfoEdit.langRequired)],
    'props.srs': [Validator.validateRequired(Validator.messageKeys.surveyInfoEdit.srsRequired)],
  }
)

module.exports = {
  validateNewSurvey,
  validateSurveyInfo,
}
