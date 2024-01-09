import * as R from 'ramda'

import * as StringUtils from './stringUtils'
import * as DateUtils from './dateUtils'

export const keys = {
  authGroups: 'authGroups',
  cycle: 'cycle',
  dateCreated: 'dateCreated',
  dateModified: 'dateModified',
  draft: 'draft',
  id: 'id',
  index: 'index',
  name: 'name',
  nodeDefUuid: 'nodeDefUuid',
  parentUuid: 'parentUuid',
  props: 'props',
  propsDraft: 'propsDraft',
  published: 'published',
  uuid: 'uuid',
  temporary: 'temporary', // True when the object has been created but not persisted yet
}

export const keysProps = {
  descriptions: 'descriptions',
  labels: 'labels',
  cycles: 'cycles',
}

// ====== READ
export const getId = R.prop(keys.id)
export const getUuid = R.propOr(null, keys.uuid)

export const getProps = R.propOr({}, keys.props)
export const getPropsDraft = R.propOr({}, keys.propsDraft)
export const getProp = (prop, defaultTo = null) => R.pipe(getProps, R.pathOr(defaultTo, prop.split('.')))
export const isKeyTrue = (key) => (obj) => !!R.propOr(false, key)(obj)
export const isPropTrue = (prop) => (obj) => !!getProp(prop)(obj)

export const getParentUuid = R.propOr(null, keys.parentUuid)

export const getLabels = getProp(keysProps.labels, {})
export const getLabel = (lang, defaultTo = null) => R.pipe(getLabels, R.propOr(defaultTo, lang))

export const getDescriptions = getProp(keysProps.descriptions, {})
export const getDescription = (lang, defaultTo = null) => R.pipe(getDescriptions, R.propOr(defaultTo, lang))

export const getDate = (prop) => R.pipe(R.propOr(null, prop), R.unless(R.isNil, DateUtils.parseISO))
export const getDateCreated = getDate(keys.dateCreated)
export const getDateModified = getDate(keys.dateModified)

export const getCycle = R.prop(keys.cycle)
export const getCycles = getProp(keysProps.cycles, [])
export const getIndex = R.pipe(R.propOr(0, keys.index), Number)
export const getNodeDefUuid = R.prop(keys.nodeDefUuid)
export const getAuthGroups = R.propOr([], keys.authGroups)

export const isTemporary = isKeyTrue(keys.temporary)
export const isPublished = isKeyTrue(keys.published)

// ====== CHECK
const isBlank = (value) => value === null || value === undefined || R.isEmpty(value) || StringUtils.isBlank(value)
export const isEqual = (other) => (self) => getUuid(other) === getUuid(self)

// ===== Props

export const getPropsDiff = (other) => (obj) => {
  const propsSelf = getProps(obj)
  const propsOther = getProps(other)
  return R.fromPairs(R.difference(R.toPairs(propsOther), R.toPairs(propsSelf)))
}

// ===== UPDATE
export const assocIndex = R.assoc(keys.index)

export const mergeProps = (props) => (obj) =>
  R.pipe(getProps, R.mergeLeft(props), (propsUpdate) => R.assoc(keys.props, propsUpdate, obj))(obj)

export const setProp = (key, value) => R.assocPath([keys.props, key], value)

export const dissocProp = (key) => R.dissocPath([keys.props, key])

export const setInPath =
  (pathArray, value, includeEmpty = true) =>
  (obj) => {
    if (!includeEmpty && isBlank(value)) {
      return obj
    }

    let objCurrent = obj
    pathArray.forEach((pathPart, i) => {
      if (i === pathArray.length - 1) {
        objCurrent[pathPart] = value
      } else {
        if (!Object.prototype.hasOwnProperty.call(objCurrent, pathPart)) {
          objCurrent[pathPart] = {}
        }

        objCurrent = objCurrent[pathPart]
      }
    })
    return obj
  }

export const dissocTemporary = R.unless(R.isNil, R.dissoc(keys.temporary))

// ====== UTILS / uuid
const _getProp = (propNameOrExtractor) => (item) =>
  typeof propNameOrExtractor === 'string' ? R.path(propNameOrExtractor.split('.'))(item) : propNameOrExtractor(item)

export const toIndexedObj = (array, propNameOrExtractor) =>
  array.reduce((acc, item) => {
    const prop = _getProp(propNameOrExtractor)(item)
    acc[prop] = item
    return acc
  }, {})

export const toUuidIndexedObj = R.partialRight(toIndexedObj, [keys.uuid])

export const groupByProp = (propNameOrExtractor) => (items) =>
  items.reduce((acc, item) => {
    const prop = _getProp(propNameOrExtractor)(item)
    let itemsByProp = acc[prop]
    if (!itemsByProp) {
      itemsByProp = []
      acc[prop] = itemsByProp
    }
    itemsByProp.push(item)
    return acc
  }, {})

export const clone = (obj) => (R.isNil(obj) ? obj : JSON.parse(JSON.stringify(obj)))
