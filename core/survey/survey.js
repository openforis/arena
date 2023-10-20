import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'

import * as Srs from '@core/geo/srs'

import * as SurveySortKeys from './_survey/surveySortKeys'

import * as SurveyInfo from './_survey/surveyInfo'
import * as SurveyCycle from './surveyCycle'
import * as SurveyNodeDefs from './_survey/surveyNodeDefs'
import * as NodeDefLayoutUpdater from './nodeDefLayoutUpdater'
import * as SurveyNodeDefsValidation from './_survey/surveyNodeDefsValidation'
import * as SurveyCategories from './_survey/surveyCategories'
import * as SurveyTaxonomies from './_survey/surveyTaxonomies'
import * as SurveyDefaults from './_survey/surveyDefaults'
import * as SurveyDependencies from './_survey/surveyDependencies'
import * as SurveyRefDataIndex from './_survey/surveyRefDataIndex'
import * as SurveyNodeDefsIndex from './_survey/surveyNodeDefsIndex'
import * as SurveyAnalysis from './_survey/surveyAnalysis'

/**
 * Creates a new survey info object with the specified parameters.
 *
 * @param {!object} params - The cration parameters.
 * @param {!string} params.ownerUuid - The owner user UUID.
 * @param {!string} params.name - The survey name.
 * @param {!Array.<string>} params.languages - The survey languages.
 * @param {string} [params.label=null] - The label in the default language.
 * @param {object} [params.otherProps=null] - Other props to set.
 * @returns {object} The newly created survey info object.
 */
export const newSurvey = ({
  ownerUuid,
  name,
  label = null,
  languages,
  srs = null,
  published = false,
  draft = true,
  template = false,
  ...rest
}) => ({
  [SurveyInfo.keys.uuid]: uuidv4(),
  [SurveyInfo.keys.props]: {
    [SurveyInfo.keys.name]: name,
    [SurveyInfo.keys.languages]: languages,
    [SurveyInfo.keys.labels]: label ? { [languages[0]]: label } : {},
    [SurveyInfo.keys.srs]: srs && srs.length > 0 ? srs : [R.omit([Srs.keys.wkt], Srs.latLonSrs)],
    [SurveyInfo.keys.cycles]: {
      [SurveyInfo.cycleOneKey]: SurveyCycle.newCycle(),
    },
    ...rest,
  },
  [SurveyInfo.keys.published]: published,
  [SurveyInfo.keys.draft]: draft,
  [SurveyInfo.keys.ownerUuid]: ownerUuid,
  [SurveyInfo.keys.template]: template,
})

export const { keys: infoKeys, status } = SurveyInfo
export const { dependencyTypes } = SurveyDependencies
export const { collectReportKeys, cycleOneKey, samplingPointDataCategoryName } = SurveyInfo
export const { sortableKeys } = SurveySortKeys

// ====== DEFAULTS
export const { getDefaultAuthGroups } = SurveyDefaults

// READ
export const getSurveyInfo = SurveyInfo.getInfo
export const getId = R.pipe(getSurveyInfo, SurveyInfo.getId)
export const getIdSurveyInfo = SurveyInfo.getId
export const canHaveData = (survey) => {
  const surveyInfo = getSurveyInfo(survey)
  return isPublished(surveyInfo) || isFromCollect(surveyInfo)
}
/**
 * Returns true if all the root key attribute definitions are code attributes using the sampling point data category.
 *
 * @param {!object} survey - The survey object.
 * @returns {boolean} - True if all key attributes are using the sampling point data category.
 */
export const canRecordBeIdentifiedBySamplingPointDataItem = (survey) => {
  const samplingPointDataNodeDefs = getSamplingPointDataNodeDefs(survey)
  if (samplingPointDataNodeDefs.length === 0) return false

  const rootEntityKeyDefs = SurveyNodeDefs.getNodeDefRootKeys(survey)

  const allKeyDefsUseSamplingPointData = rootEntityKeyDefs.every((rootKeyDef) =>
    samplingPointDataNodeDefs.includes(rootKeyDef)
  )
  return allKeyDefsUseSamplingPointData
}

// === context is surveyInfo
export const {
  getUuid,
  getName,
  getLanguages,
  getLanguage,
  getDefaultLanguage,
  getLabels,
  getLabel,
  getDefaultDescription,
  getDefaultLabel,
  getDescription,
  getDescriptions,
  isSampleBasedImageInterpretationEnabled,
  getSamplingPolygon,
  getSRS,
  getSRSCodes,
  getSRSIndex,
  getDefaultSRS,
  getStatus,
  getCycles,
  getCycleKeys,
  getDefaultCycleKey,
  getDateCreated,
  getDateModified,
  isPublished,
  isDraft,
  isValid,
  isFromCollect,
  isRdbInitialized,
  getCollectUri,
  getCollectReport,
  getCollectNodeDefsInfoByPath,
  hasCollectReportIssues,
  getOwnerName,
  getOwnerUuid,
  isTemplate,
  getProps,
  getPropsDraft,
  getFilesStatistics,
} = SurveyInfo

export const { getAuthGroupByName, getAuthGroups, isAuthGroupAdmin, getAuthGroupAdmin } = SurveyInfo

// UPDATE
export const { assocAuthGroups, assocFilesStatistics, assocRDBInitilized, assocSrs, markDraft } = SurveyInfo

// ====== READ nodeDefs
export const {
  getNodeDefs,
  getNodeDefsArray,
  getNodeDefsByUuids,
  getNodeDefRoot,
  getNodeDefRootKeys,
  getNodeDefsRootUnique,
  getNodeDefByUuid,
  getNodeDefChildren,
  getNodeDefChildrenInOwnPage,
  hasNodeDefChildrenEntities,
  getNodeDefChildrenSorted,
  getNodeDefChildByName,
  getNodeDefSiblingByName,
  getNodeDefByName,
  getNodeDefsByCategoryUuid,
  getNodeDefsByTaxonomyUuid,
  getNodeDefParent,
  getNodeDefSource,
  getNodeDefKeys,
  getNodeDefKeysSorted,
  isNodeDefRootKey,
  findNodeDef,
  getNodeDefAreaBasedEstimate,
  getAreaBasedEstimatedOfNodeDef,
} = SurveyNodeDefs

// Hierarchy
export const {
  isNodeDefAncestor,
  visitAncestorsAndSelf,
  visitAncestors,
  getNodeDefPath,
  getHierarchy,
  traverseHierarchyItem,
  traverseHierarchyItemSync,
  getDescendantsAndSelf,
  visitDescendantsAndSelf,
  findDescendants,
  getNodeDefDescendantsInSingleEntities,
  getNodeDefDescendantAttributesInSingleEntities,
  getNodeDefAncestorMultipleEntity,
  getNodeDefAncestorsKeyAttributes,
  getNodeDefAncestorsKeyAttributesByAncestorUuid,
} = SurveyNodeDefs

// ====== READ dependencies
export const {
  addNodeDefDependencies,
  addNodeDefsDependencies,
  getDependencyGraph,
  getNodeDefDependencies,
  getNodeDefDependentsUuids,
  hasDependencyGraph,
  isNodeDefDependentOn,
  removeNodeDefDependencies,
} = SurveyDependencies

// ====== UPDATE
export const { dissocNodeDef, mergeNodeDefs } = SurveyNodeDefs

// replace all the node defs in the survey with the specified ones
export const assocNodeDefs =
  ({ nodeDefs, updateDependencyGraph = false }) =>
  (survey) => {
    let surveyUpdated = SurveyNodeDefs.assocNodeDefs(nodeDefs)(survey)
    if (updateDependencyGraph) {
      surveyUpdated = SurveyDependencies.buildAndAssocDependencyGraph(surveyUpdated)
    }
    return surveyUpdated
  }

export const assocNodeDef =
  ({ nodeDef, updateDependencyGraph = false }) =>
  (survey) => {
    let surveyUpdated = SurveyNodeDefs.assocNodeDef(nodeDef)(survey)
    // update node defs index
    const nodeDefsIndex = SurveyNodeDefsIndex.getNodeDefsIndex(surveyUpdated)
    const nodeDefsIndexUpdated = SurveyNodeDefsIndex.addNodeDefToIndex({ nodeDefsIndex, nodeDef })
    surveyUpdated = SurveyNodeDefsIndex.assocNodeDefsIndex({
      survey: surveyUpdated,
      nodeDefsIndex: nodeDefsIndexUpdated,
    })

    if (updateDependencyGraph) {
      surveyUpdated = SurveyDependencies.removeNodeDefDependencies(nodeDef.uuid)(surveyUpdated)
      surveyUpdated = SurveyDependencies.addNodeDefDependencies(nodeDef)(surveyUpdated)
    }
    return surveyUpdated
  }

export const { updateLayoutProp } = NodeDefLayoutUpdater
export const { assocDependencyGraph } = SurveyDependencies
export const buildDependencyGraph = SurveyDependencies.buildGraph
export const { buildAndAssocDependencyGraph } = SurveyDependencies

export const { addNodeDefToIndex, deleteNodeDefIndex, initNodeDefsIndex, initAndAssocNodeDefsIndex } =
  SurveyNodeDefsIndex

// ====== NodeDefsValidation
export const { getNodeDefsValidation, assocNodeDefsValidation, getNodeDefValidation } = SurveyNodeDefsValidation

// ====== NodeDef Code
export const { getNodeDefCategoryLevelIndex, getNodeDefParentCode, getNodeDefCodeCandidateParents } = SurveyNodeDefs

// TODO check where used
export const { canUpdateCategory, isNodeDefParentCode } = SurveyNodeDefs

// ====== Categories
export const {
  getCategories,
  getCategoriesArray,
  getCategoryByUuid,
  getCategoryByName,
  getSamplingPointDataCategory,
  getSamplingPointDataNodeDefs,
  isCategoryUnused,
  assocCategory,
  assocCategories,
} = SurveyCategories

// ====== Taxonomies
export const { getTaxonomiesArray, getTaxonomyByName, getTaxonomyByUuid, assocTaxonomies } = SurveyTaxonomies

// ====== Survey Reference data index
// Category index
export const { getCategoryItemUuidAndCodeHierarchy, getCategoryItemByUuid, getCategoryItemByHierarchicalCodes } =
  SurveyRefDataIndex
// Taxon index
export const {
  getTaxonByCode,
  getTaxonUuid,
  getTaxonVernacularNameUuid,
  getTaxonByUuid,
  includesTaxonVernacularName,
  assocRefData,
} = SurveyRefDataIndex

// Analysis
export const {
  getAnalysisNodeDefs,
  getAnalysisEntities,
  getBaseUnitNodeDef,
  getSamplingNodeDefChild,
  getAvailableReportingDataNodeDefs,
} = SurveyAnalysis
