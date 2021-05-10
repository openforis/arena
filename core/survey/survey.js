import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'

import * as Srs from '@core/geo/srs'
import * as SurveyInfo from './_survey/surveyInfo'
import * as SurveyCycle from './surveyCycle'
import * as SurveyNodeDefs from './_survey/surveyNodeDefs'
import * as SurveyNodeDefsLayout from './_survey/surveyNodeDefsLayout'
import * as SurveyNodeDefsValidation from './_survey/surveyNodeDefsValidation'
import * as SurveyCategories from './_survey/surveyCategories'
import * as SurveyTaxonomies from './_survey/surveyTaxonomies'
import * as SurveyDefaults from './_survey/surveyDefaults'
import * as SurveyDependencies from './_survey/surveyDependencies'
import * as SurveyRefDataIndex from './_survey/surveyRefDataIndex'
import * as SurveyNodeDefsIndex from './_survey/surveyNodeDefsIndex'

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
    [SurveyInfo.keys.srs]: [R.omit([Srs.keys.wkt], Srs.latLonSrs)],
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
  getOwnerName,
  getOwnerUuid,
  isTemplate,
  getProps,
  getPropsDraft,
} = SurveyInfo

export const { getAuthGroups, isAuthGroupAdmin, getAuthGroupAdmin, assocAuthGroups } = SurveyInfo

// UPDATE
export const { markDraft } = SurveyInfo

// ====== READ nodeDefs
export const {
  getNodeDefs,
  getNodeDefsArray,
  getNodeDefsByUuids,
  getNodeDefRoot,
  getNodeDefRootKeys,
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
const updateNodeDefs = ({ updateFn, updateDependencyGraph }) => (survey) => {
  let surveyUpdated = updateFn(survey)
  if (updateDependencyGraph) {
    surveyUpdated = {
      ...surveyUpdated,
      nodeDefsIndex: SurveyNodeDefsIndex.initNodeDefsIndex(surveyUpdated),
    }
    surveyUpdated = SurveyDependencies.buildAndAssocDependencyGraph(surveyUpdated)
  }
  return surveyUpdated
}

export const assocNodeDefs = ({ nodeDefs, updateDependencyGraph = false }) =>
  updateNodeDefs({ updateFn: SurveyNodeDefs.assocNodeDefs(nodeDefs), updateDependencyGraph })

export const assocNodeDef = ({ nodeDef, updateDependencyGraph = false }) =>
  updateNodeDefs({ updateFn: SurveyNodeDefs.assocNodeDef(nodeDef), updateDependencyGraph })

export const { updateNodeDefLayoutProp } = SurveyNodeDefsLayout
export const { assocDependencyGraph } = SurveyDependencies
export const buildDependencyGraph = SurveyDependencies.buildGraph
export const { buildAndAssocDependencyGraph } = SurveyDependencies

export const { addNodeDefToIndex, deleteNodeDefIndex, initNodeDefsIndex } = SurveyNodeDefsIndex

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
  assocCategories,
} = SurveyCategories

// ====== Taxonomies
export const { getTaxonomiesArray, getTaxonomyByUuid, assocTaxonomies } = SurveyTaxonomies

// ====== Survey Reference data index
// Category index
export const {
  getCategoryItemUuidAndCodeHierarchy,
  getCategoryItemByUuid,
  getCategoryItemByHierarchicalCodes,
} = SurveyRefDataIndex
// Taxon index
export const {
  getTaxonUuid,
  getTaxonVernacularNameUuid,
  getTaxonByUuid,
  includesTaxonVernacularName,
  assocRefData,
} = SurveyRefDataIndex
