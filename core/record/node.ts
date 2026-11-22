import * as A from '@core/arena'

import { Objects, ArenaAnyNodeDef } from '@openforis/arena-core'
import type { ArenaRecordNode } from '@openforis/arena-core'

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

type Node = ArenaRecordNode
type NodeUpdater = (node: Node) => Node
// node value shape depends on the node def type: kept as a named alias for readability
type NodeValue = any // NOSONAR

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
} as const
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
} as const

export const isValueProp = ({ nodeDef, prop }: { nodeDef: ArenaAnyNodeDef; prop: string }): boolean =>
  Boolean(A.path([NodeDef.getType(nodeDef), prop])(valuePropsByType))

//
// ======
// READ
// ======
//

export const { getId, getUuid } = ObjectUtils

export const { getParentUuid } = ObjectUtils

export const getRecordUuid = (node: Node): string => A.prop(keys.recordUuid)(node) as string

export const getValue = (node: Node = {} as Node, defaultValue: NodeValue = {}): NodeValue =>
  A.propOr(defaultValue, keys.value, node)

const _getValuePropRaw =
  (prop: string, defaultValue: unknown = null) =>
  (node: Node): any =>
    A.propOr(defaultValue, prop)(getValue(node))

export const { getNodeDefUuid } = ObjectUtils

export const getNodeDefUuids = (nodes: Record<string, Node>): string[] =>
  A.uniq(Object.keys(nodes).map((key) => getNodeDefUuid(nodes[key])))

const _isChildHiddenWhenNotRelevantDefault =
  ({ cycle, node }: { cycle: string; node: Node }) =>
  (childDef: ArenaAnyNodeDef): boolean =>
    NodeDefLayout.isHiddenWhenNotRelevant(cycle)(childDef) && !isChildApplicable(childDef.uuid)(node)

export const getNodeLayoutChildren =
  ({
    cycle,
    nodeDef,
    childDefs,
    isChildHidden = null,
  }: {
    cycle: string
    nodeDef: ArenaAnyNodeDef
    childDefs: ArenaAnyNodeDef[]
    isChildHidden?: ((childDef: ArenaAnyNodeDef) => boolean) | null
  }) =>
  (node: Node) => {
    const isHidden = isChildHidden ?? _isChildHiddenWhenNotRelevantDefault({ cycle, node })
    const hiddenDefsByUuid = childDefs.reduce(
      (uuidsMap, childDef) => (isHidden(childDef) ? { ...uuidsMap, [childDef.uuid]: true } : uuidsMap),
      {}
    )
    return NodeDefLayout.getLayoutChildrenCompressed({ cycle, hiddenDefsByUuid })(nodeDef)
  }

const isFlagTrue =
  (flag: string) =>
  (node: Node): boolean =>
    A.propEq(flag, true)(node)

export const isPlaceholder = isFlagTrue(keys.placeholder)
export const isCreated = isFlagTrue(keys.created)
export const isUpdated = isFlagTrue(keys.updated)
export const isDeleted = isFlagTrue(keys.deleted)
export const isDirty = isFlagTrue(dirtyFlag)
export const isRoot = (node: Node): boolean => A.isNil(getParentUuid(node))
export const { isEqual } = ObjectUtils

export const { getValidation } = Validation
export const isValid = (node: Node): boolean => Validation.isValid(getValidation(node))

// ===== READ metadata

export const {
  metaKeys,
  getMeta,
  isChildApplicable,
  isChildEditable,
  isChildVisible,
  isChildRequired,
  isDefaultValueApplied,
  isQualifierValueApplied,
  getHierarchy,
  getHierarchyCode,
  getMetaKeysWithDefaultValue,
  compactMeta,
  toStoredMeta,
  getStoredMetaKeysToDelete,
} = NodeMeta

// Hierarchy
export const isDescendantOf =
  (ancestor: Node) =>
  (node: Node): boolean =>
    getHierarchy(node).includes(getUuid(ancestor))

//
// ======
// CREATE
// ======
//

export const newNode = (
  nodeDefUuid: string,
  recordUuid: string,
  parentNode: Node | null = null,
  value: NodeValue = null
): Node => {
  // ISO string (as in arena-core nodes and in the nodes fetched from the db): smaller than a Date object
  const now = new Date().toISOString()
  return {
    [keys.uuid]: uuidv4(),
    [keys.nodeDefUuid]: nodeDefUuid,
    [keys.recordUuid]: recordUuid,
    [keys.parentUuid]: getUuid(parentNode),
    [keys.value]: value,
    [keys.meta]: {
      [metaKeys.hierarchy]: parentNode ? [...getHierarchy(parentNode), getUuid(parentNode)] : [],
    },
    [keys.created]: true,
    [keys.dateCreated]: now,
    [keys.dateModified]: now,
  }
}

export const newNodePlaceholder = (nodeDef: ArenaAnyNodeDef, parentNode: Node, value: NodeValue = null): Node => ({
  ...newNode(NodeDef.getUuid(nodeDef), getRecordUuid(parentNode), parentNode, value),
  [keys.placeholder]: true,
})

//
// ======
// UPDATE
// ======
//
export const assocValue =
  (value: NodeValue): NodeUpdater =>
  (node) =>
    A.assoc(keys.value, value, node)
export const { assocValidation } = Validation

export const {
  assocMeta,
  mergeMeta,
  assocChildApplicability,
  assocIsDefaultValueApplied,
  assocIsQualifierValueApplied,
} = NodeMeta

const assocFlag =
  (flag: string) =>
  (value: boolean): NodeUpdater =>
  (node) =>
    A.assoc(flag, value, node)

export const assocCreated = assocFlag(keys.created)
export const setCreated = (node: Node): Node => {
  node[keys.created] = true
  return node
}
export const assocDeleted = assocFlag(keys.deleted)
export const assocUpdated = assocFlag(keys.updated)
export const assocDirty = assocFlag(dirtyFlag)
export const removeFlags =
  ({ removeDirtyFlag = true, sideEffect = false }: { removeDirtyFlag?: boolean; sideEffect?: boolean } = {}) =>
  (node: Node): Node => {
    const keysToRemove = removeDirtyFlag ? flagKeysIncludingDirty : flagKeysArray
    if (sideEffect) {
      // do not use "delete": it would switch the node object to the (much bigger) V8 dictionary mode
      for (const key of keysToRemove) {
        if (node[key] !== undefined) node[key] = undefined
      }
      return node
    } else {
      return A.omit(keysToRemove)(node)
    }
  }

export const assocDateModified =
  (dateModified: string | Date): NodeUpdater =>
  (node) =>
    A.assoc(keys.dateModified, dateModified, node)

//
// ======
// UTILS
// ======
//

export const isValueBlank = (node: Node): boolean => {
  const value = getValue(node, null)

  if (A.isNil(value)) {
    return true
  }

  if (A.is(String, value)) {
    return StringUtils.isBlank(value)
  }

  return A.isEmpty(value)
}

// values filled in from a user group qualifier are not user input
export const hasUserInputValue = (node: Node): boolean =>
  !isValueBlank(node) && !isDefaultValueApplied(node) && !isQualifierValueApplied(node)

// ====== Node Value extractor

// Code
export const getCategoryItemUuid = _getValuePropRaw(valuePropsCode.itemUuid)

export const newNodeValueCode = ({
  itemUuid = null,
  code = null,
}: {
  itemUuid?: string | null
  code?: string | null
}): Record<string, string> => {
  const value: Record<string, string> = {}
  if (itemUuid) {
    value[valuePropsCode.itemUuid] = itemUuid
  }
  if (Objects.isNotEmpty(code)) {
    value[valuePropsCode.code] = code
  }
  return value
}

// Coordinate
const _getValuePropNumber = ({ node, prop }: { node: Node; prop: string }): number | null => {
  const value = _getValuePropRaw(prop)(node)
  return A.isNil(value) || A.isEmpty(value) ? null : Number(value)
}
export const getCoordinateX = (node: Node): number | null => _getValuePropNumber({ node, prop: valuePropsCoordinate.x })
export const getCoordinateY = (node: Node): number | null => _getValuePropNumber({ node, prop: valuePropsCoordinate.y })

export const getCoordinateSrs = (node: Node, defaultValue: string | null = null): string | null =>
  _getValuePropRaw(valuePropsCoordinate.srs, defaultValue)(node)

export const newNodeValueCoordinate = ({
  x,
  y,
  srsId,
  accuracy = undefined,
  altitude = undefined,
  altitudeAccuracy = undefined,
}: {
  x: number | string
  y: number | string
  srsId: string
  accuracy?: number | string
  altitude?: number | string
  altitudeAccuracy?: number | string
}): Record<string, unknown> => {
  const result: Record<string, unknown> = {
    [valuePropsCoordinate.x]: x,
    [valuePropsCoordinate.y]: y,
    [valuePropsCoordinate.srs]: srsId,
  }
  if (!Objects.isEmpty(accuracy)) result[valuePropsCoordinate.accuracy] = accuracy
  if (!Objects.isEmpty(altitude)) result[valuePropsCoordinate.altitude] = altitude
  if (!Objects.isEmpty(altitudeAccuracy)) result[valuePropsCoordinate.altitudeAccuracy] = altitudeAccuracy
  return result
}

const _getDateTimePart =
  (separator: string) =>
  (index: number) =>
  (node: Node): number | null => {
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

// ISO strings (as in arena-core nodes); typed as Date too: some callers still handle Date values
type NodeDate = string | Date | undefined
export const getDateCreated = (node: Node): NodeDate => node?.dateCreated
export const getDateModified = (node: Node): NodeDate => node?.dateModified

// File
export const getFileName = _getValuePropRaw(valuePropsFile.fileName, '')
export const getFileNameCalculated = _getValuePropRaw(valuePropsFile.fileNameCalculated)
export const getFileUuid = _getValuePropRaw(valuePropsFile.fileUuid)
export const newNodeValueFile = ({ fileUuid, fileName }: { fileUuid: string; fileName: string }) => ({
  [valuePropsFile.fileUuid]: fileUuid,
  [valuePropsFile.fileName]: fileName,
})

// Taxon
export const getTaxonUuid = _getValuePropRaw(valuePropsTaxon.taxonUuid)
export const getVernacularNameUuid = _getValuePropRaw(valuePropsTaxon.vernacularNameUuid)
export const getScientificName = _getValuePropRaw(valuePropsTaxon.scientificName, '')
export const getVernacularName = _getValuePropRaw(valuePropsTaxon.vernacularName, '')

export const newNodeValueTaxon = ({ taxonUuid }: { taxonUuid: string }) => ({ [valuePropsTaxon.taxonUuid]: taxonUuid })

// Time
const _getTimePart = _getDateTimePart(':')
export const getTimeHour = _getTimePart(0)
export const getTimeMinute = _getTimePart(1)
export const getTimeSeconds = _getTimePart(2)

// Generic value prop extractor
type NodeValuePropGetter = (node: Node) => any

const _datePropGetters: Record<string, NodeValuePropGetter> = {
  [valuePropsDate.day]: getDateDay,
  [valuePropsDate.month]: getDateMonth,
  [valuePropsDate.year]: getDateYear,
}

const _timePropGetters: Record<string, NodeValuePropGetter> = {
  [valuePropsTime.hour]: getTimeHour,
  [valuePropsTime.minute]: getTimeMinute,
  [valuePropsTime.seconds]: getTimeSeconds,
}

const _valuePropGetters: Record<string, (prop: string) => NodeValuePropGetter> = {
  [NodeDef.nodeDefType.date]: (prop) => _datePropGetters[prop],
  [NodeDef.nodeDefType.time]: (prop) => _timePropGetters[prop],
}

export const getValueProp = ({ nodeDef, prop }: { nodeDef: ArenaAnyNodeDef; prop: string }): NodeValuePropGetter => {
  const propGetter = _valuePropGetters[NodeDef.getType(nodeDef)]
  return propGetter ? propGetter(prop) : _getValuePropRaw(prop)
}
