const R = require('ramda')

const SurveyInfo = require('./_internal/surveyInfo')
const SurveyNodeDefs = require('./_internal/surveyNodeDefs')
const SurveyCategories = require('./_internal/surveyCategories')
const SurveyTaxonomies = require('./_internal/surveyTaxonomies')
const SurveyDefaults = require('./_internal/surveyDefaults')
const SurveyDependencies = require('./_internal/surveyDependencies')

module.exports = {
  // ====== DEFAULTS
  defaultSteps: SurveyDefaults.defaultSteps,
  getDefaultAuthGroups: SurveyDefaults.getDefaultAuthGroups,

  // READ
  getId: R.pipe(SurveyInfo.getInfo, SurveyInfo.getId),
  getSurveyInfo: SurveyInfo.getInfo,

  // === context is surveyInfo
  getName: SurveyInfo.getName,
  getLanguages: SurveyInfo.getLanguages,
  getDefaultLanguage: SurveyInfo.getDefaultLanguage,
  getLabels: SurveyInfo.getLabels,
  getDefaultLabel: SurveyInfo.getDefaultLabel,
  getDescriptions: SurveyInfo.getDescriptions,
  getDefaultStep: SurveyInfo.getDefaultStep,
  getSRS: SurveyInfo.getSRS,
  getDefaultSRS: SurveyInfo.getDefaultSRS,
  getStatus: SurveyInfo.getStatus,
  isPublished: SurveyInfo.isPublished,
  isDraft: SurveyInfo.isDraft,
  isValid: SurveyInfo.isValid,

  getAuthGroups: SurveyInfo.getAuthGroups,
  getSurveyAdminGroup: SurveyInfo.getSurveyAdminGroup,

  // ====== READ nodeDefs
  getNodeDefs: SurveyNodeDefs.getNodeDefs,
  getNodeDefsArray: SurveyNodeDefs.getNodeDefsArray,
  getNodeDefByUuid: SurveyNodeDefs.getNodeDefByUuid,
  getNodeDefsByUuids: SurveyNodeDefs.getNodeDefsByUuids,
  // getNodeDefById: SurveyNodeDefs.getNodeDefById,
  getRootNodeDef: SurveyNodeDefs.getRootNodeDef,
  getNodeDefChildren: SurveyNodeDefs.getNodeDefChildren,
  getNodeDefChildByName: SurveyNodeDefs.getNodeDefChildByName,
  getNodeDefSiblingByName: SurveyNodeDefs.getNodeDefSiblingByName,
  getNodeDefByName: SurveyNodeDefs.getNodeDefByName,
  getNodeDefByPath: SurveyNodeDefs.getNodeDefByPath,
  getNodeDefsByCategoryUuid: SurveyNodeDefs.getNodeDefsByCategoryUuid,
  getNodeDefsByTaxonomyUuid: SurveyNodeDefs.getNodeDefsByTaxonomyUuid,
  getNodeDefParent: SurveyNodeDefs.getNodeDefParent,
  getNodeDefKeys: SurveyNodeDefs.getNodeDefKeys,
  // hierarchy
  isNodeDefAncestor: SurveyNodeDefs.isNodeDefAncestor,
  getAncestorsHierarchy: SurveyNodeDefs.getAncestorsHierarchy,
  getHierarchy: SurveyNodeDefs.getHierarchy,
  traverseHierarchyItem: SurveyNodeDefs.traverseHierarchyItem,
  traverseHierarchyItemSync: SurveyNodeDefs.traverseHierarchyItemSync,

  // ====== READ dependencies
  getNodeDefDependencies: SurveyDependencies.getNodeDefDependencies,

  // ====== UPDATE nodeDefs
  assocNodeDefs: SurveyNodeDefs.assocNodeDefs,

  // ====== NodeDef Code
  getNodeDefCategoryLevelIndex: SurveyNodeDefs.getNodeDefCategoryLevelIndex,
  getNodeDefParentCode: SurveyNodeDefs.getNodeDefParentCode,
  getNodeDefCodeCandidateParents: SurveyNodeDefs.getNodeDefCodeCandidateParents,

  //TODO check where used
  canUpdateCategory: SurveyNodeDefs.canUpdateCategory,
  isNodeDefParentCode: SurveyNodeDefs.isNodeDefParentCode,

  // ====== Categories

  getCategories: SurveyCategories.getCategories,
  getCategoriesArray: SurveyCategories.getCategoriesArray,
  getCategoryByUuid: SurveyCategories.getCategoryByUuid,
  assocCategories: SurveyCategories.assocCategories,

  // ====== Taxonomies

  getTaxonomiesArray: SurveyTaxonomies.getTaxonomiesArray,
  getTaxonomyByUuid: SurveyTaxonomies.getTaxonomyByUuid,
  assocTaxonomies: SurveyTaxonomies.assocTaxonomies,
}