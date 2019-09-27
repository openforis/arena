const R = require('ramda')

const AuthGroups = require('../../auth/authGroups')

const ObjectUtils = require('../../objectUtils')
const StringUtils = require('../../stringUtils')

const keys = {
  id: ObjectUtils.keys.id,
  uuid: ObjectUtils.keys.uuid,
  info: 'info',
  ownerUuid: 'ownerUuid',
  draft: 'draft',
  published: 'published',
  authGroups: 'authGroups',
  props: ObjectUtils.keys.props,
  //props
  collectUri: 'collectUri',
  collectReport: 'collectReport',
  cycles: 'cycles',
  descriptions: ObjectUtils.keysProps.descriptions,
  name: 'name',
  labels: ObjectUtils.keysProps.labels,
  languages: 'languages',
  srs: 'srs',
  steps: 'steps',
}

const collectReportKeys = {
  issuesTotal: 'issuesTotal',
  issuesResolved: 'issuesResolved'
}

const getInfo = R.propOr({}, keys.info)

// ====== READ surveyInfo
const getId = R.prop(keys.id)

const getUuid = ObjectUtils.getUuid

const getName = ObjectUtils.getProp(keys.name, '')

const getDescriptions = ObjectUtils.getProp(keys.descriptions, {})

const isPublished = R.propEq(keys.published, true)

const isDraft = R.propEq(keys.draft, true)

const getLanguages = ObjectUtils.getProp(keys.languages, [])

const getDefaultLanguage = R.pipe(getLanguages, R.head)

const getLabels = ObjectUtils.getProp(keys.labels, {})

const getDefaultLabel = surveyInfo => {
  const labels = getLabels(surveyInfo)
  const lang = getDefaultLanguage(surveyInfo)
  return R.prop(lang, labels)
}

const getLabel = (surveyInfo, lang) => {
  const label = ObjectUtils.getLabel(lang)(surveyInfo)
  return StringUtils.isBlank(label)
    ? getName(surveyInfo)
    : label
}

const getSRS = ObjectUtils.getProp(keys.srs, [])

const getDefaultSRS = R.pipe(getSRS, R.head)

const getStatus = surveyInfo =>
  isPublished(surveyInfo) && isDraft(surveyInfo)
    ? 'PUBLISHED-DRAFT'
    : isPublished(surveyInfo)
    ? 'PUBLISHED'
    : isDraft(surveyInfo)
      ? 'DRAFT'
      : ''

const getCollectUri = ObjectUtils.getProp(keys.collectUri)

const getCollectReport = ObjectUtils.getProp(keys.collectReport, {})

const hasCollectReportIssues = R.pipe(
  getCollectReport,
  R.propSatisfies(total => total > 0, collectReportKeys.issuesTotal)
)

const isFromCollect = R.pipe(getCollectUri, R.isNil, R.not)

const getLanguage = preferredLang => surveyInfo => R.pipe(
  getLanguages,
  R.find(R.equals(preferredLang)),
  R.defaultTo(getDefaultLanguage(surveyInfo))
)(surveyInfo)

// ====== UPDATE
const markDraft = R.assoc(keys.draft, true)

// ====== UTILS

const isValid = surveyInfo => surveyInfo && surveyInfo.id

// ====== AUTH GROUPS

const getAuthGroups = R.prop(keys.authGroups)

const _getAuthGroupByName = name => R.pipe(
  getAuthGroups,
  R.find(R.propEq(AuthGroups.keys.name, name))
)

const getAuthGroupAdmin = _getAuthGroupByName(AuthGroups.groupNames.surveyAdmin)

const isAuthGroupAdmin = group => surveyInfo => AuthGroups.isEqual(group)(getAuthGroupAdmin(surveyInfo))

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
  getDateCreated: ObjectUtils.getDateCreated,
  getDateModified: ObjectUtils.getDateModified,
  getCollectUri,
  isFromCollect,
  getCollectReport,
  hasCollectReportIssues,

  // ====== UPDATE
  markDraft,

  // ====== AUTH GROUPS
  getAuthGroups,
  getAuthGroupAdmin,
  isAuthGroupAdmin,

  // ====== UTILS
  isValid,
}