import ObjectUtils from '../../core/objectUtils';

export const keys = {
  index: ObjectUtils.keys.index,
  uuid: ObjectUtils.keys.uuid,
  nodeDefUuid: ObjectUtils.keys.nodeDefUuid,
  processingStepUuid: 'processingStepUuid',
  props: ObjectUtils.keys.props,
}

export const keysProps = {
  formula: 'formula',
  aggregateFn: 'aggregateFn',
}

const aggregateFn = {
  avg: 'avg',
  count: 'count',
  max: 'max',
  min: 'min',
  sum: 'sum',
}
// ====== READ

export const getAggregateFunction = ObjectUtils.getProp(keysProps.aggregateFn, aggregateFn.sum)
export const getFormula = ObjectUtils.getProp(keysProps.formula)
export const getNodeDefUuid = ObjectUtils.getNodeDefUuid

export const getIndex = ObjectUtils.getIndex
export const getUuid = ObjectUtils.getUuid


export default {
  keys,
  keysProps,

  //READ
  getAggregateFunction,
  getFormula,
  getIndex,
  getNodeDefUuid,
  getUuid,
};
