const R = require('ramda')

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

// READ

const getUuid = R.propOr(null, keys.uuid)

const isEqual = other => self => getUuid(other) === getUuid(self)

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

const setInPath = (pathArray = [], value = '') => obj => {
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

  setInPath,

  // PROPS
  getProps,
  getProp,
  setProp,

  getUuid,
  getParentUuid: R.propOr(null, keys.parentUuid),

  // LABELS
  getLabels,
  getLabel,

  // DESCRIPTIONS
  getDescriptions,
  getDescription,

  // UTILS
  toIndexedObj,
  toUuidIndexedObj,
  isEqual,
}