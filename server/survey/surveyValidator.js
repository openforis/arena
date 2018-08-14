const R = require('ramda')

const {validate, validateProp, validateRequired2} = require('../../common/validation/validator')

const {getSurveysByName} = require('./surveyRepository')

const validateSurveyNameUniqueness = async (propName, survey) => {
  const surveyName = R.path(propName.split('.'))(survey)
  const surveysByName = await getSurveysByName(surveyName)

  return !R.isEmpty(surveysByName) && R.find(s => s.id != survey.id, surveysByName)
    ? 'duplicate'
    : null
}

const surveyPropsValidations = {
  'props.name': [validateRequired2, validateSurveyNameUniqueness],
  'props.languages': [validateRequired2],
  'props.srs': [validateRequired2],
}

const newSurveyPropsValidations = {
  'name': [validateRequired2, validateSurveyNameUniqueness],
  'lang': [validateRequired2],
}

const validateNewSurvey = async survey =>
  await validate(survey, newSurveyPropsValidations)

const validateSurvey = async survey =>
  await validate(survey, surveyPropsValidations)

const validateUpdateSurveyProp = async (survey, prop) => {
  const propName = 'props.' + prop
  return await validateProp(survey, propName, surveyPropsValidations[propName])
}

module.exports = {
  validateNewSurvey,
  validateSurvey,
  validateUpdateSurveyProp,
}
