const R = require('ramda')
const Promise = require('bluebird')

const {createError, validateRequired, validateRequired2, assocValidation} = require('../serverUtils/validator')
const {getSurveysByName} = require('./surveyRepository')

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

const validateSurveyNameUniqueness = async (propName, survey) => {
  const surveyName = R.path(propName.split('.'))(survey)
  const surveysByName = await getSurveysByName(surveyName)

  return !R.isEmpty(surveysByName) && R.find(s => s.id != survey.id, surveysByName)
    ? 'duplicate'
    : null
}

const validateCreateSurvey = async survey => {
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

const surveyPropsValidations = {
  'props.name': [validateRequired2, validateSurveyNameUniqueness],
  'props.languages': [validateRequired2],
  'props.srs': [validateRequired2],
}

const validateProp = async (obj, prop, validations) => {
  const errors = R.reject(
    R.isNil,
    await Promise.all(
      validations.map(validationFn => validationFn(prop, obj))
    )
  )
  return {
    valid: R.isEmpty(errors),
    errors,
  }
}

const validate = async (obj, propsValidations) => {
  const props = R.keys(propsValidations)
  const propName = R.pipe(R.split('.'), R.tail)

  const fields = R.mergeAll(
    await Promise.all(
      props.map(async prop => ({
        [propName(prop)]: await validateProp(obj, prop, propsValidations[prop])
      }))
    )
  )

  return {
    valid: !R.any(
      prop => R.pathEq([propName(prop), 'valid'], false, fields),
      props,
    ),
    fields
  }
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
  validateCreateSurvey,
  validateSurvey,
  validateUpdateSurveyProp,
}
