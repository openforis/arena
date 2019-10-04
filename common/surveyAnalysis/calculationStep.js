const R = require('ramda')

const ObjectUtils = require('../objectUtils')

const keys = {
  index: ObjectUtils.keys.index,
  uuid: ObjectUtils.keys.uuid
}

const keysProps = {
  nodeDefUuid: 'nodeDefUuid',
  formula: 'formula',
  aggregateFn: 'aggregateFn',
}

const aggregateFn = {
  avg: 'avg',
  count:'count',
  max: 'max',
  min: 'min',
  sum: 'sum',
}
// ====== READ

const getAggregateFunction = ObjectUtils.getProp(keysProps.aggregateFn, aggregateFn.sum)
const getFormula = ObjectUtils.getProp(keysProps.formula)
const getNodeDefUuid = ObjectUtils.getProp(keysProps.nodeDefUuid)

module.exports = {
  //READ
  getAggregateFunction,
  getFormula,
  getIndex: ObjectUtils.getIndex,
  getNodeDefUuid,
  getUuid: ObjectUtils.getUuid,

}