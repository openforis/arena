const R = require('ramda')

const StringUtils = require('./stringUtils')

const keys = {
  id: 'id',
  uuid: 'uuid',
  parentUuid: 'parentUuid',
  props: 'props',
}

const keysProps = {
  descriptions: 'descriptions',
  labels: 'labels',
}

// CHECK

const isBlank = value => value === null || value === undefined || R.isEmpty(value) || StringUtils.isBlank(value)

// READ

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

// ===== UPDATE

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

// UTILS / uuid

const isEqual = other => self => getUuid(other) === getUuid(self)

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
  getProps,
  getProp,
  getUuid,
  getParentUuid: R.propOr(null, keys.parentUuid),
  getLabels,
  getLabel,
  getDescriptions,
  getDescription,

  // UPDATE
  setProp,
  setInPath,

  // UTILS
  isEqual,
  toIndexedObj,
  toUuidIndexedObj,
}