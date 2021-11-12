import * as R from 'ramda'

const keys = {
  meta: 'meta',
}

const metaKeys = {
  hierarchy: 'h', // Ancestor nodes uuids hierarchy
  childApplicability: 'childApplicability', // Applicability by child def uuid
  defaultValue: 'defaultValue', // True if default value has been applied, false if the value is user defined
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

const mergeMeta = (meta) => (node) => {
  const metaOld = getMeta(node)
  const metaUpdated = R.mergeLeft(meta)(metaOld)
  return assocMeta(metaUpdated)(node)
}

const assocIsDefaultValueApplied = (value) => (node) => {
  const metaKey = metaKeys.defaultValue
  const metaOld = getMeta(node)
  const metaUpdated = { ...metaOld }
  if (value) {
    metaUpdated[metaKey] = true
  } else {
    // default value is false by default
    delete metaUpdated[metaKey]
  }
  return assocMeta(metaUpdated)(node)
}

const assocChildApplicability =
  ({ nodeDefUuid, applicable }) =>
  (node) => {
    const metaKey = metaKeys.childApplicability
    const metaOld = getMeta(node)
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
    return assocMeta(metaUpdated)(node)
  }

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
