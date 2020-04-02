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
export const { collectReportKeys } = SurveyInfo
export const { cycleOneKey } = SurveyInfo

// ====== DEFAULTS
export const { getDefaultAuthGroups } = SurveyDefaults

// READ
export const getId = R.pipe(SurveyInfo.getInfo, SurveyInfo.getId)
export const getIdSurveyInfo = SurveyInfo.getId
export const getSurveyInfo = SurveyInfo.getInfo

// === context is surveyInfo
export const { getUuid } = SurveyInfo
export const { getName } = SurveyInfo
export const { getLanguages } = SurveyInfo
export const { getLanguage } = SurveyInfo
export const { getDefaultLanguage } = SurveyInfo
export const { getLabels } = SurveyInfo
export const { getLabel } = SurveyInfo
export const { getDefaultLabel } = SurveyInfo
export const { getDescriptions } = SurveyInfo
export const { getSRS } = SurveyInfo
export const { getDefaultSRS } = SurveyInfo
export const { getStatus } = SurveyInfo
export const { getCycles } = SurveyInfo
export const { getCycleKeys } = SurveyInfo
export const { getDateCreated } = SurveyInfo
export const { getDateModified } = SurveyInfo
export const { isPublished } = SurveyInfo
export const { isDraft } = SurveyInfo
export const { isValid } = SurveyInfo
export const { isFromCollect } = SurveyInfo
export const { getCollectUri } = SurveyInfo
export const { getCollectReport } = SurveyInfo
export const { hasCollectReportIssues } = SurveyInfo

export const { getAuthGroups } = SurveyInfo
export const { isAuthGroupAdmin } = SurveyInfo
export const { getAuthGroupAdmin } = SurveyInfo

// UPDATE
export const { markDraft } = SurveyInfo

// ====== READ nodeDefs
export const { getNodeDefs } = SurveyNodeDefs
export const { getNodeDefsArray } = SurveyNodeDefs
export const { getNodeDefsByUuids } = SurveyNodeDefs
export const { getNodeDefRoot } = SurveyNodeDefs
export const { getNodeDefByUuid } = SurveyNodeDefs
export const { getNodeDefChildren } = SurveyNodeDefs
export const { hasNodeDefChildrenEntities } = SurveyNodeDefs
export const { getNodeDefChildByName } = SurveyNodeDefs
export const { getNodeDefSiblingByName } = SurveyNodeDefs
export const { getNodeDefByName } = SurveyNodeDefs
export const { getNodeDefsByCategoryUuid } = SurveyNodeDefs
export const { getNodeDefsByTaxonomyUuid } = SurveyNodeDefs
export const { getNodeDefParent } = SurveyNodeDefs
export const { getNodeDefKeys } = SurveyNodeDefs
export const { isNodeDefRootKey } = SurveyNodeDefs
export const { findNodeDef } = SurveyNodeDefs

// Hierarchy
export const { isNodeDefAncestor } = SurveyNodeDefs
export const { visitAncestorsAndSelf } = SurveyNodeDefs
export const { getHierarchy } = SurveyNodeDefs
export const { traverseHierarchyItem } = SurveyNodeDefs
export const { traverseHierarchyItemSync } = SurveyNodeDefs

// ====== READ dependencies
export const { getNodeDefDependencies } = SurveyDependencies
export const { isNodeDefDependentOn } = SurveyDependencies

// ====== UPDATE
export const { assocNodeDefs } = SurveyNodeDefs
export const { assocNodeDef } = SurveyNodeDefs
export const { assocDependencyGraph } = SurveyDependencies
export const buildDependencyGraph = SurveyDependencies.buildGraph
export const { buildAndAssocDependencyGraph } = SurveyDependencies

// ====== NodeDefsValidation
export const { getNodeDefsValidation } = SurveyNodeDefsValidation
export const { assocNodeDefsValidation } = SurveyNodeDefsValidation
export const { getNodeDefValidation } = SurveyNodeDefsValidation

// ====== NodeDef Code
export const { getNodeDefCategoryLevelIndex } = SurveyNodeDefs
export const { getNodeDefParentCode } = SurveyNodeDefs
export const { getNodeDefCodeCandidateParents } = SurveyNodeDefs

// TODO check where used
export const { canUpdateCategory } = SurveyNodeDefs
export const { isNodeDefParentCode } = SurveyNodeDefs

// ====== Categories
export const { getCategories } = SurveyCategories
export const { getCategoriesArray } = SurveyCategories
export const { getCategoryByUuid } = SurveyCategories
export const { assocCategories } = SurveyCategories

// ====== Taxonomies
export const { getTaxonomiesArray } = SurveyTaxonomies
export const { getTaxonomyByUuid } = SurveyTaxonomies
export const { assocTaxonomies } = SurveyTaxonomies

// ====== Survey Reference data index
// category index
export const { getCategoryItemUuidAndCodeHierarchy } = SurveyRefDataIndex
export const { getCategoryItemByUuid } = SurveyRefDataIndex
// Taxon index
export const { getTaxonUuid } = SurveyRefDataIndex
export const { getTaxonVernacularNameUuid } = SurveyRefDataIndex
export const { getTaxonByUuid } = SurveyRefDataIndex
export const { includesTaxonVernacularName } = SurveyRefDataIndex

export const { assocRefData } = SurveyRefDataIndex
