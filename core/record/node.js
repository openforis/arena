import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import * as StringUtils from '@core/stringUtils'
import { uuidv4 } from '@core/uuid'

import * as Validation from '@core/validation/validation'
import * as NodeDef from '@core/survey/nodeDef'

export const keys = {
  id: ObjectUtils.keys.id,
  uuid: ObjectUtils.keys.uuid,
  parentUuid: ObjectUtils.keys.parentUuid,
  dateCreated: ObjectUtils.keys.dateCreated,
  dateModified: ObjectUtils.keys.dateModified,
  recordUuid: 'recordUuid',
  nodeDefUuid: ObjectUtils.keys.nodeDefUuid,
  value: 'value',
  meta: 'meta',
  placeholder: 'placeholder',

  created: 'created',
  updated: 'updated',
  deleted: 'deleted',
  dirty: 'dirty', // Modified by the user but not persisted yet
}

export const metaKeys = {
  hierarchy: 'h', // Ancestor nodes uuids hierarchy
  childApplicability: 'childApplicability', // Applicability by child def uuid
  defaultValue: 'defaultValue', // True if default value has been applied, false if the value is user defined
  hierarchyCode: 'hCode', // Hierarchy of code attribute ancestors (according to the parent code defs specified)
}

export const valuePropsCode = {
  code: 'code',
  itemUuid: 'itemUuid',
  label: 'label',
}

export const valuePropsCoordinate = {
  x: 'x',
  y: 'y',
  srs: 'srs',
}

export const valuePropsDate = {
  day: 'day',
  month: 'month',
  year: 'year',
}

export const valuePropsFile = {
  fileUuid: 'fileUuid',
  fileName: 'fileName',
  fileSize: 'fileSize',
}

export const valuePropsTaxon = {
  code: 'code',
  itemUuid: 'itemUuid',
  scientificName: 'scientificName',
  taxonUuid: 'taxonUuid',
  vernacularName: 'vernacularName',
  vernacularNameUuid: 'vernacularNameUuid',
}

export const valuePropsTime = {
  hour: 'hour',
  minute: 'minute',
}

/**
 * Props of node value indexed by node def type.
 * The node definitions here are only the ones of "composite" attributes.
 */
export const valuePropsByType = {
  [NodeDef.nodeDefType.code]: valuePropsCode,
  [NodeDef.nodeDefType.coordinate]: valuePropsCoordinate,
  [NodeDef.nodeDefType.date]: valuePropsDate,
  [NodeDef.nodeDefType.file]: valuePropsFile,
  [NodeDef.nodeDefType.taxon]: valuePropsTaxon,
  [NodeDef.nodeDefType.time]: valuePropsTime,
}

export const isValueProp = ({ nodeDef, prop }) => Boolean(R.path([NodeDef.getType(nodeDef), prop])(valuePropsByType))

//
// ======
// READ
// ======
//

export const { getUuid } = ObjectUtils

export const { getParentUuid } = ObjectUtils

export const getRecordUuid = R.prop(keys.recordUuid)

export const getValue = (node = {}, defaultValue = {}) => R.propOr(defaultValue, keys.value, node)

export const getValueProp = (prop, defaultValue = null) => R.pipe(getValue, R.propOr(defaultValue, prop))

export const { getNodeDefUuid } = ObjectUtils

export const getNodeDefUuids = (nodes) =>
  R.pipe(
    R.keys,
    R.map((key) => getNodeDefUuid(nodes[key])),
    R.uniq
  )(nodes)

export const isPlaceholder = R.propEq(keys.placeholder, true)
export const isCreated = R.propEq(keys.created, true)
export const isUpdated = R.propEq(keys.updated, true)
export const isDeleted = R.propEq(keys.deleted, true)
export const isDirty = R.propEq(keys.dirty, true)
export const isRoot = R.pipe(getParentUuid, R.isNil)
export const { isEqual } = ObjectUtils

export const { getValidation } = Validation

// ===== READ metadata

export const getMeta = R.propOr({}, keys.meta)

export const isChildApplicable = (childDefUuid) =>
  R.pathOr(true, [keys.meta, metaKeys.childApplicability, childDefUuid])
export const isDefaultValueApplied = R.pathOr(false, [keys.meta, metaKeys.defaultValue])

export const getHierarchy = R.pathOr([], [keys.meta, metaKeys.hierarchy])

export const isDescendantOf = (ancestor) => (node) => R.includes(getUuid(ancestor), getHierarchy(node))

// Code metadata
export const getHierarchyCode = R.pathOr([], [keys.meta, metaKeys.hierarchyCode])

//
// ======
// CREATE
// ======
//

export const newNode = (nodeDefUuid, recordUuid, parentNode = null, value = null) => ({
  [keys.uuid]: uuidv4(),
  [keys.nodeDefUuid]: nodeDefUuid,
  [keys.recordUuid]: recordUuid,
  [keys.parentUuid]: getUuid(parentNode),
  [keys.value]: value,
  [keys.meta]: {
    [metaKeys.hierarchy]: parentNode ? R.append(getUuid(parentNode), getHierarchy(parentNode)) : [],
  },
})

export const newNodePlaceholder = (nodeDef, parentNode, value = null) => ({
  ...newNode(NodeDef.getUuid(nodeDef), getRecordUuid(parentNode), parentNode, value),
  [keys.placeholder]: true,
})

//
// ======
// UPDATE
// ======
//
export const assocValue = R.assoc(keys.value)
export const assocMeta = R.assoc(keys.meta)
export const { assocValidation } = Validation

export const mergeMeta = (meta) => (node) =>
  R.pipe(getMeta, R.mergeLeft(meta), (metaUpdated) => R.assoc(keys.meta, metaUpdated)(node))(node)

//
// ======
// UTILS
// ======
//

export const isValueBlank = (node) => {
  const value = getValue(node, null)

  if (R.isNil(value)) {
    return true
  }

  if (R.is(String, value)) {
    return StringUtils.isBlank(value)
  }

  return R.isEmpty(value)
}

// ====== Node Value extractor

// Code
export const getCategoryItemUuid = getValueProp(valuePropsCode.itemUuid)

// Coordinate
export const getCoordinateX = getValueProp(valuePropsCoordinate.x)
export const getCoordinateY = getValueProp(valuePropsCoordinate.y)
export const getCoordinateSrs = (node, defaultValue = null) =>
  getValueProp(valuePropsCoordinate.srs, defaultValue)(node)

// Date
const _getDatePart = (index) =>
  R.pipe(R.partialRight(getValue, ['--']), R.split('-'), R.prop(index), StringUtils.trim, Number)
export const getDateYear = _getDatePart(0)
export const getDateMonth = _getDatePart(1)
export const getDateDay = _getDatePart(2)

const _datePropGetters = {
  [valuePropsDate.day]: getDateDay,
  [valuePropsDate.month]: getDateMonth,
  [valuePropsDate.year]: getDateYear,
}
export const getDateProp = (prop) => (node) => {
  const getter = _datePropGetters[prop]
  return getter && getter(node)
}

export const getDateCreated = R.prop(keys.dateCreated)
export const getDateModified = R.prop(keys.dateModified)

// File
export const getFileName = getValueProp(valuePropsFile.fileName, '')
export const getFileUuid = getValueProp(valuePropsFile.fileUuid, '')

// Taxon
export const getTaxonUuid = getValueProp(valuePropsTaxon.taxonUuid)
export const getVernacularNameUuid = getValueProp(valuePropsTaxon.vernacularNameUuid)
export const getScientificName = getValueProp(valuePropsTaxon.scientificName, '')
export const getVernacularName = getValueProp(valuePropsTaxon.vernacularName, '')

// Time
const _getTimePart = (index) =>
  R.pipe(R.partialRight(getValue, [':']), R.split(':'), R.prop(index), StringUtils.trim, Number)
export const getTimeHour = _getTimePart(0)
export const getTimeMinute = _getTimePart(1)

const _timePropGetters = {
  [valuePropsTime.hour]: getTimeHour,
  [valuePropsTime.minute]: getTimeMinute,
}
export const getTimeProp = (prop) => (node) => {
  const getter = _timePropGetters[prop]
  return getter && getter(node)
}
