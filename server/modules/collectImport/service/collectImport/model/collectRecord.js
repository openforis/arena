import * as R from 'ramda'

import * as DateUtils from '@core/dateUtils'

export const getRootEntityName = R.pipe(
  R.keys,
  R.reject(R.equals('_declaration')),
  R.head,
)

export const getRootEntity = (collectRecord, rootEntityName = null) =>
  collectRecord[rootEntityName || getRootEntityName(collectRecord)]

export const getNodeChildren = path => R.pipe(
  R.pathOr([], path),
  R.unless(
    R.is(Array),
    l => [l]
  )
)

export const getTextValue = prop => R.path([prop, '_text'])

export const getTextValues = valObj => R.pipe(
  R.keys,
  R.reduce((acc, prop) => R.assoc(prop, getTextValue(prop)(valObj), acc), {})
)(valObj)

const getAttribute = attrName => R.path(['_attributes', attrName])

export const getDateCreated = R.pipe(
  getRootEntity,
  getAttribute('created'),
)
