const R = require('ramda')

const keys = {
  id: 'id',
  uuid: 'uuid',
  parentUuid: 'parentUuid',
  props: 'props',
}

// READ
const getProps = R.propOr({}, keys.props)

const getProp = (prop, defaultTo = null) => R.pipe(
  getProps,
  R.pathOr(defaultTo, prop.split('.'))
)

const getLabels = getProp('labels', {})

const getLabel = (lang, defaultTo = null) => R.pipe(
  getLabels,
  R.propOr(defaultTo, lang)
)

//UPDATE
const setProp = (key, value) => R.assocPath([keys.props, key], value)

// UTILS / uuid

const toIndexedObj = (array, prop) => {
  const result = {}
  array.forEach(item => result[item[prop]] = item)
  return result
}

const toUuidIndexedObj = array => toIndexedObj(array, keys.uuid)

module.exports = {
  keys,

  // PROPS
  getProps,
  getProp,
  setProp,

  // LABELS
  getLabels,
  getLabel,

  // UTILS / uuid
  getUuid: R.propOr(null, keys.uuid),
  getParentUuid: R.propOr(null, keys.parentUuid),
  toIndexedObj,
  toUuidIndexedObj,
}
