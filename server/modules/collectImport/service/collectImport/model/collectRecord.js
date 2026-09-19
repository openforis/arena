import * as A from '@core/arena'

export const getRootEntityName = A.pipe(A.keys, A.reject(A.equals('_declaration')), A.head)

export const getRootEntity = (collectRecord, rootEntityName = null) =>
  collectRecord[rootEntityName || getRootEntityName(collectRecord)]

export const getNodeChildren = (path) =>
  A.pipe(
    A.pathOr([], path),
    A.unless(A.is(Array), (l) => [l])
  )

export const getTextValue = (prop) => A.path([prop, '_text'])

export const getTextValues = (valObj) =>
  A.pipe(
    A.keys,
    A.reduce((acc, prop) => A.assoc(prop, getTextValue(prop)(valObj), acc), {})
  )(valObj)

const getAttribute = (attrName) => A.path(['_attributes', attrName])

export const getDateCreated = A.pipe(getRootEntity, getAttribute('created'))
