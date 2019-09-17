const R = require('ramda')
const camelize = require('camelize')

const Survey = require('../../../../common/survey/survey')
const SurveyUtils = require('../../../../common/survey/surveyUtils')
const NodeDef = require('../../../../common/survey/nodeDef')
const Taxon = require('../../../../common/survey/taxon')
const Node = require('../../../../common/record/node')

const NodeDefTable = require('../../../../common/surveyRdb/nodeDefTable')
const sqlTypes = require('../../../../common/surveyRdb/sqlTypes')
const { nodeDefType } = NodeDef

const Point = require('../../../../common/geo/point')
const GeoUtils = require('../../../../common/geo/geoUtils')
const DateTimeUtils = require('../../../../common/dateUtils')

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
        : SurveyUtils.getLabel(Survey.getDefaultLanguage(surveyInfo))(item)
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