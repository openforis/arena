const R = require('ramda')
const Promise = require('bluebird')

const {createError, validateRequired, assocValidation} = require('../serverUtils/validator')
const {getSurveysByName} = require('./surveyRepository')

const {getSurveyLanguages} = require('../../common/survey/survey')

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

const validateUpdateSurveyProp = async (survey, key) => {

  switch (key) {
    case 'name':
      return validateSurveyName('props.' + key, survey)
    case 'languages':
    case 'srs':
      return validateRequired('props.' + key, survey)
    default:
      return null
  }
}

module.exports = {
  validateCreateSurvey,
  validateSurvey,
  validateUpdateSurveyProp,
}
