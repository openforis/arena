const R = require('ramda')

const Validator = require('../../../common/validation/validator')

const keysErrors = {
  nameRequired: 'survey.info.validationErrors.nameRequired',
  nameDuplicate: 'survey.info.validationErrors.nameDuplicate',
  nameNotKeyword: 'survey.info.validationErrors.nameNotKeyword',
  langRequired: 'survey.info.validationErrors.langRequired',
  srsRequired: 'survey.info.validationErrors.srsRequired',
}

const validateSurveyNameUniqueness = surveyInfos => (propName, survey) => {
  return !R.isEmpty(surveyInfos) && R.find(s => s.id !== survey.id, surveyInfos)
    ? { key: keysErrors.nameDuplicate }
    : null
}

const validateNewSurvey = async (survey, surveyInfos) => await Validator.validate(
  survey,
  {
    'name': [Validator.validateRequired(keysErrors.nameRequired), Validator.validateNotKeyword(keysErrors.nameNotKeyword), validateSurveyNameUniqueness(surveyInfos)],
    'lang': [Validator.validateRequired(keysErrors.langRequired)],
  }
)

const validateSurveyInfo = async (surveyInfo, surveyInfos) => await Validator.validate(
  surveyInfo,
  {
    'props.name': [Validator.validateRequired(keysErrors.nameRequired), Validator.validateNotKeyword(keysErrors.nameNotKeyword), validateSurveyNameUniqueness(surveyInfos)],
    'props.languages': [Validator.validateRequired(keysErrors.langRequired)],
    'props.srs': [Validator.validateRequired(keysErrors.srsRequired)],
  }
)

module.exports = {
  validateNewSurvey,
  validateSurveyInfo,
}
