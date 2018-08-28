const R = require('ramda')

const {
  getProps,
  getProp,
  getLabels,

  setProp,
} = require('./surveyUtils')

// == utils

const defaultSteps = {
  '1': {name: 'entry'},
  '2': {name: 'cleansing', prev: '1'},
  '3': {name: 'analysis', prev: '2'},
}

const getSurveyDBSchema = surveyId => `survey_${surveyId}`

//==== status
const isSurveyPublished = R.pipe(
  R.prop('published'),
  R.equals(true)
)

// ==== READ
const getSurveyLanguages = getProp('languages', [])

const getSurveyDefaultLanguage = R.pipe(
  getSurveyLanguages,
  R.head,
)

const getSurveyDefaultStep = survey => {
  const steps = getProp('steps')(survey)

  return R.pipe(
    R.keys,
    R.find(sId => !steps[sId].prev),
  )(steps)
}

module.exports = {
  defaultSteps,

  getSurveyDBSchema,

  // props
  getSurveyProps: getProps,
  getSurveyProp: getProp,
  setSurveyProp: setProp,
  getSurveyLabels: getLabels,

  getSurveyLanguages,
  getSurveyDefaultLanguage,
  getSurveyDescriptions: getProp('descriptions', {}),
  getSurveySrs: getProp('srs', []),
  getSurveyDefaultStep,

  isSurveyPublished,
}