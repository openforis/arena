const R = require('ramda')

const {uuidv4} = require('./../uuid')
const {isBlank, trim} = require('../stringUtils')
const SurveyUtils = require('../survey/surveyUtils')

const keys = {
  value: 'value'
}

const valuePropKeys = {
  // code
  itemUuid: 'itemUuid',

  // coordinate
  x: 'x',
  y: 'y',
  srs: 'srs',

  // file
  fileName: 'fileName',

  // taxon
  taxonUuid: 'taxonUuid',
  vernacularNameUuid: 'vernacularNameUuid',
  scientificName: 'scientificName',
  vernacularName: 'vernacularName',
}

/**
 * ======
 * CREATE
 * ======
 */

const newNode = (nodeDefUuid, recordUuid, parentUuid = null, value = null) => ({
    uuid: uuidv4(),
    nodeDefUuid,
    recordUuid,
    parentUuid,
    value,
  }
)

const newNodePlaceholder = (nodeDef, parentNode, value = null) => ({
  ...newNode(nodeDef.uuid, parentNode.recordUuid, parentNode.uuid, value),
  placeholder: true
})

/**
 * ======
 * READ
 * ======
 */

const getNodeValue = (node = {}, defaultValue = {}) =>
  R.propOr(defaultValue, keys.value, node)

const getNodeValueProp = (prop, defaultValue = null) => R.pipe(
  getNodeValue,
  R.propOr(defaultValue, prop),
)

const getNodeDefUuid = R.prop('nodeDefUuid')

const getNodeDefUuids = nodes => R.pipe(
  R.keys,
  R.map(key => getNodeDefUuid(nodes[key])),
  R.uniq
)(nodes)

/**
 * ======
 * UPDATE
 * ======
 */

/**
 * ======
 * UTILS
 * ======
 */
const isNodeValueBlank = value => {

  if (R.isNil(value))
    return true

  if (R.is(String, value))
    return isBlank(value)

  return false
}

const isNodeValueNotBlank = R.pipe(isNodeValueBlank, R.not)

module.exports = {
  valuePropKeys,

  // ==== CREATE
  newNode,
  newNodePlaceholder,

  // ==== READ
  getUuid: SurveyUtils.getUuid,
  getParentUuid: SurveyUtils.getParentUuid,
  getRecordUuid: R.prop('recordUuid'),
  getNodeValue,
  getNodeDefUuid,

  getNodeDefUuids,

  // ==== UPDATE
  assocValue: R.assoc(keys.value),

  // ==== UTILS
  isNodeValueBlank,
  isNodeValueNotBlank,

  // ====== Node Value extractor

  // date
  getDateYear: R.pipe(
    R.partialRight(getNodeValue, ['//']),
    R.split('/'),
    R.prop(2),
    trim,
  ),
  getDateMonth: R.pipe(
    R.partialRight(getNodeValue, ['//']),
    R.split('/'),
    R.prop(1),
    trim
  ),
  getDateDay: R.pipe(
    R.partialRight(getNodeValue, ['//']),
    R.split('/'),
    R.prop(0),
    trim
  ),

  // time
  getTimeHour: R.pipe(
    R.partialRight(getNodeValue, [':']),
    R.split(':'),
    R.prop(0),
    trim
  ),
  getTimeMinute: R.pipe(
    R.partialRight(getNodeValue, [':']),
    R.split(':'),
    R.prop(1),
    trim
  ),

  // coordinate
  getCoordinateX: getNodeValueProp(valuePropKeys.x),
  getCoordinateY: getNodeValueProp(valuePropKeys.y),
  getCoordinateSrs: (node, defaultValue = null) => getNodeValueProp(valuePropKeys.srs, defaultValue)(node),

  // file
  getNodeFileName: getNodeValueProp(valuePropKeys.fileName, ''),

  // code
  getCategoryItemUuid: getNodeValueProp(valuePropKeys.itemUuid),

  // taxon
  getNodeTaxonUuid: getNodeValueProp(valuePropKeys.taxonUuid),
  getNodeVernacularNameUuid: getNodeValueProp(valuePropKeys.vernacularNameUuid),
  getNodeScientificName: getNodeValueProp(valuePropKeys.scientificName),
  getNodeVernacularName: getNodeValueProp(valuePropKeys.vernacularName),
}