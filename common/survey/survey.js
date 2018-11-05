const R = require('ramda')

const NodeDef = require('./nodeDef')
const CodeList = require('./codeList')

const defaultSteps = {
  '1': {name: 'entry'},
  '2': {name: 'cleansing', prev: '1'},
  '3': {name: 'analysis', prev: '2'},
}

const SurveyInfo = require('./_internal/surveyInfo')
const SurveyNodeDefs = require('./_internal/surveyNodeDefs')
const SurveyCodeLists = require('./_internal/surveyCodeLists')
const SurveyTaxonomies = require('./_internal/surveyTaxonomies')

const getSurveyId = R.pipe(
  SurveyInfo.getInfo,
  R.prop('id')
)

/**
 * ======
 * UTILS NodeDefs
 * ======
 */
const getNodeDefCodeParent = nodeDef => SurveyNodeDefs.getNodeDefByUUID(NodeDef.getNodeDefParentCodeUUID(nodeDef))

const isNodeDefCodeParent = nodeDef => R.pipe(
  SurveyNodeDefs.getNodeDefsArray,
  R.any(R.pathEq(['props', 'parentCodeUUID'], nodeDef.uuid)),
)

const getNodeDefCodeCandidateParents = nodeDef =>
  survey => {
    const codeList = getCodeListByUUID(NodeDef.getNodeDefCodeListUUID(nodeDef))(survey)

    if (codeList) {
      const codeListLevelsLength = CodeList.getCodeListLevelsLength(codeList)
      const ancestors = SurveyNodeDefs.getNodeDefAncestors(nodeDef)(survey)

      return R.reduce(
        (acc, ancestor) =>
          R.pipe(
            SurveyNodeDefs.getNodeDefChildren(ancestor),
            R.reject(n =>
              // reject different codeList nodeDef
              NodeDef.getNodeDefCodeListUUID(n) !== codeList.uuid
              ||
              // or itself
              n.uuid === nodeDef.uuid
              ||
              // leaves nodeDef
              getNodeDefCodeListLevelIndex(n)(survey) === codeListLevelsLength - 1
            ),
            R.concat(acc),
          )(survey),
        [],
        ancestors
      )

    } else {
      return []
    }
  }

const getNodeDefCodeListLevelIndex = nodeDef =>
  survey => {
    const parentCodeNodeDef = getNodeDefCodeParent(nodeDef)(survey)
    return parentCodeNodeDef
      ? 1 + getNodeDefCodeListLevelIndex(parentCodeNodeDef)(survey)
      : 0
  }

const canUpdateCodeList = nodeDef =>
  survey => {
    return !isNodeDefCodeParent(nodeDef)(survey)
  }

module.exports = {
  getSurveyId,

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

  // ====== UPDATE nodeDefs
  assocNodeDefs: SurveyNodeDefs.assocNodeDefs,

  // ====== UTILS NodeDefs
  getNodeDefParent: SurveyNodeDefs.getNodeDefParent,
  isNodeDefAncestor: SurveyNodeDefs.isNodeDefAncestor,

  //NodeDef CodeList
  getNodeDefCodeListLevelIndex,
  getNodeDefCodeParent,
  getNodeDefCodeCandidateParents,
  isNodeDefCodeParent,
  canUpdateCodeList,

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
