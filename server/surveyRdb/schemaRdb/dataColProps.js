const R = require('ramda')
const camelize = require('camelize')
const toSnakeCase = require('to-snake-case')

const Survey = require('../../../common/survey/survey')
const SurveyUtils = require('../../../common/survey/surveyUtils')
const NodeDef = require('../../../common/survey/nodeDef')
const Taxonomy = require('../../../common/survey/taxonomy')
const Node = require('../../../common/record/node')
const CategoryManager = require('../../category/categoryManager')
const TaxonomyManager = require('../../taxonomy/taxonomyManager')

const {isBlank} = require('../../../common/stringUtils')
const DateTimeUtils = require('../../../common/dateUtils')

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
  date: 'DATE',
  time: 'TIME WITHOUT TIME ZONE',
  point: 'geometry(Point)',
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
    [cols]: ['code', 'label'],

    [colValueProcessor]: async (surveyInfo, nodeDefCol, nodeCol) => {
      const itemUuid = Node.getCategoryItemUuid(nodeCol)
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
      const taxonUuid = Node.getNodeTaxonUuid(nodeCol)
      const taxon = taxonUuid ? await TaxonomyManager.fetchTaxonByUuid(surveyInfo.id, taxonUuid) : []
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