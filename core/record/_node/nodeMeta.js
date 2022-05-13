import * as R from 'ramda'

const keys = {
  meta: 'meta',
}

const metaKeys = {
  hierarchy: 'h', // Ancestor nodes uuids hierarchy
  childApplicability: 'childApplicability', // Applicability by child def uuid
  defaultValue: 'defaultValueApplied', // True if default value has been applied, false if the value is user defined
  hierarchyCode: 'hCode', // Hierarchy of code attribute ancestors (according to the parent code defs specified)
}

// READ

const getMeta = R.propOr({}, keys.meta)

const isChildApplicable = (childDefUuid) => R.pathOr(true, [keys.meta, metaKeys.childApplicability, childDefUuid])
const isDefaultValueApplied = R.pathOr(false, [keys.meta, metaKeys.defaultValue])

const getHierarchy = R.pathOr([], [keys.meta, metaKeys.hierarchy])

// Code metadata
const getHierarchyCode = R.pathOr([], [keys.meta, metaKeys.hierarchyCode])

// UPDATE

const assocMeta = R.assoc(keys.meta)

const _updateMeta = (updateFn) => (node) => {
  const metaOld = getMeta(node)
  const metaUpdated = updateFn(metaOld)
  return assocMeta(metaUpdated)(node)
}

const mergeMeta = (meta) => _updateMeta((metaOld) => R.mergeLeft(meta)(metaOld))

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
    if (R.isEmpty(childApplicabilityUpdated)) {
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
  getHierarchy,
  getHierarchyCode,

  assocMeta,
  mergeMeta,
  assocIsDefaultValueApplied,
  assocChildApplicability,
}
