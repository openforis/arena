const R = require('ramda')
const camelize = require('camelize')

// READ
const getProps = R.propOr({}, 'props')

const getProp = (prop, defaultTo = null) => R.pipe(
  getProps,
  R.propOr(defaultTo, prop)
)

const getLabels = getProp('labels', {})

const getLabel = (lang, defaultTo = null) => R.pipe(
  getLabels,
  R.propOr(defaultTo, lang)
)

//UPDATE
const setProp = (key, value) => R.assocPath(['props', key], value)

// UTILS / uuid
const toIndexedObj = (array, prop) => R.reduce((acc, item) => R.assoc(R.prop(prop)(item), item)(acc), {})(array)

const uuid = 'uuid'

const getUuid = R.prop(uuid)

const toUuidIndexedObj = R.partialRight(toIndexedObj, [uuid])

module.exports = {
  // PROPS
  getProps,
  getProp,
  setProp,

  // LABELS
  getLabels,
  getLabel,

  // UTILS / uuid
  toIndexedObj,
  toUuidIndexedObj,
  getUuid,

}
