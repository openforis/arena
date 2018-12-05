const R = require('ramda')

const Survey = require('../../common/survey/survey')
const SurveyUtils = require('../../common/survey/surveyUtils')
const NodeDef = require('../../common/survey/nodeDef')
const Node = require('../../common/record/node')
const CategoryManager = require('../category/categoryManager')

const {nodeDefType} = NodeDef

const cols = 'cols'
const colValueProcessor = 'colValueProcessor'

const props = {
  [nodeDefType.code]: {
    [cols]: ['code', 'label'],

    [colValueProcessor]: async (survey, nodeDefCol, nodeCol) => {
      const surveyInfo = Survey.getSurveyInfo(survey)
      const nodeDefName = NodeDef.getNodeDefName(nodeDefCol)
      const item = await CategoryManager.fetchItemByUuid(surveyInfo.id, Node.getNodeValue(nodeCol).itemUuid)

      return (node, colName) => colName === nodeDefName + '_' + 'code'
        ? SurveyUtils.getProp('code')(item)
        //'label'
        : SurveyUtils.getLabel(Survey.getDefaultLanguage(surveyInfo))(item)
    }
  },

  [nodeDefType.coordinate]: {
    [cols]: ['x', 'y', 'srs'],
  },

  [nodeDefType.taxon]: {
    [cols]: ['code', 'scientific_name', 'vernacular_name'],
  },

}

const getCols = nodeDef => R.propOr(
  [],
  cols,
  props[NodeDef.getNodeDefType(nodeDef)]
)

const getColValueProcessor = nodeDef => R.propOr(
  () => (node) => Node.getNodeValue(node, null),
  colValueProcessor,
  props[NodeDef.getNodeDefType(nodeDef)]
)

module.exports = {
  getCols,
  getColValueProcessor,
}