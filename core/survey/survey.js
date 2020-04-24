import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'

import * as Srs from '@core/geo/srs'
import * as SurveyInfo from './_survey/surveyInfo'
import * as SurveyCycle from './surveyCycle'
import * as SurveyNodeDefs from './_survey/surveyNodeDefs'
import * as SurveyNodeDefsValidation from './_survey/surveyNodeDefsValidation'
import * as SurveyCategories from './_survey/surveyCategories'
import * as SurveyTaxonomies from './_survey/surveyTaxonomies'
import * as SurveyDefaults from './_survey/surveyDefaults'
import * as SurveyDependencies from './_survey/surveyDependencies'
import * as SurveyRefDataIndex from './_survey/surveyRefDataIndex'

export const newSurvey = (ownerUuid, name, label, languages, collectUri = null) => ({
  [SurveyInfo.keys.uuid]: uuidv4(),
  [SurveyInfo.keys.props]: {
    [SurveyInfo.keys.name]: name,
    [SurveyInfo.keys.labels]: label ? { [languages[0]]: label } : {},
    [SurveyInfo.keys.languages]: languages,
    [SurveyInfo.keys.srs]: [R.omit([Srs.keys.wkt], Srs.latLonSrs)],
    ...(collectUri ? { collectUri } : {}),
    [SurveyInfo.keys.cycles]: {
      [SurveyInfo.cycleOneKey]: SurveyCycle.newCycle(),
    },
  },
  [SurveyInfo.keys.ownerUuid]: ownerUuid,
})

export const infoKeys = SurveyInfo.keys
export const { dependencyTypes } = SurveyDependencies
export const { collectReportKeys, cycleOneKey } = SurveyInfo

// ====== DEFAULTS
export const { getDefaultAuthGroups } = SurveyDefaults

// READ
export const getId = R.pipe(SurveyInfo.getInfo, SurveyInfo.getId)
export const getIdSurveyInfo = SurveyInfo.getId
export const getSurveyInfo = SurveyInfo.getInfo

// === context is surveyInfo
export const {
  getUuid,
  getName,
  getLanguages,
  getLanguage,
  getDefaultLanguage,
  getLabels,
  getLabel,
  getDefaultLabel,
  getDescriptions,
  getSRS,
  getDefaultSRS,
  getStatus,
  getCycles,
  getCycleKeys,
  getDateCreated,
  getDateModified,
  isPublished,
  isDraft,
  isValid,
  isFromCollect,
  getCollectUri,
  getCollectReport,
  hasCollectReportIssues,
} = SurveyInfo

export const { getAuthGroups, isAuthGroupAdmin, getAuthGroupAdmin } = SurveyInfo

// UPDATE
export const { markDraft } = SurveyInfo

// ====== READ nodeDefs
export const {
  getNodeDefs,
  getNodeDefsArray,
  getNodeDefsByUuids,
  getNodeDefRoot,
  getNodeDefByUuid,
  getNodeDefChildren,
  hasNodeDefChildrenEntities,
  getNodeDefChildByName,
  getNodeDefSiblingByName,
  getNodeDefByName,
  getNodeDefsByCategoryUuid,
  getNodeDefsByTaxonomyUuid,
  getNodeDefParent,
  getNodeDefSource,
  getNodeDefKeys,
  isNodeDefRootKey,
  findNodeDef,
} = SurveyNodeDefs

// Hierarchy
export const {
  isNodeDefAncestor,
  visitAncestorsAndSelf,
  getHierarchy,
  traverseHierarchyItem,
  traverseHierarchyItemSync,
} = SurveyNodeDefs

// ====== READ dependencies
export const { getNodeDefDependencies, isNodeDefDependentOn } = SurveyDependencies

// ====== UPDATE
export const { assocNodeDefs, assocNodeDef } = SurveyNodeDefs
export const { assocDependencyGraph } = SurveyDependencies
export const buildDependencyGraph = SurveyDependencies.buildGraph
export const { buildAndAssocDependencyGraph } = SurveyDependencies

// ====== NodeDefsValidation
export const { getNodeDefsValidation, assocNodeDefsValidation, getNodeDefValidation } = SurveyNodeDefsValidation

// ====== NodeDef Code
export const { getNodeDefCategoryLevelIndex, getNodeDefParentCode, getNodeDefCodeCandidateParents } = SurveyNodeDefs

// TODO check where used
export const { canUpdateCategory, isNodeDefParentCode } = SurveyNodeDefs

// ====== Categories
export const { getCategories, getCategoriesArray, getCategoryByUuid, assocCategories } = SurveyCategories

// ====== Taxonomies
export const { getTaxonomiesArray, getTaxonomyByUuid, assocTaxonomies } = SurveyTaxonomies

// ====== Survey Reference data index
// category index
export const { getCategoryItemUuidAndCodeHierarchy, getCategoryItemByUuid } = SurveyRefDataIndex
// Taxon index
export const {
  getTaxonUuid,
  getTaxonVernacularNameUuid,
  getTaxonByUuid,
  includesTaxonVernacularName,
  assocRefData,
} = SurveyRefDataIndex
