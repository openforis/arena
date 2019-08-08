const R = require('ramda')

const { errorKeys, validate, validateRequired, validateNotKeyword } = require('../../../common/validation/validator')

const validateSurveyNameUniqueness = surveyInfos => (propName, survey) => {
  return !R.isEmpty(surveyInfos) && R.find(s => s.id !== survey.id, surveyInfos)
    ? { key: errorKeys.duplicate }
    : null
}

const validateNewSurvey = async (survey, surveyInfos) => await validate(
  survey,
  {
    'name': [validateRequired, validateNotKeyword, validateSurveyNameUniqueness(surveyInfos)],
    'lang': [validateRequired],
  }
)

const validateSurveyInfo = async (surveyInfo, surveyInfos) => await validate(
  surveyInfo,
  {
    'props.name': [validateRequired, validateNotKeyword, validateSurveyNameUniqueness(surveyInfos)],
    'props.languages': [validateRequired],
    'props.srs': [validateRequired],
  }
)

module.exports = {
  validateNewSurvey,
  validateSurveyInfo,
}
