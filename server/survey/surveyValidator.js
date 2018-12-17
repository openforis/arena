const R = require('ramda')

const Survey = require('../../common/survey/survey')

const {errorKeys, validate, validateRequired, validateNotKeyword} = require('../../common/validation/validator')

const {getSurveysByName} = require('./surveyRepository')

const validateSurveyNameUniqueness = async (propName, survey) => {
  const surveyName = R.path(propName.split('.'))(survey)
  const surveysByName = await getSurveysByName(surveyName)

  return !R.isEmpty(surveysByName) && R.find(s => s.id !== survey.id, surveysByName)
    ? errorKeys.duplicate
    : null
}

const surveyPropsValidations = {
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

const validateSurvey = async survey =>
  await validate(Survey.getSurveyInfo(survey), surveyPropsValidations)

module.exports = {
  validateNewSurvey,
  validateSurvey,
}
