import * as R from 'ramda'

import {uuidv4} from '@core/uuid'

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
    [SurveyInfo.keys.labels]: label ? {[languages[0]]: label} : {},
    [SurveyInfo.keys.languages]: languages,
    [SurveyInfo.keys.srs]: [R.omit([Srs.keys.wkt], Srs.latLonSrs)],
    ...(collectUri ? {collectUri} : {}),
    [SurveyInfo.keys.cycles]: {
      [SurveyInfo.cycleOneKey]: SurveyCycle.newCycle()
    }
  },
  [SurveyInfo.keys.ownerUuid]: ownerUuid,
})

export const infoKeys = SurveyInfo.keys
export const dependencyTypes = SurveyDependencies.dependencyTypes
export const collectReportKeys = SurveyInfo.collectReportKeys
export const cycleOneKey = SurveyInfo.cycleOneKey

// ====== DEFAULTS
export const getDefaultAuthGroups = SurveyDefaults.getDefaultAuthGroups

// READ
export const getId = R.pipe(SurveyInfo.getInfo, SurveyInfo.getId)
export const getIdSurveyInfo = SurveyInfo.getId
export const getSurveyInfo = SurveyInfo.getInfo

// === context is surveyInfo
export const getUuid = SurveyInfo.getUuid
export const getName = SurveyInfo.getName
export const getLanguages = SurveyInfo.getLanguages
export const getLanguage = SurveyInfo.getLanguage
export const getDefaultLanguage = SurveyInfo.getDefaultLanguage
export const getLabels = SurveyInfo.getLabels
export const getLabel = SurveyInfo.getLabel
export const getDefaultLabel = SurveyInfo.getDefaultLabel
export const getDescriptions = SurveyInfo.getDescriptions
export const getSRS = SurveyInfo.getSRS
export const getDefaultSRS = SurveyInfo.getDefaultSRS
export const getStatus = SurveyInfo.getStatus
export const getCycles = SurveyInfo.getCycles
export const getCycleKeys = SurveyInfo.getCycleKeys
export const getDateCreated = SurveyInfo.getDateCreated
export const getDateModified = SurveyInfo.getDateModified
export const isPublished = SurveyInfo.isPublished
export const isDraft = SurveyInfo.isDraft
export const isValid = SurveyInfo.isValid
export const isFromCollect = SurveyInfo.isFromCollect
export const getCollectUri = SurveyInfo.getCollectUri
export const getCollectReport = SurveyInfo.getCollectReport
export const hasCollectReportIssues = SurveyInfo.hasCollectReportIssues

export const getAuthGroups = SurveyInfo.getAuthGroups
export const isAuthGroupAdmin = SurveyInfo.isAuthGroupAdmin
export const getAuthGroupAdmin = SurveyInfo.getAuthGroupAdmin

// UPDATE
export const markDraft = SurveyInfo.markDraft

// ====== READ nodeDefs
export const getNodeDefs = SurveyNodeDefs.getNodeDefs
export const getNodeDefsArray = SurveyNodeDefs.getNodeDefsArray
export const getNodeDefsByUuids = SurveyNodeDefs.getNodeDefsByUuids
export const getNodeDefRoot = SurveyNodeDefs.getNodeDefRoot
export const getNodeDefByUuid = SurveyNodeDefs.getNodeDefByUuid
export const getNodeDefChildren = SurveyNodeDefs.getNodeDefChildren
export const hasNodeDefChildrenEntities = SurveyNodeDefs.hasNodeDefChildrenEntities
export const getNodeDefChildByName = SurveyNodeDefs.getNodeDefChildByName
export const getNodeDefSiblingByName = SurveyNodeDefs.getNodeDefSiblingByName
export const getNodeDefByName = SurveyNodeDefs.getNodeDefByName
export const getNodeDefsByCategoryUuid = SurveyNodeDefs.getNodeDefsByCategoryUuid
export const getNodeDefsByTaxonomyUuid = SurveyNodeDefs.getNodeDefsByTaxonomyUuid
export const getNodeDefParent = SurveyNodeDefs.getNodeDefParent
export const getNodeDefKeys = SurveyNodeDefs.getNodeDefKeys
export const isNodeDefRootKey = SurveyNodeDefs.isNodeDefRootKey
export const findNodeDef = SurveyNodeDefs.findNodeDef

// Hierarchy
export const isNodeDefAncestor = SurveyNodeDefs.isNodeDefAncestor
export const visitAncestorsAndSelf = SurveyNodeDefs.visitAncestorsAndSelf
export const getHierarchy = SurveyNodeDefs.getHierarchy
export const traverseHierarchyItem = SurveyNodeDefs.traverseHierarchyItem
export const traverseHierarchyItemSync = SurveyNodeDefs.traverseHierarchyItemSync

// ====== READ dependencies
export const getNodeDefDependencies = SurveyDependencies.getNodeDefDependencies
export const isNodeDefDependentOn = SurveyDependencies.isNodeDefDependentOn

// ====== UPDATE
export const assocNodeDefs = SurveyNodeDefs.assocNodeDefs
export const assocDependencyGraph = SurveyDependencies.assocDependencyGraph
export const buildDependencyGraph = SurveyDependencies.buildGraph

// ====== NodeDefsValidation
export const getNodeDefsValidation = SurveyNodeDefsValidation.getNodeDefsValidation
export const assocNodeDefsValidation = SurveyNodeDefsValidation.assocNodeDefsValidation
export const getNodeDefValidation = SurveyNodeDefsValidation.getNodeDefValidation

// ====== NodeDef Code
export const getNodeDefCategoryLevelIndex = SurveyNodeDefs.getNodeDefCategoryLevelIndex
export const getNodeDefParentCode = SurveyNodeDefs.getNodeDefParentCode
export const getNodeDefCodeCandidateParents = SurveyNodeDefs.getNodeDefCodeCandidateParents

// TODO check where used
export const canUpdateCategory = SurveyNodeDefs.canUpdateCategory
export const isNodeDefParentCode = SurveyNodeDefs.isNodeDefParentCode

// ====== Categories
export const getCategories = SurveyCategories.getCategories
export const getCategoriesArray = SurveyCategories.getCategoriesArray
export const getCategoryByUuid = SurveyCategories.getCategoryByUuid
export const assocCategories = SurveyCategories.assocCategories

// ====== Taxonomies
export const getTaxonomiesArray = SurveyTaxonomies.getTaxonomiesArray
export const getTaxonomyByUuid = SurveyTaxonomies.getTaxonomyByUuid
export const assocTaxonomies = SurveyTaxonomies.assocTaxonomies
export const canUpdateTaxonomy = SurveyNodeDefs.canUpdateTaxonomy

// ====== Survey Reference data index
// category index
export const getCategoryItemUuidAndCodeHierarchy = SurveyRefDataIndex.getCategoryItemUuidAndCodeHierarchy
export const getCategoryItemByUuid = SurveyRefDataIndex.getCategoryItemByUuid
// Taxon index
export const getTaxonUuid = SurveyRefDataIndex.getTaxonUuid
export const getTaxonVernacularNameUuid = SurveyRefDataIndex.getTaxonVernacularNameUuid
export const getTaxonByUuid = SurveyRefDataIndex.getTaxonByUuid
export const includesTaxonVernacularName = SurveyRefDataIndex.includesTaxonVernacularName

export const assocRefData = SurveyRefDataIndex.assocRefData
