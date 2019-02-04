const R = require('ramda')

const { uuidv4 } = require('./../uuid')
const { isBlank, trim } = require('../stringUtils')

const Validator = require('../validation/validator')
const NodeDef = require('../survey/nodeDef')
const SurveyUtils = require('../survey/surveyUtils')

const keys = {
  uuid: SurveyUtils.keys.uuid,
  recordUuid: 'recordUuid',
  parentUuid: 'parentUuid',
  nodeDefUuid: 'nodeDefUuid',
  value: 'value',
  meta: 'meta',
  placeholder: 'placeholder',
  deleted: 'deleted'
}

const metaKeys = {
  childApplicability: 'childApplicability',
  defaultValue: 'defaultValue',
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
  fileUuid: 'fileUuid',

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
  [keys.uuid]: uuidv4(),
  [keys.nodeDefUuid]: nodeDefUuid,
  [keys.recordUuid]: recordUuid,
  [keys.parentUuid]: parentUuid,
  [keys.value]: value,
})

const newNodePlaceholder = (nodeDef, parentNode, value = null) => ({
  ...newNode(NodeDef.getUuid(nodeDef), getRecordUuid(parentNode), getUuid(parentNode), value),
  [keys.placeholder]: true
})

/**
 * ======
 * READ
 * ======
 */

const getUuid = SurveyUtils.getUuid

const getParentUuid = SurveyUtils.getParentUuid

const getRecordUuid = R.prop(keys.recordUuid)

const getNodeValue = (node = {}, defaultValue = {}) =>
  R.propOr(defaultValue, keys.value, node)

const getNodeValueProp = (prop, defaultValue = null) => R.pipe(
  getNodeValue,
  R.propOr(defaultValue, prop),
)

const getNodeDefUuid = R.prop(keys.nodeDefUuid)

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
const isNodeValueBlank = node => {
  const value = getNodeValue(node, null)

  if (R.isNil(value))
    return true

  if (R.is(String, value))
    return isBlank(value)

  return R.isEmpty(value)
}

module.exports = {
  keys,
  valuePropKeys,
  metaKeys,

  // ==== CREATE
  newNode,
  newNodePlaceholder,

  // ==== READ
  getUuid,
  getParentUuid,
  getRecordUuid,
  getNodeValue,
  getNodeDefUuid,

  getNodeDefUuids,

  isPlaceholder: R.propEq(keys.placeholder, true),
  isDeleted: R.propEq(keys.deleted, true),

  getValidation: Validator.getValidation,

  // ==== READ metadata
  isChildApplicable: childDefUuid => R.pathOr(true, [keys.meta, metaKeys.childApplicability, childDefUuid]),
  isDefaultValueApplied: R.pathOr(false, [keys.meta, metaKeys.defaultValue]),

  // ==== UPDATE
  assocValue: R.assoc(keys.value),
  assocValidation: Validator.assocValidation,

  // ==== UTILS
  isNodeValueBlank,

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
  getNodeFileUuid: getNodeValueProp(valuePropKeys.fileUuid, ''),

  // code
  getCategoryItemUuid: getNodeValueProp(valuePropKeys.itemUuid),

  // taxon
  getNodeTaxonUuid: getNodeValueProp(valuePropKeys.taxonUuid),
  getNodeVernacularNameUuid: getNodeValueProp(valuePropKeys.vernacularNameUuid),
  getNodeScientificName: getNodeValueProp(valuePropKeys.scientificName),
  getNodeVernacularName: getNodeValueProp(valuePropKeys.vernacularName),
}