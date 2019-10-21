import * as R from 'ramda';
import StringUtils from './stringUtils';
import DateUtils from './dateUtils';

const keys = {
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

const keysProps = {
  descriptions: 'descriptions',
  labels: 'labels',
}

//====== CHECK
const isBlank = value => value === null || value === undefined || R.isEmpty(value) || StringUtils.isBlank(value)
const isEqual = other => self => getUuid(other) === getUuid(self)

//====== READ
// TODO: Make the return type into: string | null
// Currently it's not, since doing so would require large changes everywhere...
const getUuid: (x: any) => string = R.propOr(null, keys.uuid)

const getProps = R.propOr({}, keys.props)
const getProp = (prop, defaultTo: any = null) => R.pipe(
  getProps,
  R.pathOr(defaultTo, prop.split('.'))
)

const getLabels: (x: any) => ({ [lang: string]: string; })[] = getProp(keysProps.labels, {})
const getLabel: (lang: string, defaultTo?: string | null) => any
= (lang, defaultTo = null) => R.pipe(
  getLabels as (x: any) => any,
  R.propOr(defaultTo, lang) as (x: any) => any,
)

const getDescriptions = getProp(keysProps.descriptions, {})
const getDescription = (lang, defaultTo = null) => R.pipe(
  getDescriptions,
  R.propOr(defaultTo, lang)
)

const getDate = prop => R.pipe(
  R.propOr(null, prop),
  R.unless(
    R.isNil,
    DateUtils.parseISO
  )
)
const getDateCreated = getDate(keys.dateCreated)
const getDateModified = getDate(keys.dateModified)

const getCycle = R.prop(keys.cycle)
const getIndex = R.propOr(0, keys.index)
const getNodeDefUuid = R.prop(keys.nodeDefUuid)

//===== UPDATE
const setProp = (key, value) => R.assocPath([keys.props, key], value)

const setInPath = (pathArray, value, includeEmpty = true) => obj => {
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
const toIndexedObj = (array, prop) => array.reduce(
  (acc, item) => {
    acc[item[prop]] = item
    return acc
  },
  {}
)

const toUuidIndexedObj = R.partialRight(toIndexedObj, [keys.uuid])

export default {
  keys,
  keysProps,

  // READ
  getProps,
  getProp,
  getUuid,
  getParentUuid: R.propOr(null, keys.parentUuid) as (x: any) => string,
  getLabels,
  getLabel,
  getDescriptions,
  getDescription,
  getDate,
  getDateCreated,
  getDateModified,
  getCycle,
  getIndex,
  getNodeDefUuid,

  // UPDATE
  setProp,
  setInPath,

  // UTILS
  isEqual,
  toIndexedObj,
  toUuidIndexedObj
};
