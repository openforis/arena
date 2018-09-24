const R = require('ramda')
const camelize = require('camelize')

const {leftTrim} = require('../../common/stringUtils')

// naming utils

const normalizeName = R.pipe(
  leftTrim,
  R.toLower,
  R.replace(/[^a-z0-9]/g, '_'),
  R.slice(0, 60),
)

/**
 * NodeDef and Survey common PROPS UTILS
 */
//DB Utils
const mergeProps = def => {
  const {props, propsDraft} = def
  const propsMerged = R.mergeDeepRight(props, propsDraft, def)

  return R.pipe(
    R.assoc('props', propsMerged),
    R.dissoc('propsDraft'),
  )(def)
}

const defDbTransformCallback = (def, draft = false) => def
  ? R.pipe(
    camelize,
    def => draft
      ? mergeProps(def, draft)
      : R.omit(['propsDraft'], def),
  )(def)
  : null

// READ
const getProps = R.pipe(
  R.prop('props'),
  R.defaultTo({}),
)

const getProp = (prop, defaultTo = null) => R.pipe(
  getProps,
  R.prop(prop),
  R.defaultTo(defaultTo),
)

const getLabels = getProp('labels', {})

//UPDATE
const setProp = (key, value) => R.assocPath(['props', key], value)

// UTILS
const toIndexedObj = (array, prop) => R.reduce((acc, item) => R.assoc(R.prop(prop)(item), item)(acc), {})(array)

const toUUIDIndexedObj = R.partialRight(toIndexedObj, ['uuid'])

module.exports = {
  normalizeName,
  toIndexedObj,
  toUUIDIndexedObj,

  // PROPS
  defDbTransformCallback,

  getProps,
  getProp,
  getLabels,

  setProp,
}
