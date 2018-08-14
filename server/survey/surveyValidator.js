const R = require('ramda')
const Promise = require('bluebird')

const {validate, validateProp, createError, validateRequired, validateRequired2, assocValidation} = require('../serverUtils/validator')
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

const validateNewSurvey2 = async survey =>
  await validate(survey, newSurveyPropsValidations)

const validateSurveyName = async (propName, survey) => {
  const requiredError = validateRequired(propName, survey)
  if (requiredError)
    return requiredError

  const surveyName = R.path(propName.split('.'))(survey)
  const surveysByName = await getSurveysByName(surveyName)

  if (!R.isEmpty(surveysByName) && R.find(s => s.id != survey.id)(surveysByName))
    return createError('duplicate')

  return null
}

const validateNewSurvey = async survey => {
  const [nameValidation, langValidation] =
    await Promise.all([
      validateSurveyName('name', survey),
      validateRequired('lang', survey)
    ])

  return R.pipe(
    R.assocPath(['validation', 'valid'], true),
    R.partial(assocValidation, ['name', nameValidation]),
    R.partial(assocValidation, ['lang', langValidation]),
    R.prop('validation'),
  )(survey)
}

const validateSurvey = async survey => {
  const [nameValidation, languagesValidation, srsValidation] = await Promise.all([
    validateSurveyName('props.name', survey),
    validateRequired('props.languages', survey),
    validateRequired('props.srs', survey)
  ])

  return R.pipe(
    R.assocPath(['validation', 'valid'], true),
    R.partial(assocValidation, ['name', nameValidation]),
    R.partial(assocValidation, ['languages', languagesValidation]),
    R.partial(assocValidation, ['srs', srsValidation]),
    R.prop('validation'),
  )(survey)
}

const validateUpdateSurveyProp = async (survey, prop) => {
  const surveyValidation = await validate(survey, surveyPropsValidations)
  console.log('===== validateUpdateSurveyProp test validation survey ', JSON.stringify(surveyValidation))

  const propValidation = await validateProp(survey, 'props.' + prop, surveyPropsValidations['props.' + prop])
  console.log('===== validateUpdateSurveyProp test validation prop', ` '${prop}' `, JSON.stringify(propValidation))

  switch (prop) {
    case 'name':
      return validateSurveyName('props.' + prop, survey)
    case 'languages':
    case 'srs':
      return validateRequired('props.' + prop, survey)
    default:
      return null
  }
}

module.exports = {
  validateNewSurvey2,
  validateNewSurvey,
  validateSurvey,
  validateUpdateSurveyProp,
}
