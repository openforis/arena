const R = require('ramda')
const Promise = require('bluebird')

const {createError, validateRequired} = require('../serverUtils/validator')
const {getSurveyByName} = require('./surveyRepository')

const validateCreateSurveyName = async survey => {
  const requiredError = validateRequired(survey, 'name')
  return requiredError
    ? requiredError
    : (await getSurveyByName(survey.name))
      ? createError('duplicate')
      : null
}

const assocValidation = (name, validation, obj) => R.propEq('valid', false, validation ? validation : {})
  ? R.pipe(
    R.assocPath(['validation', 'valid'], false),
    R.assocPath(['validation', 'fields', name], validation),
  )(obj)
  : obj

const validateCreateSurvey = async survey => {
  const [nameValidation, labelValidation, langValidation] = await Promise.all(
    [validateCreateSurveyName(survey), validateRequired(survey, 'label'), validateRequired(survey, 'lang')]
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
