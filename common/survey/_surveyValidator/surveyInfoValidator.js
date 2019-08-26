const R = require('ramda')

const Validator = require('../../../common/validation/validator')
const ValidatorErrorKeys = require('../../../common/validation/validatorErrorKeys')

const validateSurveyNameUniqueness = surveyInfos => (propName, survey) => {
  return !R.isEmpty(surveyInfos) && R.find(s => s.id !== survey.id, surveyInfos)
    ? { key: ValidatorErrorKeys.nameDuplicate }
    : null
}

const validateNewSurvey = async (survey, surveyInfos) => await Validator.validate(
  survey,
  {
    'name': [
      Validator.validateRequired(ValidatorErrorKeys.nameRequired),
      Validator.validateNotKeyword(ValidatorErrorKeys.nameCannotBeKeyword),
      validateSurveyNameUniqueness(surveyInfos)
    ],
    'lang': [Validator.validateRequired(ValidatorErrorKeys.surveyInfoEdit.langRequired)],
  }
)

const validateSurveyInfo = async (surveyInfo, surveyInfos) => await Validator.validate(
  surveyInfo,
  {
    'props.name': [
      Validator.validateRequired(ValidatorErrorKeys.nameRequired),
      Validator.validateNotKeyword(ValidatorErrorKeys.nameCannotBeKeyword),
      validateSurveyNameUniqueness(surveyInfos)
    ],
    'props.languages': [Validator.validateRequired(ValidatorErrorKeys.surveyInfoEdit.langRequired)],
    'props.srs': [Validator.validateRequired(ValidatorErrorKeys.surveyInfoEdit.srsRequired)],
  }
)

module.exports = {
  validateNewSurvey,
  validateSurveyInfo,
}
