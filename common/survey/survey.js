const R = require('ramda')

const defaultSteps = {
  '1': {name: 'entry'},
  '2': {name: 'cleansing', prev: '1'},
  '3': {name: 'analysis', prev: '2'},
}

const SurveyInfo = require('./_internal/surveyInfo')
const SurveyNodeDefs = require('./_internal/surveyNodeDefs')
const SurveyCodeLists = require('./_internal/surveyCodeLists')
const SurveyTaxonomies = require('./_internal/surveyTaxonomies')

module.exports = {
  defaultSteps,

  // READ
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
  getStatus: SurveyInfo.getStatus,
  isPublished: SurveyInfo.isPublished,
  isDraft: SurveyInfo.isDraft,
  isValid: SurveyInfo.isValid,

  // ====== READ nodeDefs
  getNodeDefs: SurveyNodeDefs.getNodeDefs,
  getNodeDefByUUID: SurveyNodeDefs.getNodeDefByUUID,
  getNodeDefById: SurveyNodeDefs.getNodeDefById,
  getRootNodeDef: SurveyNodeDefs.getRootNodeDef,
  getNodeDefChildren: SurveyNodeDefs.getNodeDefChildren,
  getNodeDefsByCodeListUUID: SurveyNodeDefs.getNodeDefsByCodeListUUID,
  getNodeDefsByTaxonomyUUID: SurveyNodeDefs.getNodeDefsByTaxonomyUUID,
  getNodeDefParent: SurveyNodeDefs.getNodeDefParent,
  isNodeDefAncestor: SurveyNodeDefs.isNodeDefAncestor,

  // ====== UPDATE nodeDefs
  assocNodeDefs: SurveyNodeDefs.assocNodeDefs,

  // ====== NodeDef CodeList
  getNodeDefCodeListLevelIndex: SurveyNodeDefs.getNodeDefCodeListLevelIndex,
  getNodeDefParentCode: SurveyNodeDefs.getNodeDefParentCode,
  getNodeDefCodeCandidateParents: SurveyNodeDefs.getNodeDefCodeCandidateParents,
  canUpdateCodeList: SurveyNodeDefs.canUpdateCodeList,
  isNodeDefParentCode: SurveyNodeDefs.isNodeDefParentCode,

  // ====== CodeLists

  getCodeLists: SurveyCodeLists.getCodeLists,
  getCodeListsArray: SurveyCodeLists.getCodeListsArray,
  getCodeListByUUID: SurveyCodeLists.getCodeListByUUID,
  assocCodeLists: SurveyCodeLists.assocCodeLists,

  // ====== Taxonomies

  getTaxonomiesArray: SurveyTaxonomies.getTaxonomiesArray,
  getTaxonomyByUUID: SurveyTaxonomies.getTaxonomyByUUID,
  assocTaxonomies: SurveyTaxonomies.assocTaxonomies,
}
