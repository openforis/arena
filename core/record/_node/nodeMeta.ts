import { RecordNodes } from '@openforis/arena-core'
import type { ArenaRecordNode, ArenaRecordNodeMeta } from '@openforis/arena-core'

import * as A from '@core/arena'

type NodeUpdater = (node: ArenaRecordNode) => ArenaRecordNode
type MetaUpdater = (meta: ArenaRecordNodeMeta) => ArenaRecordNodeMeta

const keys = {
  meta: 'meta',
} as const

const metaKeys = {
  hierarchy: 'h', // Ancestor nodes uuids hierarchy
  childApplicability: 'childApplicability', // Applicability by child def uuid
  defaultValue: 'defaultValueApplied', // True if default value has been applied, false if the value is user defined
  hierarchyCode: 'hCode', // Hierarchy of code attribute ancestors (according to the parent code defs specified)
  qualifierValueApplied: 'qualifierValueApplied', // True if the value has been auto-filled from the user group qualifier
  childEditability: 'cEdit', // Editability by child def uuid
  childVisibility: 'cVis', // Visibility by child def uuid
  childRequired: 'cReq', // Child defs whose "required if" condition is met (only true values stored)
  childrenMaxCount: 'childrenMaxCount', // Max count by child def uuid
  childrenMinCount: 'childrenMinCount', // Min count by child def uuid
} as const

// meta keys omitted when empty (a missing value is read as an empty one)
const metaKeysOmittedWhenEmpty = new Set<string>([
  metaKeys.childApplicability,
  metaKeys.childEditability,
  metaKeys.childVisibility,
  metaKeys.childRequired,
  metaKeys.childrenMaxCount,
  metaKeys.childrenMinCount,
  metaKeys.hierarchyCode,
])
// meta keys omitted when falsy (a missing value is read as false)
const metaKeysOmittedWhenFalsy = new Set<string>([metaKeys.defaultValue, metaKeys.qualifierValueApplied])

// READ

const getMeta = (node: ArenaRecordNode): ArenaRecordNodeMeta => A.propOr({}, keys.meta)(node) as ArenaRecordNodeMeta

const isChildApplicable =
  (childDefUuid: string) =>
  (node: ArenaRecordNode): boolean =>
    A.pathOr(true, [keys.meta, metaKeys.childApplicability, childDefUuid])(node)
const isDefaultValueApplied = (node: ArenaRecordNode): boolean => RecordNodes.isDefaultValueApplied(node)
const isQualifierValueApplied = (node: ArenaRecordNode): boolean => RecordNodes.isQualifierValueApplied(node)

const getHierarchy = (node: ArenaRecordNode): string[] => A.pathOr([], [keys.meta, metaKeys.hierarchy])(node)

const isChildEditable =
  (childDefUuid: string) =>
  (node: ArenaRecordNode): boolean =>
    RecordNodes.isChildEditable(node, childDefUuid)

const isChildVisible =
  (childDefUuid: string) =>
  (node: ArenaRecordNode): boolean =>
    RecordNodes.isChildVisible(node, childDefUuid)

const isChildRequired =
  (childDefUuid: string) =>
  (node: ArenaRecordNode): boolean =>
    RecordNodes.isChildRequired(node, childDefUuid)

// Code metadata
const getHierarchyCode = (node: ArenaRecordNode): string[] => A.pathOr([], [keys.meta, metaKeys.hierarchyCode])(node)

const _isMetaValueDefault = ([key, value]: [string, unknown]): boolean =>
  (metaKeysOmittedWhenEmpty.has(key) && A.isEmpty(value)) || (metaKeysOmittedWhenFalsy.has(key) && !value)

/**
 * Returns the keys of the node meta items having the default value (a missing item is read back in the same way).
 * @param meta - The node meta.
 * @returns The keys of the items having the default value.
 */
const getMetaKeysWithDefaultValue = (meta?: ArenaRecordNodeMeta | null): string[] =>
  Object.entries(meta ?? {})
    .filter(_isMetaValueDefault)
    .map(([key]) => key)

/**
 * Removes from the node meta the items having the default value (they are read back in the same way), to save space.
 * When the meta is merged into the stored one, the removed keys must be deleted from the stored meta too.
 * @param meta - The node meta.
 * @returns The node meta without the items having the default value.
 */
const compactMeta = (meta?: ArenaRecordNodeMeta | null): ArenaRecordNodeMeta =>
  Object.fromEntries(Object.entries(meta ?? {}).filter((entry) => !_isMetaValueDefault(entry)))

// meta keys not stored in the db: the hierarchy is rebuilt from the parent uuids when reading the nodes
const metaKeysNotStored = new Set<string>([metaKeys.hierarchy])

/**
 * Returns the node meta to store in the db: compacted (see compactMeta) and without the items rebuilt when reading the nodes.
 * @param meta - The node meta.
 * @returns The node meta to store.
 */
const toStoredMeta = (meta?: ArenaRecordNodeMeta | null): ArenaRecordNodeMeta =>
  Object.fromEntries(
    Object.entries(meta ?? {}).filter((entry) => !metaKeysNotStored.has(entry[0]) && !_isMetaValueDefault(entry))
  )

/**
 * Returns the keys to delete from the stored node meta when merging the given meta into it (see toStoredMeta).
 * @param meta - The node meta being merged.
 * @returns The keys to delete from the stored meta.
 */
const getStoredMetaKeysToDelete = (meta?: ArenaRecordNodeMeta | null): string[] => [
  ...getMetaKeysWithDefaultValue(meta),
  ...metaKeysNotStored,
]

// UPDATE

const assocMeta =
  (meta: ArenaRecordNodeMeta): NodeUpdater =>
  (node) =>
    A.assoc(keys.meta, meta, node)

const _updateMeta =
  (updateFn: MetaUpdater): NodeUpdater =>
  (node) => {
    const metaOld = getMeta(node)
    const metaUpdated = updateFn(metaOld)
    return assocMeta(metaUpdated)(node)
  }

const mergeMeta = (meta: ArenaRecordNodeMeta): NodeUpdater => _updateMeta((metaOld) => A.mergeLeft(meta)(metaOld))

// sets the flag only when true (missing means false)
const _assocMetaFlag =
  (metaKey: string) =>
  (value: boolean): NodeUpdater =>
    _updateMeta((metaOld) => {
      const metaUpdated: Record<string, unknown> = { ...metaOld }
      if (value) {
        metaUpdated[metaKey] = true
      } else {
        delete metaUpdated[metaKey]
      }
      return metaUpdated
    })

const assocIsDefaultValueApplied = _assocMetaFlag(metaKeys.defaultValue)

const assocIsQualifierValueApplied = _assocMetaFlag(metaKeys.qualifierValueApplied)

const assocChildApplicability = ({
  nodeDefUuid,
  applicable,
}: {
  nodeDefUuid: string
  applicable: boolean
}): NodeUpdater =>
  _updateMeta((metaOld) => {
    const metaKey = metaKeys.childApplicability
    const childApplicabilityOld = metaOld[metaKey]
    const childApplicabilityUpdated: Record<string, boolean> = { ...childApplicabilityOld }
    if (applicable) {
      // applicable is true by default, remove it from meta object
      delete childApplicabilityUpdated[nodeDefUuid]
    } else {
      childApplicabilityUpdated[nodeDefUuid] = false
    }
    const metaUpdated = { ...metaOld }
    if (A.isEmpty(childApplicabilityUpdated)) {
      delete metaUpdated[metaKey]
    } else {
      metaUpdated[metaKey] = childApplicabilityUpdated
    }
    return metaUpdated
  })

export const NodeMeta = {
  keys,
  metaKeys,

  getMeta,
  isChildApplicable,
  isDefaultValueApplied,
  isQualifierValueApplied,
  getHierarchy,
  getHierarchyCode,
  isChildEditable,
  isChildVisible,
  isChildRequired,
  getMetaKeysWithDefaultValue,
  compactMeta,
  toStoredMeta,
  getStoredMetaKeysToDelete,

  assocMeta,
  mergeMeta,
  assocIsDefaultValueApplied,
  assocIsQualifierValueApplied,
  assocChildApplicability,
}
