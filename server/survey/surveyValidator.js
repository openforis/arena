const R = require('ramda')
const Promise = require('bluebird')

const {createError, validateRequired, assocValidation} = require('../serverUtils/validator')
const {getSurveysByName} = require('./surveyRepository')

const {getSurveyLanguages} = require('../../common/survey/survey')

const validateSurveyName = async (survey, propName = 'name') => {
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
  const [nameValidation, labelValidation, langValidation] = await Promise.all(
    [validateSurveyName(survey), validateRequired('label', survey), validateRequired('lang', survey)]
  )

  return R.pipe(
    R.assocPath(['validation', 'valid'], true),
    R.partial(assocValidation, ['name', nameValidation]),
    R.partial(assocValidation, ['label', labelValidation]),
    R.partial(assocValidation, ['lang', langValidation]),
    R.prop('validation'),
  )(survey)
}

const validateSurvey = async survey => {
  const defaultLangLabelField = 'labels.' + R.head(getSurveyLanguages(survey))

  const [nameValidation, languagesValidation, defaultLangLabelValidation, srsValidation] = await Promise.all([
    validateSurveyName(survey, 'props.name'),
    validateRequired('props.' + defaultLangLabelField, survey),
    validateRequired('props.languages', survey),
    validateRequired('props.srs', survey)
  ])

  return R.pipe(
    R.assocPath(['validation', 'valid'], true),
    R.partial(assocValidation, ['name', nameValidation]),
    R.partial(assocValidation, ['languages', languagesValidation]),
    R.partial(assocValidation, [defaultLangLabelField, defaultLangLabelValidation]),
    R.partial(assocValidation, ['srs', srsValidation]),
    R.prop('validation'),
  )(survey)
}

const validateUpdateSurveyProp = async (surveyId, key, value) => {
  const surveyFormObj = {
    id: surveyId,
    [key]: value
  }
  switch (key) {
    case 'name':
      return validateSurveyName(surveyFormObj, key)
    case 'languages':
    case 'srs':
      return validateRequired(key, surveyFormObj)
    default:
      return null
  }
}

module.exports = {
  validateCreateSurvey,
  validateSurvey,
  validateUpdateSurveyProp,
}
