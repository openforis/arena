const R = require('ramda')
const {groupNames} = require('../../auth/authGroups')

const {getProp} = require('../surveyUtils')

const keys = {
  info: 'info',
  id: 'id',
  name: 'name',
  descriptions: 'descriptions',
  published: 'published',
  draft: 'draft',
  languages: 'languages',
  srs: 'srs',
  labels: 'labels',
  steps: 'steps',
  authGroups: 'authGroups',
}

const getInfo = R.propOr({}, keys.info)

// ====== READ surveyInfo
const getId = R.prop(keys.id)

const getName = getProp(keys.name, '')

const getDescriptions = getProp(keys.descriptions, {})

const isPublished = R.propEq(keys.published, true)

const isDraft = R.propEq(keys.draft, true)

const getLanguages = getProp(keys.languages, [])

const getDefaultLanguage = R.pipe(getLanguages, R.head)

const getSRS = getProp(keys.srs, [])

const getDefaultSRS = R.pipe(getSRS, R.head)

const getLabels = getProp(keys.labels, {})

const getDefaultLabel = surveyInfo => {
  const labels = getLabels(surveyInfo)
  const lang = getDefaultLanguage(surveyInfo)
  return R.prop(lang, labels)
}

const getStatus = surveyInfo =>
  isPublished(surveyInfo) && isDraft(surveyInfo)
    ? 'PUBLISHED-DRAFT'
    : isPublished(surveyInfo)
    ? 'PUBLISHED'
    : isDraft(surveyInfo)
      ? 'DRAFT'
      : ''

const getDefaultStep = R.pipe(
  getProp(keys.steps),
  R.head,
  R.prop(keys.id)
)

const _getSteps = getProp(keys.steps)

const getStepName = step => R.pipe(
  _getSteps,
  R.find(R.propEq(keys.id, step)),
  R.prop(keys.name)
)
const getStep = (stepId, increment) => surveyInfo => {
  const steps = _getSteps(surveyInfo)

  return R.pipe(
    R.findIndex(R.propEq(keys.id, stepId)),
    idx => R.add(idx, increment),
    idx => idx >= 0 ? R.nth(idx, steps) : null
  )(steps)
}

const getNextStep = stepId => getStep(stepId, +1)

const getPreviousStep = stepId => getStep(stepId, -1)

// ====== UTILS

const isValid = surveyInfo => surveyInfo && surveyInfo.id

// ====== AUTH GROUPS

const getAuthGroups = R.prop(keys.authGroups)

const getSurveyAdminGroup = R.pipe(
  getAuthGroups,
  R.find(g => g.name === groupNames.surveyAdmin)
)

module.exports = {
  getInfo,

  getId,
  isPublished,
  isDraft,
  getName,
  getDescriptions,
  getLanguages,
  getDefaultLanguage,
  getSRS,
  getDefaultSRS,
  getLabels,
  getDefaultLabel,
  getStatus,
  getDefaultStep,
  getStepName,
  getNextStep,
  getPreviousStep,

  // ====== AUTH GROUPS
  getAuthGroups,
  getSurveyAdminGroup,

  // ====== UTILS
  isValid,
}