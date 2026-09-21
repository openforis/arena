import * as A from '@core/arena'

import { Objects } from '@openforis/arena-core'

import * as ObjectUtils from '@core/objectUtils'
import * as StringUtils from '@core/stringUtils'
import { uuidv4 } from '@core/uuid'

import * as Validation from '@core/validation/validation'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { NodeMeta } from './_node/nodeMeta'
import {
  valuePropsByType,
  valuePropsCode,
  valuePropsCoordinate,
  valuePropsDate,
  valuePropsFile,
  valuePropsTaxon,
  valuePropsTime,
} from '@core/survey/nodeValueProps'

export {
  valuePropsByType,
  valuePropsCode,
  valuePropsCoordinate,
  valuePropsDate,
  valuePropsFile,
  valuePropsTaxon,
  valuePropsTime,
}

const flagKeys = {
  created: 'created',
  updated: 'updated',
  deleted: 'deleted',
}
const flagKeysArray = Object.keys(flagKeys)

const dirtyFlag = 'dirty'
const flagKeysIncludingDirty = [...flagKeysArray, dirtyFlag]

export const keys = {
  id: ObjectUtils.keys.id,
  uuid: ObjectUtils.keys.uuid,
  parentUuid: ObjectUtils.keys.parentUuid,
  dateCreated: ObjectUtils.keys.dateCreated,
  dateModified: ObjectUtils.keys.dateModified,
  recordUuid: 'recordUuid',
  nodeDefUuid: ObjectUtils.keys.nodeDefUuid,
  value: 'value',
  meta: NodeMeta.keys.meta,

  // transient keys
  placeholder: 'placeholder',
  recordCycle: 'recordCycle',
  recordStep: 'recordStep',
  surveyUuid: 'surveyUuid',

  // flags (used to update RDB)
  ...flagKeys,
}

export const isValueProp = ({ nodeDef, prop }) => Boolean(A.path([NodeDef.getType(nodeDef), prop])(valuePropsByType))

//
// ======
// READ
// ======
//

export const { getId, getUuid } = ObjectUtils

export const { getParentUuid } = ObjectUtils

export const getRecordUuid = A.prop(keys.recordUuid)

export const getValue = (node = {}, defaultValue = {}) => A.propOr(defaultValue, keys.value, node)

const _getValuePropRaw = (prop, defaultValue = null) => A.pipe(getValue, A.propOr(defaultValue, prop))

export const { getNodeDefUuid } = ObjectUtils

export const getNodeDefUuids = (nodes) =>
  A.pipe(
    A.keys,
    A.map((key) => getNodeDefUuid(nodes[key])),
    A.uniq
  )(nodes)

export const getNodeLayoutChildren =
  ({ cycle, nodeDef, childDefs }) =>
  (node) => {
    const hiddenDefsByUuid = childDefs.reduce(
      (uuidsMap, childDef) =>
        NodeDefLayout.isHiddenWhenNotRelevant(cycle)(childDef) && !isChildApplicable(childDef.uuid)(node)
          ? { ...uuidsMap, [childDef.uuid]: true }
          : uuidsMap,
      {}
    )
    return NodeDefLayout.getLayoutChildrenCompressed({ cycle, hiddenDefsByUuid })(nodeDef)
  }

export const isPlaceholder = A.propEq(keys.placeholder, true)
export const isCreated = A.propEq(keys.created, true)
export const isUpdated = A.propEq(keys.updated, true)
export const isDeleted = A.propEq(keys.deleted, true)
export const isDirty = A.propEq(dirtyFlag, true)
export const isRoot = A.pipe(getParentUuid, A.isNil)
export const { isEqual } = ObjectUtils

export const { getValidation } = Validation
export const isValid = A.pipe(getValidation, Validation.isValid)

// ===== READ metadata

export const {
  metaKeys,
  getMeta,
  isChildApplicable,
  isChildEditable,
  isChildVisible,
  isDefaultValueApplied,
  isQualifierValueApplied,
  getHierarchy,
  getHierarchyCode,
} = NodeMeta

// Hierarchy
export const isDescendantOf = (ancestor) => (node) => A.includes(getUuid(ancestor), getHierarchy(node))

//
// ======
// CREATE
// ======
//

export const newNode = (nodeDefUuid, recordUuid, parentNode = null, value = null) => {
  const now = new Date()
  return {
    [keys.uuid]: uuidv4(),
    [keys.nodeDefUuid]: nodeDefUuid,
    [keys.recordUuid]: recordUuid,
    [keys.parentUuid]: getUuid(parentNode),
    [keys.value]: value,
    [keys.meta]: {
      [metaKeys.hierarchy]: parentNode ? A.append(getUuid(parentNode), getHierarchy(parentNode)) : [],
    },
    [keys.created]: true,
    [keys.dateCreated]: now,
    [keys.dateModified]: now,
  }
}

export const newNodePlaceholder = (nodeDef, parentNode, value = null) => ({
  ...newNode(NodeDef.getUuid(nodeDef), getRecordUuid(parentNode), parentNode, value),
  [keys.placeholder]: true,
})

//
// ======
// UPDATE
// ======
//
export const assocValue = A.assoc(keys.value)
export const { assocValidation } = Validation

export const {
  assocMeta,
  mergeMeta,
  assocChildApplicability,
  assocIsDefaultValueApplied,
  assocIsQualifierValueApplied,
} = NodeMeta

export const assocCreated = A.assoc(keys.created)
export const setCreated = (node) => {
  node[keys.created] = true
  return node
}
export const assocDeleted = A.assoc(keys.deleted)
export const assocUpdated = A.assoc(keys.updated)
export const assocDirty = A.assoc(dirtyFlag)
export const removeFlags =
  ({ removeDirtyFlag = true, sideEffect = false } = {}) =>
  (node) => {
    const keysToRemove = removeDirtyFlag ? flagKeysIncludingDirty : flagKeysArray
    if (sideEffect) {
      for (const key of keysToRemove) {
        delete node[key]
      }
      return node
    } else {
      return A.omit(keysToRemove)(node)
    }
  }

export const assocDateModified = A.assoc(keys.dateModified)

//
// ======
// UTILS
// ======
//

export const isValueBlank = (node) => {
  const value = getValue(node, null)

  if (A.isNil(value)) {
    return true
  }

  if (A.is(String, value)) {
    return StringUtils.isBlank(value)
  }

  return A.isEmpty(value)
}

export const hasUserInputValue = (node) => !isValueBlank(node) && !isDefaultValueApplied(node)

// ====== Node Value extractor

// Code
export const getCategoryItemUuid = _getValuePropRaw(valuePropsCode.itemUuid)

export const newNodeValueCode = ({ itemUuid = null, code = null }) => {
  const value = {}
  if (itemUuid) {
    value[valuePropsCode.itemUuid] = itemUuid
  }
  if (Objects.isNotEmpty(code)) {
    value[valuePropsCode.code] = code
  }
  return value
}

// Coordinate
const _getValuePropNumber = ({ node, prop }) => {
  const value = _getValuePropRaw(prop)(node)
  return A.isNil(value) || A.isEmpty(value) ? null : Number(value)
}
export const getCoordinateX = (node) => _getValuePropNumber({ node, prop: valuePropsCoordinate.x })
export const getCoordinateY = (node) => _getValuePropNumber({ node, prop: valuePropsCoordinate.y })

export const getCoordinateSrs = (node, defaultValue = null) =>
  _getValuePropRaw(valuePropsCoordinate.srs, defaultValue)(node)

export const newNodeValueCoordinate = ({
  x,
  y,
  srsId,
  accuracy = undefined,
  altitude = undefined,
  altitudeAccuracy = undefined,
}) => {
  const result = {
    [valuePropsCoordinate.x]: x,
    [valuePropsCoordinate.y]: y,
    [valuePropsCoordinate.srs]: srsId,
  }
  if (!Objects.isEmpty(accuracy)) result[valuePropsCoordinate.accuracy] = accuracy
  if (!Objects.isEmpty(altitude)) result[valuePropsCoordinate.altitude] = altitude
  if (!Objects.isEmpty(altitudeAccuracy)) result[valuePropsCoordinate.altitudeAccuracy] = altitudeAccuracy
  return result
}

const _getDateTimePart = (separator) => (index) => (node) => {
  const value = getValue(node)
  if (A.isNil(value) || A.isEmpty(value) || !A.is(String, value)) return null
  const part = value.split(separator)[index]
  return Number(StringUtils.trim(part))
}

// Date
const _getDatePart = _getDateTimePart('-')
export const getDateYear = _getDatePart(0)
export const getDateMonth = _getDatePart(1)
export const getDateDay = _getDatePart(2)

export const getDateCreated = A.prop(keys.dateCreated)
export const getDateModified = A.prop(keys.dateModified)

// File
export const getFileName = _getValuePropRaw(valuePropsFile.fileName, '')
export const getFileNameCalculated = _getValuePropRaw(valuePropsFile.fileNameCalculated)
export const getFileUuid = _getValuePropRaw(valuePropsFile.fileUuid)
export const newNodeValueFile = ({ fileUuid, fileName }) => ({
  [valuePropsFile.fileUuid]: fileUuid,
  [valuePropsFile.fileName]: fileName,
})

// Taxon
export const getTaxonUuid = _getValuePropRaw(valuePropsTaxon.taxonUuid)
export const getVernacularNameUuid = _getValuePropRaw(valuePropsTaxon.vernacularNameUuid)
export const getScientificName = _getValuePropRaw(valuePropsTaxon.scientificName, '')
export const getVernacularName = _getValuePropRaw(valuePropsTaxon.vernacularName, '')

export const newNodeValueTaxon = ({ taxonUuid }) => ({ [valuePropsTaxon.taxonUuid]: taxonUuid })

// Time
const _getTimePart = _getDateTimePart(':')
export const getTimeHour = _getTimePart(0)
export const getTimeMinute = _getTimePart(1)
export const getTimeSeconds = _getTimePart(2)

// Generic value prop extractor
const _datePropGetters = {
  [valuePropsDate.day]: getDateDay,
  [valuePropsDate.month]: getDateMonth,
  [valuePropsDate.year]: getDateYear,
}

const _timePropGetters = {
  [valuePropsTime.hour]: getTimeHour,
  [valuePropsTime.minute]: getTimeMinute,
  [valuePropsTime.seconds]: getTimeSeconds,
}

const _valuePropGetters = {
  [NodeDef.nodeDefType.date]: (prop) => _datePropGetters[prop],
  [NodeDef.nodeDefType.time]: (prop) => _timePropGetters[prop],
}

export const getValueProp = ({ nodeDef, prop }) => {
  const propGetter = _valuePropGetters[NodeDef.getType(nodeDef)]
  return propGetter ? propGetter(prop) : _getValuePropRaw(prop)
}
