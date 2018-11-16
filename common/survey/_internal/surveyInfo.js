const R = require('ramda')
const {groupNames} = require('../../auth/authGroups')

const {getProp} = require('../surveyUtils')

const info = 'info'
const getInfo = R.propOr({}, info)

// ====== READ surveyInfo
const getName = getProp('name', '')

const getDescriptions = getProp('descriptions', {})

const isPublished = R.propEq('published', true)

const isDraft = R.propEq('draft', true)

const getLanguages = getProp('languages', [])

const getDefaultLanguage = R.pipe(getLanguages, R.head)

const getSRS = getProp('srs', [])

const getLabels = getProp('labels', {})

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
  getProp('steps'),
  R.toPairs,
  R.find(s => !s[1].prev),
  R.head
)

// ====== UTILS

const isValid = surveyInfo => surveyInfo && surveyInfo.id

// ====== AUTH GROUPS

const getAuthGroupAdmin = R.pipe(
  R.prop('authGroups'),
  R.find(g => g.name === groupNames.surveyAdmin)
)

module.exports = {
  getInfo,

  isPublished,
  isDraft,
  getName,
  getDescriptions,
  getLanguages,
  getDefaultLanguage,
  getSRS,
  getLabels,
  getDefaultLabel,
  getStatus,
  getDefaultStep,

  // ====== AUTH GROUPS
  getAuthGroupAdmin,

  // ====== UTILS
  isValid,
}