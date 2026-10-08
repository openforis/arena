import * as A from '@core/arena'

import { Nodes } from '@openforis/arena-core'

const keys = {
  meta: 'meta',
}

const metaKeys = {
  hierarchy: 'h', // Ancestor nodes uuids hierarchy
  childApplicability: 'childApplicability', // Applicability by child def uuid
  defaultValue: 'defaultValueApplied', // True if default value has been applied, false if the value is user defined
  hierarchyCode: 'hCode', // Hierarchy of code attribute ancestors (according to the parent code defs specified)
  qualifierValueApplied: 'qualifierValueApplied', // True if the value has been auto-filled from the user group qualifier
  childEditability: 'cEdit', // Editability by child def uuid
  childVisibility: 'cVis', // Visibility by child def uuid
  childrenMaxCount: 'childrenMaxCount', // Max count by child def uuid
  childrenMinCount: 'childrenMinCount', // Min count by child def uuid
}

// meta keys omitted when empty (a missing value is read as an empty one)
const metaKeysOmittedWhenEmpty = new Set([
  metaKeys.childApplicability,
  metaKeys.childEditability,
  metaKeys.childVisibility,
  metaKeys.childrenMaxCount,
  metaKeys.childrenMinCount,
  metaKeys.hierarchyCode,
])
// meta keys omitted when falsy (a missing value is read as false)
const metaKeysOmittedWhenFalsy = new Set([metaKeys.defaultValue, metaKeys.qualifierValueApplied])

// READ

const getMeta = A.propOr({}, keys.meta)

const isChildApplicable = (childDefUuid) => A.pathOr(true, [keys.meta, metaKeys.childApplicability, childDefUuid])
const isDefaultValueApplied = A.pathOr(false, [keys.meta, metaKeys.defaultValue])
const isQualifierValueApplied = A.pathOr(false, [keys.meta, metaKeys.qualifierValueApplied])

const getHierarchy = A.pathOr([], [keys.meta, metaKeys.hierarchy])

const isChildEditable = (childDefUuid) => (node) => Nodes.isChildEditable(node, childDefUuid)

const isChildVisible = (childDefUuid) => (node) => Nodes.isChildVisible(node, childDefUuid)

// Code metadata
const getHierarchyCode = A.pathOr([], [keys.meta, metaKeys.hierarchyCode])

const _isMetaValueDefault = ([key, value]) =>
  (metaKeysOmittedWhenEmpty.has(key) && A.isEmpty(value)) || (metaKeysOmittedWhenFalsy.has(key) && !value)

/**
 * Removes from the node meta the items having the default value (they are read back in the same way), to save space.
 * It must be used only when the meta is stored as a whole (e.g. Insert), not when it is merged into the stored one.
 * @param {object} [meta] - The node meta.
 * @returns {object} - The node meta without the items having the default value.
 */
const compactMeta = (meta) =>
  Object.fromEntries(Object.entries(meta ?? {}).filter((entry) => !_isMetaValueDefault(entry)))

// UPDATE

const assocMeta = A.assoc(keys.meta)

const _updateMeta = (updateFn) => (node) => {
  const metaOld = getMeta(node)
  const metaUpdated = updateFn(metaOld)
  return assocMeta(metaUpdated)(node)
}

const mergeMeta = (meta) => _updateMeta((metaOld) => A.mergeLeft(meta)(metaOld))

const assocIsDefaultValueApplied = (value) =>
  _updateMeta((metaOld) => {
    const metaKey = metaKeys.defaultValue
    const metaUpdated = { ...metaOld }
    if (value) {
      metaUpdated[metaKey] = true
    } else {
      // default value is false by default
      delete metaUpdated[metaKey]
    }
    return metaUpdated
  })

const assocIsQualifierValueApplied = (value) =>
  _updateMeta((metaOld) => {
    const metaKey = metaKeys.qualifierValueApplied
    const metaUpdated = { ...metaOld }
    if (value) {
      metaUpdated[metaKey] = true
    } else {
      // qualifier value applied is false by default
      delete metaUpdated[metaKey]
    }
    return metaUpdated
  })

const assocChildApplicability = ({ nodeDefUuid, applicable }) =>
  _updateMeta((metaOld) => {
    const metaKey = metaKeys.childApplicability
    const childApplicabilityOld = metaOld[metaKey]
    const childApplicabilityUpdated = { ...childApplicabilityOld }
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
  compactMeta,

  assocMeta,
  mergeMeta,
  assocIsDefaultValueApplied,
  assocIsQualifierValueApplied,
  assocChildApplicability,
}
