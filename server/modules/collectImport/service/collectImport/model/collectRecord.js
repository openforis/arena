const R = require('ramda')

const DateUtils = require('../../../../../../core/dateUtils')

const getRootEntityName = R.pipe(
  R.keys,
  R.reject(R.equals('_declaration')),
  R.head,
)

const getRootEntity = (collectRecord, rootEntityName = null) =>
  collectRecord[rootEntityName || getRootEntityName(collectRecord)]

const getNodeChildren = path => R.pipe(
  R.pathOr([], path),
  R.unless(
    R.is(Array),
    l => [l]
  )
)

const getTextValue = prop => R.path([prop, '_text'])

const getTextValues = valObj => R.pipe(
  R.keys,
  R.reduce((acc, prop) => R.assoc(prop, getTextValue(prop)(valObj), acc), {})
)(valObj)

const getAttribute = attrName => R.path(['_attributes', attrName])

const getDateCreated = R.pipe(
  getRootEntity,
  getAttribute('created'),
)

module.exports = {
  getRootEntityName,
  getRootEntity,
  getDateCreated,
  getNodeChildren,

  getTextValue,
  getTextValues,

}