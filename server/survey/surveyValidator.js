const R = require('ramda')

const {getSurveyInfo} = require('../../common/survey/survey')

const {validate, validateProp, validateRequired} = require('../../common/validation/validator')

const {getSurveysByName} = require('./surveyRepository')

const validateSurveyNameUniqueness = async (propName, survey) => {
  const surveyName = R.path(propName.split('.'))(survey)
  const surveysByName = await getSurveysByName(surveyName)

  return !R.isEmpty(surveysByName) && R.find(s => s.id != survey.id, surveysByName)
    ? 'duplicate'
    : null
}

const surveyPropsValidations = {
  'props.name': [validateRequired, validateSurveyNameUniqueness],
  'props.languages': [validateRequired],
  'props.srs': [validateRequired],
}

const newSurveyPropsValidations = {
  'name': [validateRequired, validateSurveyNameUniqueness],
  'lang': [validateRequired],
}

const validateNewSurvey = async survey =>
  await validate(survey, newSurveyPropsValidations)

const validateSurvey = async survey =>
  await validate(getSurveyInfo(survey), surveyPropsValidations)

const validateSurveyProp = async (survey, prop) => {
  const propName = 'props.' + prop
  return await validateProp(getSurveyInfo(survey), propName, surveyPropsValidations[propName])
}

module.exports = {
  validateNewSurvey,
  validateSurvey,
  validateSurveyProp,
}
