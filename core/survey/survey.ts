import type { ArenaAnyNodeDef, ArenaNodeDefMap, ArenaSurvey } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Srs from '@core/geo/srs'
import { uuidv4 } from '@core/uuid'

import * as SurveyAnalysis from './_survey/surveyAnalysis'
import * as SurveyCategories from './_survey/surveyCategories'
import * as SurveyConfig from './_survey/surveyConfig'
import * as SurveyDependencies from './_survey/surveyDependencies'
import * as SurveyInfo from './_survey/surveyInfo'
import * as SurveyNodeDefs from './_survey/surveyNodeDefs'
import * as SurveyNodeDefsIndex from './_survey/surveyNodeDefsIndex'
import * as SurveyNodeDefsValidation from './_survey/surveyNodeDefsValidation'
import * as SurveyRefDataIndex from './_survey/surveyRefDataIndex'
import * as SurveySortKeys from './_survey/surveySortKeys'
import * as SurveyTaxonomies from './_survey/surveyTaxonomies'
import * as Category from './category'
import * as NodeDef from './nodeDef'
import * as NodeDefLayoutUpdater from './nodeDefLayoutUpdater'
import * as SurveyCycle from './surveyCycle'
import * as Taxonomy from './taxonomy'

type SurveyUpdater = (survey: ArenaSurvey) => ArenaSurvey

type NewSurveyParams = {
  ownerUuid: string
  name: string
  languages?: string[]
  label?: string | null
  srs?: Record<string, unknown>[] | null
  published?: boolean
  draft?: boolean
  template?: boolean
  [otherProp: string]: unknown
}

/**
 * Creates a new survey info object with the specified parameters.
 * @param params - The creation parameters; props other than the listed ones are set as survey props.
 * @returns The newly created survey info object.
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
}: NewSurveyParams): ArenaSurvey =>
  ({
    [SurveyInfo.keys.uuid]: uuidv4(),
    [SurveyInfo.keys.props]: {
      [SurveyInfo.keys.name]: name,
      [SurveyInfo.keys.languages]: languages,
      [SurveyInfo.keys.labels]: label ? { [languages?.[0]]: label } : {},
      [SurveyInfo.keys.srs]: srs && srs.length > 0 ? srs : [A.omit([Srs.keys.wkt], Srs.latLonSrs)],
      [SurveyInfo.keys.cycles]: { [SurveyInfo.cycleOneKey]: SurveyCycle.newCycle() },
      ...rest,
    },
    [SurveyInfo.keys.published]: published,
    [SurveyInfo.keys.draft]: draft,
    [SurveyInfo.keys.ownerUuid]: ownerUuid,
    [SurveyInfo.keys.template]: template,
  }) as unknown as ArenaSurvey

export const { configKeys } = SurveyConfig
export const { keys: infoKeys, status } = SurveyInfo
export const { dependencyTypes } = SurveyDependencies
export const { collectReportKeys, cycleOneKey, samplingPointDataCategoryName } = SurveyInfo
export const { sortableKeys } = SurveySortKeys

// ====== DEFAULTS
export { createDefaultAuthGroups as getDefaultAuthGroups } from '@openforis/arena-core'

// READ
export const getSurveyInfo = SurveyInfo.getInfo
export const getId = (survey: ArenaSurvey): number => SurveyInfo.getId(getSurveyInfo(survey)) as number
export const getIdSurveyInfo = SurveyInfo.getId
export const canHaveData = (survey: ArenaSurvey): boolean => {
  const surveyInfo = getSurveyInfo(survey)
  return isPublished(surveyInfo) || isFromCollect(surveyInfo) || isFromOdk(surveyInfo)
}
/**
 * Returns true if all the root key attribute definitions are code attributes using the sampling point data category.
 * @param survey - The survey object.
 * @returns True if all key attributes are using the sampling point data category.
 */
export const canRecordBeIdentifiedBySamplingPointDataItem = (survey: ArenaSurvey): boolean => {
  const samplingPointDataNodeDefs: ArenaAnyNodeDef[] = getSamplingPointDataNodeDefs(survey)
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
  getFieldManualLinks,
  isKeepNonApplicableValues,
  isNotifyAdminsOnRecordsUploadFromMobile,
  isFormPreviewForDataEntryUsers,
  getUserExtraPropDefs,
  getUserExtraPropDefsArray,
  isSampleBasedImageInterpretationEnabled,
  getSamplingPolygon,
  isPreloadedMapLayersEnabled,
  getPreloadedMapLayers,
  getSurveyDocImages,
  isDocHeaderOnFirstPageOnly,
  isDocPageNumberingEnabled,
  getSecurity,
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
  getDatePublished,
  isPublished,
  isDraft,
  isFromCollect,
  isFromOdk,
  isRdbInitialized,
  getCollectUri,
  getCollectReport,
  getCollectNodeDefsInfoByPath,
  hasCollectReportIssues,
  getOdkFormId,
  getOdkNodeDefsInfoByPath,
  getOwnerName,
  getOwnerUuid,
  getAppVersion,
  isTemplate,
  getProps,
  getPropsDraft,
  // Temporary properties
  getActivityLogSize,
  getDbStatistics,
  getFilesStatistics,
  isValid,
  canHaveRecords,
} = SurveyInfo

export {
  getBranding,
  getPrimaryColor,
  getSurveyLogoBySlot,
  getSurveyLogos,
  surveyLogoKeys,
  getLandingBackground,
  getTitleFontSizeRem,
  getDescriptionFontSizeRem,
  fontSizePreset,
} from './surveyBranding'

export const { getAuthGroupByName, getAuthGroups, isAuthGroupAdmin, getAuthGroupAdmin } = SurveyInfo

// UPDATE
export const {
  assocAuthGroups,
  assocActivityLogSize,
  assocDbStatistics,
  assocFilesStatistics,
  assocOwnerUuid,
  assocRDBInitilized,
  assocSrs,
  markDraft,
} = SurveyInfo

// ====== READ nodeDefs
export const {
  getNodeDefs,
  getNodeDefsArray,
  getNodeDefsByUuids,
  getNodeDefRoot,
  getQualifierNodeDefs,
  getNodeDefRootKeys,
  getNodeDefRootKeysSorted,
  getNodeDefsRootUnique,
  getNodeDefByUuid,
  getNodeDefChildren,
  getNodeDefChildrenInOwnPage,
  hasNodeDefChildrenEntities,
  getNodeDefChildrenSorted,
  getNodeDefChildByName,
  getNodeDefByName,
  getNodeDefsByCategoryUuid,
  getNodeDefsByTaxonomyUuid,
  getNodeDefParent,
  getNodeDefSource,
  getNodeDefKeys,
  getNodeDefKeysSorted,
  getSummaryDefs,
  getRootSummaryDefs,
  isNodeDefRootKey,
  canNodeDefBeQualifier,
  findNodeDef,
  findNodeDefByName,
  getNodeDefAreaBasedEstimate,
  getAreaBasedEstimatedOfNodeDef,
  getNodeDefMaxDecimalDigits,
  getOlapDataTableEntityDefs,
} = SurveyNodeDefs

// Hierarchy
export const {
  isNodeDefAncestor,
  findAncestor,
  findAncestors,
  visitAncestorsAndSelf,
  visitAncestors,
  getNodeDefPath,
  getHierarchy,
  traverseHierarchyItem,
  traverseHierarchyItemSync,
  visitDescendantsAndSelf,
  findDescendants,
  getNodeDefDescendants,
  getNodeDefDescendantsAndSelf,
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
export const { dissocNodeDef, mergeNodeDefs, cloneNodeDef } = SurveyNodeDefs

// replace all the node defs in the survey with the specified ones
export const assocNodeDefsSimple =
  ({ nodeDefs }: { nodeDefs: ArenaNodeDefMap }): SurveyUpdater =>
  (survey) =>
    SurveyNodeDefs.assocNodeDefs(nodeDefs)(survey)

export const assocNodeDefs =
  ({ nodeDefs, updateDependencyGraph = false }: { nodeDefs: ArenaNodeDefMap; updateDependencyGraph?: boolean }) =>
  async (survey: ArenaSurvey): Promise<ArenaSurvey> => {
    let surveyUpdated = assocNodeDefsSimple({ nodeDefs })(survey)
    if (updateDependencyGraph) {
      surveyUpdated = await SurveyDependencies.buildAndAssocDependencyGraph(surveyUpdated)
    }
    return surveyUpdated
  }

// to update the dependency graph too, use assocNodeDefs with updateDependencyGraph (it's async)
export const assocNodeDef =
  ({ nodeDef }: { nodeDef: ArenaAnyNodeDef }): SurveyUpdater =>
  (survey) => {
    let surveyUpdated = SurveyNodeDefs.assocNodeDef(nodeDef)(survey)
    // update node defs index
    const nodeDefsIndex = SurveyNodeDefsIndex.getNodeDefsIndex(surveyUpdated)
    const nodeDefsIndexUpdated = SurveyNodeDefsIndex.addNodeDefToIndex({ nodeDefsIndex, nodeDef })
    surveyUpdated = SurveyNodeDefsIndex.assocNodeDefsIndex({
      survey: surveyUpdated,
      nodeDefsIndex: nodeDefsIndexUpdated,
    })
    return surveyUpdated
  }

export const { updateLayoutProp } = NodeDefLayoutUpdater
export const { assocDependencyGraph } = SurveyDependencies
export const buildDependencyGraph = SurveyDependencies.buildGraph
export const { buildAndAssocDependencyGraph } = SurveyDependencies

export const {
  addNodeDefToIndex,
  updateNodeDefUuidByNameIndex,
  deleteNodeDefIndex,
  initNodeDefsIndex,
  initAndAssocNodeDefsIndex,
} = SurveyNodeDefsIndex

// ====== NodeDefsValidation
export const { getNodeDefsValidation, assocNodeDefsValidation, getNodeDefValidation } = SurveyNodeDefsValidation

// ====== NodeDef Code
export const {
  getNodeDefCategoryLevelIndex,
  getNodeDefParentCode,
  getNodeDefAncestorCodes,
  getNodeDefCodeCandidateParents,
} = SurveyNodeDefs

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
export const { getTaxonomiesArray, getTaxonomyByName, getTaxonomyByUuid, assocTaxonomies, isTaxonomyUnused } =
  SurveyTaxonomies

// ====== Survey Reference data index
// Category index
export const {
  getCategoryItemUuidAndCodeHierarchy,
  getCategoryItemByUuid,
  getCategoryItemByHierarchicalCodes,
  getCategoryItemsInLevel,
} = SurveyRefDataIndex

export const getNodeDefCategoryItems = (nodeDef: ArenaAnyNodeDef) => (survey: ArenaSurvey) => {
  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
  const levelIndex = SurveyNodeDefs.getNodeDefCategoryLevelIndex(nodeDef)(survey)
  return SurveyRefDataIndex.getCategoryItemsInLevel({ categoryUuid, levelIndex })(survey)
}

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

// ====== Clone node defs from another survey: category/taxonomy references resolution

type SurveyItemGetter<T> = (key: string) => (survey: ArenaSurvey) => T | null | undefined

type ResolveClonedNodeDefsRefsParams<T> = {
  clonedNodeDefs: ArenaAnyNodeDef[]
  sourceSurvey: ArenaSurvey
  targetSurvey: ArenaSurvey
  isRefNodeDef: (nodeDef: ArenaAnyNodeDef) => boolean
  getRefUuid: (nodeDef: ArenaAnyNodeDef) => string | null
  propKey: string
  getItemByUuidInSurvey: SurveyItemGetter<T>
  getItemByNameInSurvey: SurveyItemGetter<T>
  getItemName: (item: T) => string
  getItemUuid: (item: T) => string
}

const _resolveClonedNodeDefsRefs = <T>({
  clonedNodeDefs,
  sourceSurvey,
  targetSurvey,
  isRefNodeDef,
  getRefUuid,
  propKey,
  getItemByUuidInSurvey,
  getItemByNameInSurvey,
  getItemName,
  getItemUuid,
}: ResolveClonedNodeDefsRefsParams<T>): { clonedNodeDefs: ArenaAnyNodeDef[]; uuidsToClone: string[] } => {
  const uuidsToClone: string[] = []
  const rewriteByOldUuid: Record<string, string> = {}
  const processedUuids = new Set<string>()

  for (const nodeDef of clonedNodeDefs.filter(isRefNodeDef)) {
    const refUuid = getRefUuid(nodeDef)
    if (!refUuid || processedUuids.has(refUuid)) continue
    processedUuids.add(refUuid)

    if (getItemByUuidInSurvey(refUuid)(targetSurvey)) {
      // Already present in the target survey with the same uuid: reuse as-is.
      continue
    }
    const sourceItem = getItemByUuidInSurvey(refUuid)(sourceSurvey)
    if (!sourceItem) {
      // Dangling reference in the source survey: leave the cloned attribute as-is.
      continue
    }
    const existingItemByName = getItemByNameInSurvey(getItemName(sourceItem))(targetSurvey)
    if (existingItemByName) {
      rewriteByOldUuid[refUuid] = getItemUuid(existingItemByName)
      continue
    }
    uuidsToClone.push(refUuid)
  }

  const clonedNodeDefsUpdated =
    Object.keys(rewriteByOldUuid).length === 0
      ? clonedNodeDefs
      : clonedNodeDefs.map((nodeDef) => {
          const refUuid = getRefUuid(nodeDef)
          const newRefUuid = rewriteByOldUuid[refUuid]
          return newRefUuid ? NodeDef.assocProp({ key: propKey, value: newRefUuid })(nodeDef) : nodeDef
        })

  return { clonedNodeDefs: clonedNodeDefsUpdated, uuidsToClone }
}

/**
 * Given the node defs cloned from another survey (see Survey.cloneNodeDef), for every code/taxon
 * attribute in the cloned subtree, resolves the category/taxonomy it should be associated with in
 * the target survey: an already existing one (matched by uuid or by name), or one that still needs
 * to be cloned from the source survey. Cloned attributes associated with an existing item matched
 * by name (different uuid) get their categoryUuid/taxonomyUuid prop rewritten accordingly.
 * @param params - The params.
 * @param params.sourceSurvey - The survey the node defs have been cloned from.
 * @param params.targetSurvey - The survey the node defs have been cloned into.
 * @param params.clonedNodeDefs - The cloned node defs (subtree).
 * @returns The updated cloned node defs and the uuids of the categories and taxonomies to clone.
 */
export const resolveClonedNodeDefsCategoriesAndTaxonomies = ({
  sourceSurvey,
  targetSurvey,
  clonedNodeDefs,
}: {
  sourceSurvey: ArenaSurvey
  targetSurvey: ArenaSurvey
  clonedNodeDefs: ArenaAnyNodeDef[]
}): { clonedNodeDefs: ArenaAnyNodeDef[]; categoryUuidsToClone: string[]; taxonomyUuidsToClone: string[] } => {
  const { clonedNodeDefs: clonedNodeDefsAfterCategories, uuidsToClone: categoryUuidsToClone } =
    _resolveClonedNodeDefsRefs({
      clonedNodeDefs,
      sourceSurvey,
      targetSurvey,
      isRefNodeDef: NodeDef.isCode,
      getRefUuid: NodeDef.getCategoryUuid,
      propKey: NodeDef.propKeys.categoryUuid,
      getItemByUuidInSurvey: SurveyCategories.getCategoryByUuid,
      getItemByNameInSurvey: SurveyCategories.getCategoryByName,
      getItemName: Category.getName,
      getItemUuid: Category.getUuid,
    })

  const { clonedNodeDefs: clonedNodeDefsAfterTaxonomies, uuidsToClone: taxonomyUuidsToClone } =
    _resolveClonedNodeDefsRefs({
      clonedNodeDefs: clonedNodeDefsAfterCategories,
      sourceSurvey,
      targetSurvey,
      isRefNodeDef: NodeDef.isTaxon,
      getRefUuid: NodeDef.getTaxonomyUuid,
      propKey: NodeDef.propKeys.taxonomyUuid,
      getItemByUuidInSurvey: SurveyTaxonomies.getTaxonomyByUuid,
      getItemByNameInSurvey: SurveyTaxonomies.getTaxonomyByName,
      getItemName: Taxonomy.getName,
      getItemUuid: Taxonomy.getUuid,
    })

  return {
    clonedNodeDefs: clonedNodeDefsAfterTaxonomies,
    categoryUuidsToClone,
    taxonomyUuidsToClone,
  }
}
