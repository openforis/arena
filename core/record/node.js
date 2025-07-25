import * as R from 'ramda'

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

export const isValueProp = ({ nodeDef, prop }) => Boolean(R.path([NodeDef.getType(nodeDef), prop])(valuePropsByType))

//
// ======
// READ
// ======
//

export const { getId, getUuid } = ObjectUtils

export const { getParentUuid } = ObjectUtils

export const getRecordUuid = R.prop(keys.recordUuid)

export const getValue = (node = {}, defaultValue = {}) => R.propOr(defaultValue, keys.value, node)

const _getValuePropRaw = (prop, defaultValue = null) => R.pipe(getValue, R.propOr(defaultValue, prop))

export const { getNodeDefUuid } = ObjectUtils

export const getNodeDefUuids = (nodes) =>
  R.pipe(
    R.keys,
    R.map((key) => getNodeDefUuid(nodes[key])),
    R.uniq
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

export const isPlaceholder = R.propEq(keys.placeholder, true)
export const isCreated = R.propEq(keys.created, true)
export const isUpdated = R.propEq(keys.updated, true)
export const isDeleted = R.propEq(keys.deleted, true)
export const isDirty = R.propEq(dirtyFlag, true)
export const isRoot = R.pipe(getParentUuid, R.isNil)
export const { isEqual } = ObjectUtils

export const { getValidation } = Validation
export const isValid = R.pipe(getValidation, Validation.isValid)

// ===== READ metadata

export const { metaKeys, getMeta, isChildApplicable, isDefaultValueApplied, getHierarchy, getHierarchyCode } = NodeMeta

// Hierarchy
export const isDescendantOf = (ancestor) => (node) => R.includes(getUuid(ancestor), getHierarchy(node))

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
      [metaKeys.hierarchy]: parentNode ? R.append(getUuid(parentNode), getHierarchy(parentNode)) : [],
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
export const assocValue = R.assoc(keys.value)
export const { assocValidation } = Validation

export const { assocMeta, mergeMeta, assocChildApplicability, assocIsDefaultValueApplied } = NodeMeta

export const assocCreated = R.assoc(keys.created)
export const setCreated = (node) => {
  node[keys.created] = true
  return node
}
export const assocDeleted = R.assoc(keys.deleted)
export const assocUpdated = R.assoc(keys.updated)
export const assocDirty = R.assoc(dirtyFlag)
export const removeFlags =
  ({ removeDirtyFlag = true, sideEffect = false } = {}) =>
  (node) => {
    const keysToRemove = removeDirtyFlag ? flagKeysIncludingDirty : flagKeysArray
    if (sideEffect) {
      keysToRemove.forEach((key) => {
        delete node[key]
      })
      return node
    } else {
      return R.omit(keysToRemove)(node)
    }
  }

export const assocDateModified = R.assoc(keys.dateModified)

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

export const hasUserInputValue = (node) => !isValueBlank(node) && !isDefaultValueApplied(node)

// ====== Node Value extractor

// Code
export const getCategoryItemUuid = _getValuePropRaw(valuePropsCode.itemUuid)

export const newNodeValueCode = ({ itemUuid, code }) => {
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
  return R.isNil(value) || R.isEmpty(value) ? null : Number(value)
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

// Date
const _getDatePart = (index) =>
  R.pipe(R.partialRight(getValue, ['--']), R.split('-'), R.prop(index), StringUtils.trim, Number)
export const getDateYear = _getDatePart(0)
export const getDateMonth = _getDatePart(1)
export const getDateDay = _getDatePart(2)

export const getDateCreated = R.prop(keys.dateCreated)
export const getDateModified = R.prop(keys.dateModified)

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
const _getTimePart = (index) =>
  R.pipe(R.partialRight(getValue, [':']), R.split(':'), R.prop(index), StringUtils.trim, Number)
export const getTimeHour = _getTimePart(0)
export const getTimeMinute = _getTimePart(1)

// Generic value prop extractor
const _datePropGetters = {
  [valuePropsDate.day]: getDateDay,
  [valuePropsDate.month]: getDateMonth,
  [valuePropsDate.year]: getDateYear,
}

const _timePropGetters = {
  [valuePropsTime.hour]: getTimeHour,
  [valuePropsTime.minute]: getTimeMinute,
}

const _valuePropGetters = {
  [NodeDef.nodeDefType.date]: (prop) => _datePropGetters[prop],
  [NodeDef.nodeDefType.time]: (prop) => _timePropGetters[prop],
}

export const getValueProp = ({ nodeDef, prop }) => {
  const propGetter = _valuePropGetters[NodeDef.getType(nodeDef)]
  return propGetter ? propGetter(prop) : _getValuePropRaw(prop)
}
