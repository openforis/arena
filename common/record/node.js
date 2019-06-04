const R = require('ramda')

const { uuidv4 } = require('./../uuid')
const { isBlank, trim } = require('../stringUtils')

const Validator = require('../validation/validator')
const NodeDef = require('../survey/nodeDef')
const SurveyUtils = require('../survey/surveyUtils')

const keys = {
  id: SurveyUtils.keys.id,
  uuid: SurveyUtils.keys.uuid,
  recordUuid: 'recordUuid',
  parentUuid: 'parentUuid',
  nodeDefUuid: 'nodeDefUuid',
  value: 'value',
  meta: 'meta',
  placeholder: 'placeholder',

  created: 'created',
  updated: 'updated',
  deleted: 'deleted',
  dirty: 'dirty' //modified by the user but not persisted yet
}

const metaKeys = {
  hierarchy: 'h', //ancestor nodes uuids hierarchy
  childApplicability: 'childApplicability', //applicability by child def uuid
  defaultValue: 'defaultValue', //true if default value has been applied, false if the value is user defined
  hierarchyCode: 'hCode', //hierarchy of code attribute ancestors (according to the parent code defs specified)
}

const valuePropKeys = {
  // code
  itemUuid: 'itemUuid',

  // coordinate
  x: 'x',
  y: 'y',
  srs: 'srs',

  // file
  fileUuid: 'fileUuid',
  fileName: 'fileName',
  fileSize: 'fileSize',

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

const newNode = (nodeDefUuid, recordUuid, parentNode = null, value = null) => ({
  [keys.uuid]: uuidv4(),
  [keys.nodeDefUuid]: nodeDefUuid,
  [keys.recordUuid]: recordUuid,
  [keys.parentUuid]: getUuid(parentNode),
  [keys.value]: value,
  [keys.meta]: {
    [metaKeys.hierarchy]: parentNode
      ? R.append(getUuid(parentNode), getHierarchy(parentNode))
      : []
  }
})

const newNodePlaceholder = (nodeDef, parentNode, value = null) => ({
  ...newNode(NodeDef.getUuid(nodeDef), getRecordUuid(parentNode), parentNode, value),
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

const getValue = (node = {}, defaultValue = {}) =>
  R.propOr(defaultValue, keys.value, node)

const getValueProp = (prop, defaultValue = null) => R.pipe(
  getValue,
  R.propOr(defaultValue, prop),
)

const getNodeDefUuid = R.prop(keys.nodeDefUuid)

const getNodeDefUuids = nodes => R.pipe(
  R.keys,
  R.map(key => getNodeDefUuid(nodes[key])),
  R.uniq
)(nodes)

const getHierarchy = R.pathOr([], [keys.meta, metaKeys.hierarchy])

const isDescendantOf = ancestor =>
  node => R.includes(
    getUuid(ancestor),
    getHierarchy(node),
  )

/**
 * ======
 * UPDATE
 * ======
 */
const mergeMeta = meta => node => R.pipe(
  R.propOr(keys.meta),
  R.mergeLeft(meta),
  metaUpdated => R.assoc(keys.meta, metaUpdated)(node)
)(node)

/**
 * ======
 * UTILS
 * ======
 */
const isValueBlank = node => {
  const value = getValue(node, null)

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
  getValue,
  getNodeDefUuid,

  getNodeDefUuids,

  isPlaceholder: R.propEq(keys.placeholder, true),
  isCreated: R.propEq(keys.created, true),
  isUpdated: R.propEq(keys.updated, true),
  isDeleted: R.propEq(keys.deleted, true),
  isDirty: R.propEq(keys.dirty, true),
  isRoot: R.pipe(getParentUuid, R.isNil),

  getValidation: Validator.getValidation,

  // ==== READ metadata
  getMeta: R.prop(keys.meta),
  isChildApplicable: childDefUuid => R.pathOr(true, [keys.meta, metaKeys.childApplicability, childDefUuid]),
  isDefaultValueApplied: R.pathOr(false, [keys.meta, metaKeys.defaultValue]),
  isDescendantOf,
  getHierarchy,
  // code metadata
  getHierarchyCode: R.pathOr([], [keys.meta, metaKeys.hierarchyCode]),

  // ==== UPDATE
  assocValue: R.assoc(keys.value),
  assocMeta: R.assoc(keys.meta),
  assocValidation: Validator.assocValidation,
  mergeMeta,

  // ==== UTILS
  isValueBlank,

  // ====== Node Value extractor

  // date
  getDateYear: R.pipe(
    R.partialRight(getValue, ['//']),
    R.split('/'),
    R.prop(2),
    trim,
  ),
  getDateMonth: R.pipe(
    R.partialRight(getValue, ['//']),
    R.split('/'),
    R.prop(1),
    trim
  ),
  getDateDay: R.pipe(
    R.partialRight(getValue, ['//']),
    R.split('/'),
    R.prop(0),
    trim
  ),

  // time
  getTimeHour: R.pipe(
    R.partialRight(getValue, [':']),
    R.split(':'),
    R.prop(0),
    trim
  ),
  getTimeMinute: R.pipe(
    R.partialRight(getValue, [':']),
    R.split(':'),
    R.prop(1),
    trim
  ),

  // coordinate
  getCoordinateX: getValueProp(valuePropKeys.x),
  getCoordinateY: getValueProp(valuePropKeys.y),
  getCoordinateSrs: (node, defaultValue = null) => getValueProp(valuePropKeys.srs, defaultValue)(node),

  // file
  getFileName: getValueProp(valuePropKeys.fileName, ''),
  getFileUuid: getValueProp(valuePropKeys.fileUuid, ''),

  // code
  getCategoryItemUuid: getValueProp(valuePropKeys.itemUuid),

  // taxon
  getTaxonUuid: getValueProp(valuePropKeys.taxonUuid),
  getVernacularNameUuid: getValueProp(valuePropKeys.vernacularNameUuid),
  getScientificName: getValueProp(valuePropKeys.scientificName),
  getVernacularName: getValueProp(valuePropKeys.vernacularName),
}