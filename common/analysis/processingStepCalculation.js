import { uuidv4 } from '@core/uuid'
import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  index: ObjectUtils.keys.index,
  uuid: ObjectUtils.keys.uuid,
  nodeDefUuid: ObjectUtils.keys.nodeDefUuid,
  processingStepUuid: 'processingStepUuid',
  props: ObjectUtils.keys.props,
  temporary: 'temporary', // True when the calculation has been created but not persisted yet
}

export const keysProps = {
  aggregateFn: 'aggregateFn',
  formula: 'formula',
  labels: ObjectUtils.keysProps.labels,
}

const aggregateFn = {
  avg: 'avg',
  count: 'count',
  max: 'max',
  min: 'min',
  sum: 'sum',
}

// ====== CREATE

export const newProcessingStepCalculation = (processingStepUuid, index) => ({
  [keys.uuid]: uuidv4(),
  [keys.processingStepUuid]: processingStepUuid,
  [keys.index]: index,
  [keys.temporary]: true,
})

// ====== READ

export const isTemporary = R.propEq(keys.temporary, true)
export const getAggregateFunction = ObjectUtils.getProp(keysProps.aggregateFn, aggregateFn.sum)
export const getFormula = ObjectUtils.getProp(keysProps.formula)
export const getNodeDefUuid = ObjectUtils.getNodeDefUuid
export const getLabels = ObjectUtils.getLabels

export const getIndex = ObjectUtils.getIndex
export const getUuid = ObjectUtils.getUuid
export const isEqual = ObjectUtils.isEqual

// ====== UPDATE
export const assocIndex = ObjectUtils.assocIndex
export const assocProp = ObjectUtils.setProp
