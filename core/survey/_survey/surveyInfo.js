import * as R from 'ramda'

import * as AuthGroup from '@core/auth/authGroup'

import * as ObjectUtils from '@core/objectUtils'
import * as StringUtils from '@core/stringUtils'

export const keys = {
  id: ObjectUtils.keys.id,
  uuid: ObjectUtils.keys.uuid,
  info: 'info',
  ownerUuid: 'ownerUuid',
  ownerName: 'ownerName',
  draft: 'draft',
  published: 'published',
  authGroups: 'authGroups',
  props: ObjectUtils.keys.props,
  // Props
  collectUri: 'collectUri',
  collectReport: 'collectReport',
  collectNodeDefsInfoByPath: 'collectNodeDefsInfoByPath',
  cycles: 'cycles',
  descriptions: ObjectUtils.keysProps.descriptions,
  name: 'name',
  labels: ObjectUtils.keysProps.labels,
  languages: 'languages',
  samplingPolygon: 'samplingPolygon',
  srs: 'srs',
  steps: 'steps',
  template: 'template',
  temporary: 'temporary',
}

export const collectReportKeys = {
  issuesTotal: 'issuesTotal',
  issuesResolved: 'issuesResolved',
}

export const cycleOneKey = '0'

export const getInfo = (survey) => (survey.info ? survey.info : survey) // backwards compatibility: survey info were associated to 'info' prop

// ====== READ surveyInfo
export const { getId, getUuid, getProps, getPropsDraft } = ObjectUtils

export const getName = ObjectUtils.getProp(keys.name, '')

export const getOwnerUuid = R.propOr(null, keys.ownerUuid)

export const getOwnerName = R.propOr('', keys.ownerName)

export const getDescriptions = ObjectUtils.getProp(keys.descriptions, {})

export const isPublished = R.propEq(keys.published, true)

export const isDraft = R.propEq(keys.draft, true)

export const getLanguages = ObjectUtils.getProp(keys.languages, [])

export const getDefaultLanguage = R.pipe(getLanguages, R.head)

export const getLabels = ObjectUtils.getProp(keys.labels, {})

export const getDefaultLabel = (surveyInfo) => {
  const labels = getLabels(surveyInfo)
  const lang = getDefaultLanguage(surveyInfo)
  return R.prop(lang, labels)
}

export const getLabel = (surveyInfo, lang) => {
  const label = ObjectUtils.getLabel(lang)(surveyInfo)
  return StringUtils.isBlank(label) ? getName(surveyInfo) : label
}

export const getSamplingPolygon = ObjectUtils.getProp(keys.samplingPolygon, { value: '{}' })

export const getSRS = ObjectUtils.getProp(keys.srs, [])

export const getDefaultSRS = R.pipe(getSRS, R.head)

export const getStatus = (surveyInfo) => {
  const published = isPublished(surveyInfo)
  const draft = isDraft(surveyInfo)
  if (published && draft) return 'PUBLISHED-DRAFT'
  if (published) return 'PUBLISHED'
  if (draft) return 'DRAFT'
  return ''
}

export const getCycles = ObjectUtils.getProp(keys.cycles)

export const getCycleKeys = R.pipe(getCycles, R.keys)

export const { getDateCreated } = ObjectUtils

export const { getDateModified } = ObjectUtils

export const getCollectUri = ObjectUtils.getProp(keys.collectUri)

export const getCollectReport = ObjectUtils.getProp(keys.collectReport, {})

export const hasCollectReportIssues = R.pipe(
  getCollectReport,
  R.propSatisfies((total) => total > 0, collectReportKeys.issuesTotal)
)

export const getCollectNodeDefsInfoByPath = ObjectUtils.getProp(keys.collectNodeDefsInfoByPath, {})

export const isFromCollect = R.pipe(getCollectUri, R.isNil, R.not)

export const getLanguage = (preferredLang) => (surveyInfo) =>
  R.pipe(getLanguages, R.find(R.equals(preferredLang)), R.defaultTo(getDefaultLanguage(surveyInfo)))(surveyInfo)

export const isTemplate = R.propEq(keys.template, true)

// ====== UPDATE
export const markDraft = R.assoc(keys.draft, true)

// ====== UTILS

export const isValid = (surveyInfo) => surveyInfo && surveyInfo.id

// ====== AUTH GROUPS

export const { getAuthGroups } = ObjectUtils

const _getAuthGroupByName = (name) => R.pipe(getAuthGroups, R.find(R.propEq(AuthGroup.keys.name, name)))

export const getAuthGroupAdmin = _getAuthGroupByName(AuthGroup.groupNames.surveyAdmin)

export const isAuthGroupAdmin = (group) => (surveyInfo) => AuthGroup.isEqual(group)(getAuthGroupAdmin(surveyInfo))

export const assocAuthGroups = R.assoc(keys.authGroups)
