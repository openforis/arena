const R = require('ramda')
const camelize = require('camelize')
const toSnakeCase = require('to-snake-case')

const Survey = require('../../../common/survey/survey')
const SurveyUtils = require('../../../common/survey/surveyUtils')
const NodeDef = require('../../../common/survey/nodeDef')
const Node = require('../../../common/record/node')
const CategoryManager = require('../../category/categoryManager')
const TaxonomyManager = require('../../taxonomy/taxonomyManager')

const {nodeDefType} = NodeDef

const cols = 'cols'
const colValueProcessor = 'colValueProcessor'
const colTypeProcessor = 'colTypeProcessor'

const getValueFromItem = (nodeDefCol, colName, item = {}, isInProps = false) => {
//remove nodeDefName from col name
  const prop = R.pipe(
    R.replace(toSnakeCase(NodeDef.getNodeDefName(nodeDefCol)) + '_', ''),
    camelize,
  )(colName)

  return isInProps
    ? NodeDef.getProp(prop)(item)
    : R.propOr(null, prop, item)
}

const nodeValuePropProcessor = (surveyInfo, nodeDefCol, nodeCol) =>
  (node, colName) => {
    const nodeValue = Node.getNodeValue(node)
    return getValueFromItem(nodeDefCol, colName, nodeValue)
  }

const sqlTypes = {
  uuid: 'UUID',
  varchar: 'VARCHAR',
  integer: 'INTEGER',
  decimal: `DECIMAL(${16 + 6}, 6)`,
}

const props = {
  [nodeDefType.entity]: {
    [colValueProcessor]: () => () => Node.getUuid,
    [colTypeProcessor]: () => () => sqlTypes.uuid,
  },

  [nodeDefType.integer]: {
    [colTypeProcessor]: () => () => sqlTypes.integer,
  },

  [nodeDefType.decimal]: {
    //TODO used in ui nodeDefSystemProps
    [colTypeProcessor]: () => () => sqlTypes.decimal,
  },

  [nodeDefType.code]: {
    [cols]: ['code', 'label'],

    [colValueProcessor]: async (surveyInfo, nodeDefCol, nodeCol) => {
      const {itemUuid} = Node.getNodeValue(nodeCol)
      const item = itemUuid ? await CategoryManager.fetchItemByUuid(surveyInfo.id, itemUuid) : {}

      return (node, colName) => R.endsWith('code', colName)
        ? getValueFromItem(nodeDefCol, colName, item, true)
        //'label'
        : SurveyUtils.getLabel(Survey.getDefaultLanguage(surveyInfo))(item)
    },
  },

  [nodeDefType.taxon]: {
    [cols]: ['code', 'scientific_name'], //?, 'vernacular_names?'],
    [colValueProcessor]: async (surveyInfo, nodeDefCol, nodeCol) => {
      const {taxonUuid} = Node.getNodeValue(nodeCol)
      const items = taxonUuid ? await TaxonomyManager.fetchTaxaByPropLike(surveyInfo.id, null, {filter: {uuid: taxonUuid}}) : []
      const item = R.pipe(R.head, R.defaultTo({}))(items)

      return (node, colName) => getValueFromItem(nodeDefCol, colName, item, true)
    },
  },

  [nodeDefType.coordinate]: {
    [cols]: ['x', 'y', 'srs'],
    [colValueProcessor]: nodeValuePropProcessor,
  },

  [nodeDefType.file]: {
    [cols]: ['file_uuid', 'file_name'],
    [colValueProcessor]: nodeValuePropProcessor,
    [colTypeProcessor]: () => colName => R.endsWith('file_uuid', colName) ? sqlTypes.uuid : sqlTypes.varchar,
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

const getColTypeProcessor = nodeDef => R.propOr(
  nodeDef => colName => `VARCHAR`,
  colTypeProcessor,
  props[NodeDef.getNodeDefType(nodeDef)]
)(nodeDef)

module.exports = {
  getCols,
  getColValueProcessor,
  getColTypeProcessor,
}