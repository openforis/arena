const R = require('ramda')
const camelize = require('camelize')

const NumberUtils = require('@core/numberUtils')
const ObjectUtils = require('@core/objectUtils')
const Survey = require('@core/survey/survey')
const NodeDef = require('@core/survey/nodeDef')
const Taxon = require('@core/survey/taxon')
const Node = require('@core/record/node')

const NodeDefTable = require('@common/surveyRdb/nodeDefTable')
const sqlTypes = require('@common/surveyRdb/sqlTypes')
const { nodeDefType } = NodeDef

const Point = require('@core/geo/point')
const GeoUtils = require('@core/geo/geoUtils')
const DateTimeUtils = require('@core/dateUtils')

const colValueProcessor = 'colValueProcessor'
const colTypeProcessor = 'colTypeProcessor'

const getValueFromItem = (nodeDefCol, colName, item = {}, isInProps = false) => {
  //remove nodeDefName from col name
  const prop = camelize(NodeDefTable.extractColName(nodeDefCol, colName))

  return isInProps
    ? NodeDef.getProp(prop)(item)
    : R.propOr(null, prop, item)
}

const nodeValuePropProcessor = (survey, nodeDefCol, nodeCol) =>
  (node, colName) => {
    const nodeValue = Node.getValue(node)
    return getValueFromItem(nodeDefCol, colName, nodeValue)
  }

/**
 * Convert an input value to RDB compatible output value
 * The contract is such that the value output value must always be compatible with RDB.
 * In case of any errors, return NULL.
 */
const props = {
  [nodeDefType.entity]: {
    [colValueProcessor]: () => () => Node.getUuid,
    [colTypeProcessor]: () => () => sqlTypes.uuid,
  },

  [nodeDefType.integer]: {
    [colTypeProcessor]: () => () => sqlTypes.integer,
    [colValueProcessor]: (_survey, _nodeDefCol, nodeCol) => {
      const value = Node.getValue(nodeCol)
      const num = NumberUtils.toNumber(value)
      return () => Number.isInteger(num) ? num : null
    },
  },

  [nodeDefType.decimal]: {
    [colTypeProcessor]: () => () => sqlTypes.decimal,
    [colValueProcessor]: (_survey, _nodeDefCol, nodeCol) => {
      const value = Node.getValue(nodeCol)
      const num = NumberUtils.toNumber(value)
      return () => !Number.isNaN(num) && Number.isFinite(num) ? num : null
    },
  },

  [nodeDefType.date]: {
    [colTypeProcessor]: () => () => sqlTypes.date,
    [colValueProcessor]: (survey, nodeDefCol, nodeCol) => {
      const [year, month, day] = [Node.getDateYear(nodeCol), Node.getDateMonth(nodeCol), Node.getDateDay(nodeCol)]
      return () => DateTimeUtils.isValidDate(year, month, day) ? `${year}-${month}-${day}` : null
    }
  },

  [nodeDefType.time]: {
    [colTypeProcessor]: () => () => sqlTypes.time,
    [colValueProcessor]: (survey, nodeDefCol, nodeCol) => {
      const [hour, minute] = [Node.getTimeHour(nodeCol), Node.getTimeMinute(nodeCol)]
      return () => DateTimeUtils.isValidTime(hour, minute) ? `${hour}:${minute}:00` : null
    }
  },

  [nodeDefType.code]: {
    [colValueProcessor]: (survey, nodeDefCol, nodeCol) => {
      const surveyInfo = Survey.getSurveyInfo(survey)
      const itemUuid = Node.getCategoryItemUuid(nodeCol)
      const item = itemUuid ? Survey.getCategoryItemByUuid(itemUuid)(survey) : {}

      return (node, colName) => R.endsWith('code', colName)
        ? getValueFromItem(nodeDefCol, colName, item, true)
        //'label'
        : ObjectUtils.getLabel(Survey.getDefaultLanguage(surveyInfo))(item)
    },
  },

  [nodeDefType.taxon]: {
    [colValueProcessor]: (survey, nodeDefCol, nodeCol) => {
      // return (node, colName) => null
      const taxonUuid = Node.getTaxonUuid(nodeCol)
      const taxon = taxonUuid ? Survey.getTaxonByUuid(taxonUuid)(survey) : {}

      return (node, colName) =>
        R.endsWith('code', colName)
          ? Taxon.getCode(taxon)
          // scientific_name
          : Taxon.isUnlistedTaxon(taxon)
          ? Node.getScientificName(node) //from node value
          : Taxon.getScientificName(taxon) //from taxon item
    },
  },

  [nodeDefType.coordinate]: {
    [colValueProcessor]: (survey, nodeDefCol, nodeCol) => {
      const [x, y, srsCode] = [Node.getCoordinateX(nodeCol), Node.getCoordinateY(nodeCol), Node.getCoordinateSrs(nodeCol)]

      return () => GeoUtils.isCoordinateValid(srsCode, x, y)
        ? Point.newPoint(srsCode, x, y)
        : null
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
    return Node.isValueBlank(node)
      ? null
      : Node.getValue(node)
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