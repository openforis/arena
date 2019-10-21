import * as R from 'ramda';
import DateUtils from '../../../../../../core/dateUtils';

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

// TODO: is date a string here?
const getDateCreated: (x: any) => string = R.pipe(
  getRootEntity,
  getAttribute('created') as (x: any) => string,
)

export default {
  getRootEntityName,
  getRootEntity,
  getDateCreated,
  getNodeChildren,

  getTextValue,
  getTextValues,

};
