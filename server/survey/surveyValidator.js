const R = require('ramda')
const Promise = require('bluebird')

const {createError, validateRequired} = require('../serverUtils/validator')
const {getSurveyByName} = require('./surveyRepository')


const assocValidation = (name, validation, obj) => R.propEq('valid', false, validation ? validation : {})
  ? R.pipe(
    R.assocPath(['validation', 'valid'], false),
    R.assocPath(['validation', 'fields', name], validation),
  )(obj)
  : obj


const validateCreateSurveyName = async survey => {
  const requiredError = validateRequired('name', survey)
  if(requiredError)
    return requiredError

  const surveyByName = await getSurveyByName(survey.name)
  if(surveyByName)
    return createError('duplicate')

  return null
}

const validateCreateSurvey = async survey => {
  const [nameValidation, labelValidation, langValidation] = await Promise.all(
    [validateCreateSurveyName(survey), validateRequired('label', survey), validateRequired('lang', survey)]
  )

  return R.pipe(
    R.assocPath(['validation', 'valid'], true),
    R.partial(assocValidation, ['name', nameValidation]),
    R.partial(assocValidation, ['label', labelValidation]),
    R.partial(assocValidation, ['lang', langValidation]),
    R.prop('validation'),
  )(survey)
}

module.exports = {
  validateCreateSurvey,
}
