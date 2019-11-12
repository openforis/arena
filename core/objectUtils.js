import * as R from 'ramda'

import * as StringUtils from './stringUtils'
import * as DateUtils from './dateUtils'

export const keys = {
  authGroups: 'authGroups',
  cycle: 'cycle',
  dateCreated: 'dateCreated',
  dateModified: 'dateModified',
  id: 'id',
  index: 'index',
  name: 'name',
  nodeDefUuid: 'nodeDefUuid',
  parentUuid: 'parentUuid',
  props: 'props',
  uuid: 'uuid',
}

export const keysProps = {
  descriptions: 'descriptions',
  labels: 'labels',
}

//====== CHECK
const isBlank = value => value === null || value === undefined || R.isEmpty(value) || StringUtils.isBlank(value)
export const isEqual = other => self => getUuid(other) === getUuid(self)

//====== READ
export const getId = R.prop(keys.id)
export const getUuid = R.propOr(null, keys.uuid)

export const getProps = R.propOr({}, keys.props)
export const getProp = (prop, defaultTo = null) => R.pipe(
  getProps,
  R.pathOr(defaultTo, prop.split('.'))
)

export const getParentUuid = R.propOr(null, keys.parentUuid)

export const getLabels = getProp(keysProps.labels, {})
export const getLabel = (lang, defaultTo = null) => R.pipe(
  getLabels,
  R.propOr(defaultTo, lang)
)

export const getDescriptions = getProp(keysProps.descriptions, {})
export const getDescription = (lang, defaultTo = null) => R.pipe(
  getDescriptions,
  R.propOr(defaultTo, lang)
)

export const getDate = prop => R.pipe(
  R.propOr(null, prop),
  R.unless(
    R.isNil,
    DateUtils.parseISO
  )
)
export const getDateCreated = getDate(keys.dateCreated)
export const getDateModified = getDate(keys.dateModified)

export const getCycle = R.prop(keys.cycle)
export const getIndex = R.propOr(0, keys.index)
export const getNodeDefUuid = R.prop(keys.nodeDefUuid)
export const getAuthGroups = R.prop(keys.authGroups)

//===== UPDATE
export const mergeProps = props => obj => R.pipe(
  getProps,
  R.mergeLeft(props),
  propsUpdate => R.assoc(keys.props, propsUpdate, obj)
)(obj)

export const setProp = (key, value) => R.assocPath([keys.props, key], value)

export const setInPath = (pathArray, value, includeEmpty = true) => obj => {
  if (!includeEmpty && isBlank(value)) {
    return obj
  }

  let objCurrent = obj
  pathArray.forEach((pathPart, i) => {
    if (i === pathArray.length - 1) {
      objCurrent[pathPart] = value
    } else {
      if (!objCurrent.hasOwnProperty(pathPart)) {
        objCurrent[pathPart] = {}
      }
      objCurrent = objCurrent[pathPart]
    }
  })
  return obj
}

//====== UTILS / uuid
export const toIndexedObj = (array, prop) => array.reduce(
  (acc, item) => {
    acc[item[prop]] = item
    return acc
  },
  {}
)

export const toUuidIndexedObj = R.partialRight(toIndexedObj, [keys.uuid])
