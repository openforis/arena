const R = require('ramda')

const SurveyUtils = require('../surveyUtils')

const AuthGroups = require('../../auth/authGroups')
const { isBlank } = require('../../stringUtils')

const keys = {
  info: 'info',
  id: 'id',
  ownerUuid: 'ownerUuid',
  name: 'name',
  descriptions: 'descriptions',
  published: 'published',
  draft: 'draft',
  languages: 'languages',
  srs: 'srs',
  labels: 'labels',
  steps: 'steps',
  authGroups: 'authGroups',
  collectUri: 'collectUri',
  collectReport: 'collectReport',
}

const collectReportKeys = {
  issuesTotal: 'issuesTotal',
  issuesResolved: 'issuesResolved'
}

const getInfo = R.propOr({}, keys.info)

// ====== READ surveyInfo
const getId = R.prop(keys.id)

const getUuid = SurveyUtils.getUuid

const getName = SurveyUtils.getProp(keys.name, '')

const getDescriptions = SurveyUtils.getProp(keys.descriptions, {})

const isPublished = R.propEq(keys.published, true)

const isDraft = R.propEq(keys.draft, true)

const getLanguages = SurveyUtils.getProp(keys.languages, [])

const getDefaultLanguage = R.pipe(getLanguages, R.head)

const getLabels = SurveyUtils.getProp(keys.labels, {})

const getDefaultLabel = surveyInfo => {
  const labels = getLabels(surveyInfo)
  const lang = getDefaultLanguage(surveyInfo)
  return R.prop(lang, labels)
}

const getLabel = (surveyInfo, lang) => {
  const label = SurveyUtils.getLabel(lang)(surveyInfo)
  return isBlank(label)
    ? getName(surveyInfo)
    : label
}

const getSRS = SurveyUtils.getProp(keys.srs, [])

const getDefaultSRS = R.pipe(getSRS, R.head)

const getStatus = surveyInfo =>
  isPublished(surveyInfo) && isDraft(surveyInfo)
    ? 'PUBLISHED-DRAFT'
    : isPublished(surveyInfo)
    ? 'PUBLISHED'
    : isDraft(surveyInfo)
      ? 'DRAFT'
      : ''

const getCollectUri = SurveyUtils.getProp(keys.collectUri)

const getCollectReport = SurveyUtils.getProp(keys.collectReport, {})

const hasCollectReportIssues = R.pipe(
  getCollectReport,
  R.propSatisfies(total => total > 0, collectReportKeys.issuesTotal)
)

const isFromCollect = R.pipe(getCollectUri, R.isNil, R.not)

const getLanguage = preferredLang => surveyInfo => {
  return R.pipe(
    getLanguages,
    R.find(R.equals(preferredLang)),
    R.defaultTo(getDefaultLanguage(surveyInfo))
  )(surveyInfo)
}

// ====== UPDATE
const markDraft = R.assoc(keys.draft, true)

// ====== UTILS

const isValid = surveyInfo => surveyInfo && surveyInfo.id

// ====== AUTH GROUPS

const getAuthGroups = R.prop(keys.authGroups)

module.exports = {
  keys,
  collectReportKeys,

  // ====== READ
  getInfo,

  getId,
  getUuid,
  isPublished,
  isDraft,
  getName,
  getDescriptions,
  getLanguage,
  getLanguages,
  getDefaultLanguage,
  getSRS,
  getDefaultSRS,
  getLabels,
  getDefaultLabel,
  getLabel,
  getStatus,
  getCollectUri,
  isFromCollect,
  getCollectReport,
  hasCollectReportIssues,

  // ====== UPDATE
  markDraft,

  // ====== AUTH GROUPS
  getAuthGroups,
  getSurveyAdminGroup: AuthGroups.getSurveyAdminGroup,

  // ====== UTILS
  isValid,
}