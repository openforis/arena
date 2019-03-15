const R = require('ramda')

const toList = R.pipe(
  R.defaultTo([]),
  R.ifElse(
    R.is(Array),
    R.identity,
    l => [l]
  )
)

const getList = path => R.pipe(
  R.path(path),
  toList
)

const getTextValue = prop => R.path([prop, '_text'])

const getTextValues = valObj => R.pipe(
  R.keys,
  R.reduce((acc, prop) => R.assoc(prop, getTextValue(prop)(valObj), acc), {})
)(valObj)


module.exports = {
  toList,
  getList,

  getTextValue,
  getTextValues
}