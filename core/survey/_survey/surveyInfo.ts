import * as A from '@core/arena'

import { DEFAULT_SRS, Objects, Surveys } from '@openforis/arena-core'

import * as AuthGroup from '@core/auth/authGroup'
import { ExtraPropDef } from '@core/survey/extraPropDef'

import * as ObjectUtils from '@core/objectUtils'
import * as StringUtils from '@core/stringUtils'

import * as SamplingPolygon from '../SamplingPolygon'

export const keys = {
  id: ObjectUtils.keys.id,
  uuid: ObjectUtils.keys.uuid,
  info: 'info',
  ownerUuid: 'ownerUuid',
  ownerName: 'ownerName',
  draft: 'draft',
  published: ObjectUtils.keys.published,
  datePublished: 'datePublished',
  appVersion: 'appVersion',
  authGroups: 'authGroups',
  props: ObjectUtils.keys.props,
  rdbInitialized: 'rdbInitialized',
  // Props
  collectUri: 'collectUri',
  collectReport: 'collectReport',
  collectNodeDefsInfoByPath: 'collectNodeDefsInfoByPath',
  odkFormId: 'odkFormId',
  odkNodeDefsInfoByPath: 'odkNodeDefsInfoByPath',
  odkNodeDefsOriginalNames: 'odkNodeDefsOriginalNames',
  cycles: 'cycles',
  defaultCycleKey: 'defaultCycleKey',
  descriptions: ObjectUtils.keysProps.descriptions,
  fieldManualLinks: 'fieldManualLinks',
  name: 'name',
  labels: ObjectUtils.keysProps.labels,
  languages: 'languages',
  preloadedMapLayers: 'preloadedMapLayers',
  preloadedMapLayersEnabled: 'preloadedMapLayersEnabled',
  surveyDocImages: 'surveyDocImages',
  surveyDocOptions: 'surveyDocOptions',
  branding: 'branding',
  sampleBasedImageInterpretationEnabled: 'sampleBasedImageInterpretationEnabled',
  samplingPolygon: 'samplingPolygon',
  security: 'security',
  srs: 'srs',
  steps: 'steps',
  template: 'template',
  userExtraPropDefs: 'userExtraPropDefs',
  // Temporary properties
  activityLogSize: 'activityLogSize',
  dbStatistics: 'dbStatistics',
  filesStatistics: 'filesStatistics',
  temporary: 'temporary',
}

export const collectReportKeys = {
  issuesTotal: 'issuesTotal',
  issuesResolved: 'issuesResolved',
}

export const cycleOneKey = '0'

export { samplingPointDataCategoryName } from '@core/survey/category'

export const status = {
  draft: 'draft',
  published: 'published',
  publishedDraft: 'published-draft',
}

export const getInfo = (survey: any) => (survey.info ? survey.info : survey) // backwards compatibility: survey info were associated to 'info' prop

export const isRdbInitialized = A.propOr(false, keys.rdbInitialized)

// ====== READ surveyInfo
export const { getId, getUuid, getProps, getPropsDraft, isPublished, getDescription, getDescriptions, getLabels } =
  ObjectUtils

export const getName = (survey): string => ObjectUtils.getProp(keys.name, '')(survey) as string

export const getOwnerUuid = A.propOr(null, keys.ownerUuid)

export const getOwnerName = A.propOr('', keys.ownerName)

export const getAppVersion = A.propOr(null, keys.appVersion)

export const isDraft = A.propEq(keys.draft, true)

export const getDbStatistics = A.propOr({}, keys.dbStatistics)

export const getFilesStatistics = A.propOr({}, keys.filesStatistics)

export const getActivityLogSize = A.propOr(-1, keys.activityLogSize)

export const getLanguages = ObjectUtils.getProp(keys.languages, [])

export const getDefaultLanguage = A.pipe(getLanguages, A.head)

export const getDefaultLabel = (surveyInfo) => {
  const labels = ObjectUtils.getLabels(surveyInfo)
  const lang = getDefaultLanguage(surveyInfo)
  return A.prop(lang, labels)
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

export const isPreloadedMapLayersEnabled = ObjectUtils.isPropTrue(keys.preloadedMapLayersEnabled)

export const getPreloadedMapLayers = ObjectUtils.getProp(keys.preloadedMapLayers, [])

export const getSurveyDocImages = ObjectUtils.getProp(keys.surveyDocImages, [])

export const getSurveyDocOptions = ObjectUtils.getProp(keys.surveyDocOptions, {})

export const isDocHeaderOnFirstPageOnly = (surveyInfo: any): boolean =>
  (getSurveyDocOptions(surveyInfo) as Record<string, unknown>)?.headerOnFirstPageOnly !== false

export const isDocPageNumberingEnabled = (surveyInfo: any): boolean =>
  (getSurveyDocOptions(surveyInfo) as Record<string, unknown>)?.pageNumbering !== false

export const isSampleBasedImageInterpretationEnabled = ObjectUtils.isPropTrue(
  keys.sampleBasedImageInterpretationEnabled
)
export const getSamplingPolygon = (surveyInfo) => {
  const samplingPolygon = ObjectUtils.getProp(keys.samplingPolygon, {})(surveyInfo) as object
  return { ...SamplingPolygon.getSamplingPolygonDefaults(), ...samplingPolygon }
}

export const getSecurity = Surveys.getSecurity

export const getSRS = (surveyInfo): any[] => ObjectUtils.getProp(keys.srs, [])(surveyInfo) as any[]

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

export const getDefaultSRS = A.pipe(getSRS, A.head)

export const getStatus = (surveyInfo) => {
  const published = isPublished(surveyInfo)
  const draft = isDraft(surveyInfo)
  if (published && draft) return status.publishedDraft
  if (published) return status.published
  if (draft) return status.draft
  return ''
}

export const getCycles = ObjectUtils.getProp(keys.cycles)

export const getCycleKeys = A.pipe(getCycles, A.keys)

const getLastCycleKey = A.pipe(getCycleKeys, A.last)

export const getDefaultCycleKey = (surveyInfo) => {
  const defaultCycleKey = ObjectUtils.getProp(keys.defaultCycleKey)(surveyInfo)
  return Objects.isEmpty(defaultCycleKey) ? getLastCycleKey(surveyInfo) : defaultCycleKey
}

export const { getDateCreated, getDateModified } = ObjectUtils

export const getDatePublished = ObjectUtils.getDate(keys.datePublished)

export const getCollectUri = ObjectUtils.getProp(keys.collectUri)

export const getCollectReport = ObjectUtils.getProp(keys.collectReport, {})

export const hasCollectReportIssues = A.pipe(
  getCollectReport,
  A.propSatisfies((total) => total > 0, collectReportKeys.issuesTotal)
)

export const getCollectNodeDefsInfoByPath = ObjectUtils.getProp(keys.collectNodeDefsInfoByPath, {})

export const isFromCollect = A.pipe(getCollectUri, A.isNil, A.not)

export const getOdkFormId = ObjectUtils.getProp(keys.odkFormId)

export const isFromOdk = A.pipe(getOdkFormId, A.isNil, A.not)

export const getOdkNodeDefsInfoByPath = ObjectUtils.getProp(keys.odkNodeDefsInfoByPath, {})

// Dictionary of the raw (pre-normalization, pre-uniqueness) ODK element name and the final Arena node
// def name generated for it, keyed by node def uuid - see NodeDefsImportJob.
export const getOdkNodeDefsOriginalNames = ObjectUtils.getProp(keys.odkNodeDefsOriginalNames, {})

export const getLanguage = (preferredLang) => (surveyInfo) =>
  A.pipe(getLanguages, A.find(A.equals(preferredLang)), A.defaultTo(getDefaultLanguage(surveyInfo)))(surveyInfo)

export const isTemplate = A.propEq(keys.template, true)

export const getFieldManualLinks = ObjectUtils.getProp(keys.fieldManualLinks, {})

export const getUserExtraPropDefs = ObjectUtils.getProp(keys.userExtraPropDefs, {})

export const getUserExtraPropDefsArray = A.pipe(getUserExtraPropDefs, ExtraPropDef.extraDefsToArray)

// ====== UPDATE
export const markDraft = A.assoc(keys.draft, true)

export const assocDbStatistics = A.assoc(keys.dbStatistics)

export const assocFilesStatistics = A.assoc(keys.filesStatistics)

export const assocActivityLogSize = A.assoc(keys.activityLogSize)

export const assocSrs = (srs) => ObjectUtils.setProp(keys.srs, srs)

export const assocRDBInitilized = A.assoc(keys.rdbInitialized)

export const assocOwnerUuid = A.assoc(keys.ownerUuid)

// ====== UTILS

export const isValid = (surveyInfo) => !!surveyInfo?.id
export const canHaveRecords = (surveyInfo) =>
  isValid(surveyInfo) && !isTemplate(surveyInfo) && isRdbInitialized(surveyInfo)

// ====== AUTH GROUPS

export const { getAuthGroups } = ObjectUtils

export const getAuthGroupByName = (groupName) => (surveyInfo) => {
  const authGroups = getAuthGroups(surveyInfo)
  return authGroups.find((authGroup) => AuthGroup.getName(authGroup) === groupName)
}

const _getAuthGroupByName = (name) => A.pipe(getAuthGroups, A.find(A.propEq(AuthGroup.keys.name, name)))

export const getAuthGroupAdmin = _getAuthGroupByName(AuthGroup.groupNames.surveyAdmin)

export const isAuthGroupAdmin = (group) => (surveyInfo) => AuthGroup.isEqual(group)(getAuthGroupAdmin(surveyInfo))

export const assocAuthGroups = A.assoc(keys.authGroups)
