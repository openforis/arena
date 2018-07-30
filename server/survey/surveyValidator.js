const R = require('ramda')

const {getSurveyByName} = require('./surveyRepository')

const validateCreateSurveyName = async survey => {
  const error = R.isEmpty(survey.name)
    ? 'empty'
    : await getSurveyByName(survey.name)
      ? 'duplicate'
      : null

  return error
    ? R.pipe(
      R.assoc('valid', false),
      R.assoc('error', error),
    )({})
    : {}
}

const validateRequired = (obj, name) => {
  const value = R.prop(name, obj)
  const error = R.isEmpty(value) || R.isNil(value)
    ? 'empty'
    : null

  return error
    ? R.pipe(
      R.assoc('valid', false),
      R.assoc('error', error),
    )({})
    : {}
}

const assocValidation = (name, validation, obj) => R.propEq('valid', false, validation)
  ? R.pipe(
    R.assocPath(['validation', 'valid'], false),
    R.assocPath(['validation', 'fields', name], validation),
  )(obj)
  : obj

const validateCreateSurvey = async survey => {
  const nameValidation = await validateCreateSurveyName(survey)
  const labelValidation = await validateRequired(survey, 'label')
  const langValidation = await validateRequired(survey, 'lang')
console.log(survey)

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
