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

export const valuePropKeys = {
  // Generic code (can be used by taxon or categoryItem)
  code: 'code',

  // Code
  itemUuid: 'itemUuid',
  label: 'label',

  // Coordinate
  x: 'x',
  y: 'y',
  srs: 'srs',

  // File
  fileUuid: 'fileUuid',
  fileName: 'fileName',
  fileSize: 'fileSize',

  // Taxon
  taxonUuid: 'taxonUuid',
  vernacularNameUuid: 'vernacularNameUuid',
  scientificName: 'scientificName',
  vernacularName: 'vernacularName',
}

//
// ======
// READ
// ======
//

export const { getUuid } = ObjectUtils

export const { getParentUuid } = ObjectUtils

export const getRecordUuid = R.prop(keys.recordUuid)

export const getValue = (node = {}, defaultValue = {}) => R.propOr(defaultValue, keys.value, node)

const getValueProp = (prop, defaultValue = null) => R.pipe(getValue, R.propOr(defaultValue, prop))

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
export const getCategoryItemUuid = getValueProp(valuePropKeys.itemUuid)

// Coordinate
export const getCoordinateX = getValueProp(valuePropKeys.x)
export const getCoordinateY = getValueProp(valuePropKeys.y)
export const getCoordinateSrs = (node, defaultValue = null) => getValueProp(valuePropKeys.srs, defaultValue)(node)

// Date
const _getDatePart = (index) => R.pipe(R.partialRight(getValue, ['--']), R.split('-'), R.prop(index), StringUtils.trim)
export const getDateYear = _getDatePart(0)
export const getDateMonth = _getDatePart(1)
export const getDateDay = _getDatePart(2)
export const getDateCreated = R.prop(keys.dateCreated)
export const getDateModified = R.prop(keys.dateModified)

// File
export const getFileName = getValueProp(valuePropKeys.fileName, '')
export const getFileUuid = getValueProp(valuePropKeys.fileUuid, '')

// Taxon
export const getTaxonUuid = getValueProp(valuePropKeys.taxonUuid)
export const getVernacularNameUuid = getValueProp(valuePropKeys.vernacularNameUuid)
export const getScientificName = getValueProp(valuePropKeys.scientificName, '')
export const getVernacularName = getValueProp(valuePropKeys.vernacularName, '')

// Time
const _getTimePart = (index) => R.pipe(R.partialRight(getValue, [':']), R.split(':'), R.prop(index), StringUtils.trim)
export const getTimeHour = _getTimePart(0)
export const getTimeMinute = _getTimePart(1)
