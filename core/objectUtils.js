const R = require('ramda')

const StringUtils = require('./stringUtils')
const DateUtils = require('./dateUtils')

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
const getId = R.prop(keys.id)
const getUuid = R.propOr(null, keys.uuid)

const getProps = R.propOr({}, keys.props)
const getProp = (prop, defaultTo = null) => R.pipe(
  getProps,
  R.pathOr(defaultTo, prop.split('.'))
)

const getLabels = getProp(keysProps.labels, {})
const getLabel = (lang, defaultTo = null) => R.pipe(
  getLabels,
  R.propOr(defaultTo, lang)
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
const getAuthGroups = R.prop(keys.authGroups)

//===== UPDATE
const mergeProps = props => obj => R.pipe(
  getProps,
  R.mergeLeft(props),
  propsUpdate => R.assoc(keys.props, propsUpdate, obj)
)(obj)

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

module.exports = {
  keys,
  keysProps,

  // READ
  getId,
  getUuid,
  getProps,
  getProp,
  getParentUuid: R.propOr(null, keys.parentUuid),
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
  getAuthGroups,

  // UPDATE
  mergeProps,
  setProp,
  setInPath,

  // UTILS
  isEqual,
  toIndexedObj,
  toUuidIndexedObj,
}