const R = require('ramda')

const {errorKeys, validate, validateRequired, validateNotKeyword} = require('../../../common/validation/validator')

const {getSurveysByName} = require('./persistence/surveyRepository')

const validateSurveyNameUniqueness = async (propName, survey) => {
  const surveyName = R.path(propName.split('.'))(survey)
  const surveysByName = await getSurveysByName(surveyName)

  return !R.isEmpty(surveysByName) && R.find(s => s.id !== survey.id, surveysByName)
    ? errorKeys.duplicate
    : null
}

const surveyInfoPropsValidations = {
  'props.name': [validateRequired, validateNotKeyword, validateSurveyNameUniqueness],
  'props.languages': [validateRequired],
  'props.srs': [validateRequired],
}

const newSurveyPropsValidations = {
  'name': [validateRequired, validateNotKeyword, validateSurveyNameUniqueness],
  'lang': [validateRequired],
}

const validateNewSurvey = async survey =>
  await validate(survey, newSurveyPropsValidations)

const validateSurveyInfo = async surveyInfo =>
  await validate(surveyInfo, surveyInfoPropsValidations)

module.exports = {
  validateNewSurvey,
  validateSurveyInfo,
}
