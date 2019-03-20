const R = require('ramda')
const camelize = require('camelize')

const Survey = require('../../../../../common/survey/survey')
const SurveyUtils = require('../../../../../common/survey/surveyUtils')
const NodeDef = require('../../../../../common/survey/nodeDef')
const Taxonomy = require('../../../../../common/survey/taxonomy')
const Node = require('../../../../../common/record/node')
const CategoryManager = require('../../../category/persistence/categoryManager')
const TaxonomyManager = require('../../../taxonomy/persistence/taxonomyManager')

const NodeDefTable = require('../../../../../common/surveyRdb/nodeDefTable')
const sqlTypes = require('../../../../../common/surveyRdb/sqlTypes')
const { nodeDefType } = NodeDef

const { isBlank } = require('../../../../../common/stringUtils')
const DateTimeUtils = require('../../../../../common/dateUtils')

const colValueProcessor = 'colValueProcessor'
const colTypeProcessor = 'colTypeProcessor'

const getValueFromItem = (nodeDefCol, colName, item = {}, isInProps = false) => {
  //remove nodeDefName from col name
  const prop = camelize(NodeDefTable.extractColName(nodeDefCol, colName))

  return isInProps
    ? NodeDef.getProp(prop)(item)
    : R.propOr(null, prop, item)
}

const nodeValuePropProcessor = (surveyInfo, nodeDefCol, nodeCol) =>
  (node, colName) => {
    const nodeValue = Node.getNodeValue(node)
    return getValueFromItem(nodeDefCol, colName, nodeValue)
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
    [colTypeProcessor]: () => () => sqlTypes.decimal,
  },

  [nodeDefType.date]: {
    [colTypeProcessor]: () => () => sqlTypes.date,
    [colValueProcessor]: (surveyInfo, nodeDefCol, nodeCol) => {
      const [year, month, day] = [Node.getDateYear(nodeCol), Node.getDateMonth(nodeCol), Node.getDateDay(nodeCol)]
      return () => DateTimeUtils.isValidDate(year, month, day) ? `${year}-${month}-${day}` : null
    }
  },

  [nodeDefType.time]: {
    [colTypeProcessor]: () => () => sqlTypes.time,
    [colValueProcessor]: (surveyInfo, nodeDefCol, nodeCol) => {
      const [hour, minute] = [Node.getTimeHour(nodeCol), Node.getTimeMinute(nodeCol)]
      return () => DateTimeUtils.isValidTime(hour, minute) ? `${hour}:${minute}:00` : null
    }
  },

  [nodeDefType.code]: {
    [colValueProcessor]: async (surveyInfo, nodeDefCol, nodeCol, client) => {
      const itemUuid = Node.getCategoryItemUuid(nodeCol)
      const item = itemUuid ? await CategoryManager.fetchItemByUuid(surveyInfo.id, itemUuid, false, client) : {}

      return (node, colName) => R.endsWith('code', colName)
        ? getValueFromItem(nodeDefCol, colName, item, true)
        //'label'
        : SurveyUtils.getLabel(Survey.getDefaultLanguage(surveyInfo))(item)
    },
  },

  [nodeDefType.taxon]: {
    [colValueProcessor]: async (surveyInfo, nodeDefCol, nodeCol, client) => {
      const taxonUuid = Node.getNodeTaxonUuid(nodeCol)
      const taxon = taxonUuid ? await TaxonomyManager.fetchTaxonByUuid(surveyInfo.id, taxonUuid, false, client) : []
      return (node, colName) =>
        R.endsWith('code', colName)
          ? Taxonomy.getTaxonCode(taxon)
          // scientific_name
          : Taxonomy.isUnlistedTaxon(taxon)
          ? Node.getNodeScientificName(node) //from node value
          : Taxonomy.getTaxonScientificName(taxon) //from taxon item
    },
  },

  [nodeDefType.coordinate]: {
    [colValueProcessor]: async (surveyInfo, nodeDefCol, nodeCol) => {
      const defaultSrsCode = Survey.getDefaultSRS(surveyInfo).code
      const [x, y, srs] = [Node.getCoordinateX(nodeCol), Node.getCoordinateY(nodeCol), Node.getCoordinateSrs(nodeCol, defaultSrsCode)]
      return () => isBlank(x) || isBlank(y) ? null : `SRID=${srs};POINT(${x} ${y})`
    },
    [colTypeProcessor]: () => () => sqlTypes.point,
  },

  [nodeDefType.file]: {
    [colValueProcessor]: nodeValuePropProcessor,
    [colTypeProcessor]: () => colName => R.endsWith('file_uuid', colName) ? sqlTypes.uuid : sqlTypes.varchar,
  },
}

const getColValueProcessor = nodeDef => R.propOr(
  () => (node) => {
    return Node.isNodeValueBlank(node)
      ? null
      : Node.getNodeValue(node)
  },
  colValueProcessor,
  props[NodeDef.getType(nodeDef)]
)

const getColTypeProcessor = nodeDef => R.propOr(
  nodeDef => colName => `VARCHAR`,
  colTypeProcessor,
  props[NodeDef.getType(nodeDef)]
)(nodeDef)

module.exports = {
  getColValueProcessor,
  getColTypeProcessor,
}