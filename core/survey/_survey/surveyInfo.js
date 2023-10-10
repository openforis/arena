import * as R from 'ramda'

import { DEFAULT_SRS, Objects } from '@openforis/arena-core'

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
  published: ObjectUtils.keys.published,
  authGroups: 'authGroups',
  props: ObjectUtils.keys.props,
  rdbInitialized: 'rdbInitialized',
  // Props
  collectUri: 'collectUri',
  collectReport: 'collectReport',
  collectNodeDefsInfoByPath: 'collectNodeDefsInfoByPath',
  cycles: 'cycles',
  defaultCycleKey: 'defaultCycleKey',
  descriptions: ObjectUtils.keysProps.descriptions,
  filesStatistics: 'filesStatistics',
  name: 'name',
  labels: ObjectUtils.keysProps.labels,
  languages: 'languages',
  sampleBasedImageInterpretationEnabled: 'sampleBasedImageInterpretationEnabled',
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

export const samplingPointDataCategoryName = 'sampling_point_data'

export const status = {
  draft: 'DRAFT',
  published: 'PUBLISHED',
  publishedDraft: 'PUBLISHED-DRAFT',
}

export const getInfo = (survey) => (survey.info ? survey.info : survey) // backwards compatibility: survey info were associated to 'info' prop

export const isRdbInitialized = R.propOr(false, keys.rdbInitialized)

// ====== READ surveyInfo
export const { getId, getUuid, getProps, getPropsDraft, isPublished, getDescription, getDescriptions, getLabels } =
  ObjectUtils

export const getName = ObjectUtils.getProp(keys.name, '')

export const getOwnerUuid = R.propOr(null, keys.ownerUuid)

export const getOwnerName = R.propOr('', keys.ownerName)

export const isDraft = R.propEq(keys.draft, true)

export const getFilesStatistics = R.propOr({}, keys.filesStatistics)

export const getLanguages = ObjectUtils.getProp(keys.languages, [])

export const getDefaultLanguage = R.pipe(getLanguages, R.head)

export const getDefaultLabel = (surveyInfo) => {
  const labels = ObjectUtils.getLabels(surveyInfo)
  const lang = getDefaultLanguage(surveyInfo)
  return R.prop(lang, labels)
}

export const getDefaultDescription = (surveyInfo) => {
  const lang = getDefaultLanguage(surveyInfo)
  return ObjectUtils.getDescription(lang, '')(surveyInfo)
}

export const getLabel = (surveyInfo, lang, defaultToName = true) => {
  const label = ObjectUtils.getLabel(lang)(surveyInfo)
  if (StringUtils.isNotBlank(label)) {
    return label
  }
  if (defaultToName) {
    return getName(surveyInfo)
  }
  return null
}

export const isSampleBasedImageInterpretationEnabled = ObjectUtils.isPropTrue(
  keys.sampleBasedImageInterpretationEnabled
)
export const getSamplingPolygon = ObjectUtils.getProp(keys.samplingPolygon, {})

export const getSRS = ObjectUtils.getProp(keys.srs, [])

export const getSRSCodes = (survey) => getSRS(survey).map((srs) => srs.code)

export const getSRSIndex = (survey) => {
  const srss = getSRS(survey)
  const srssIndex = ObjectUtils.toIndexedObj(srss, 'code')
  if (!srssIndex[DEFAULT_SRS.code]) {
    // always include default SRS (lat-long, EPSG:4326)
    srssIndex[DEFAULT_SRS.code] = DEFAULT_SRS
  }
  return srssIndex
}

export const getDefaultSRS = R.pipe(getSRS, R.head)

export const getStatus = (surveyInfo) => {
  const published = isPublished(surveyInfo)
  const draft = isDraft(surveyInfo)
  if (published && draft) return status.publishedDraft
  if (published) return status.published
  if (draft) return status.draft
  return ''
}

export const getCycles = ObjectUtils.getProp(keys.cycles)

export const getCycleKeys = R.pipe(getCycles, R.keys)

const getLastCycleKey = R.pipe(getCycleKeys, R.last)

export const getDefaultCycleKey = (surveyInfo) => {
  const defaultCycleKey = ObjectUtils.getProp(keys.defaultCycleKey)(surveyInfo)
  return Objects.isEmpty(defaultCycleKey) ? getLastCycleKey(surveyInfo) : defaultCycleKey
}

export const { getDateCreated, getDateModified } = ObjectUtils

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

export const assocFilesStatistics = R.assoc(keys.filesStatistics)

export const assocSrs = (srs) => ObjectUtils.setProp(keys.srs, srs)

export const assocRDBInitilized = R.assoc(keys.rdbInitialized)

// ====== UTILS

export const isValid = (surveyInfo) => surveyInfo && surveyInfo.id

// ====== AUTH GROUPS

export const { getAuthGroups } = ObjectUtils

export const getAuthGroupByName = (groupName) => (surveyInfo) => {
  const authGroups = getAuthGroups(surveyInfo)
  return authGroups.find((authGroup) => AuthGroup.getName(authGroup) === groupName)
}

const _getAuthGroupByName = (name) => R.pipe(getAuthGroups, R.find(R.propEq(AuthGroup.keys.name, name)))

export const getAuthGroupAdmin = _getAuthGroupByName(AuthGroup.groupNames.surveyAdmin)

export const isAuthGroupAdmin = (group) => (surveyInfo) => AuthGroup.isEqual(group)(getAuthGroupAdmin(surveyInfo))

export const assocAuthGroups = R.assoc(keys.authGroups)
