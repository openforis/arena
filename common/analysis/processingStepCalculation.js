import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import * as NodeDef from '@core/survey/nodeDef'

export const keys = {
  index: ObjectUtils.keys.index,
  uuid: ObjectUtils.keys.uuid,
  nodeDefUuid: ObjectUtils.keys.nodeDefUuid,
  processingStepUuid: 'processingStepUuid',
  props: ObjectUtils.keys.props,
  temporary: ObjectUtils.keys.temporary,
}

export const keysProps = {
  type: 'type',
  aggregateFn: 'aggregateFn',
  formula: 'formula',
  labels: ObjectUtils.keysProps.labels,
}

export const type = {
  quantitative: 'quantitative',
  categorical: 'categorical',
}

const nodeDefTypeByType = {
  [type.quantitative]: NodeDef.nodeDefType.decimal,
  [type.categorical]: NodeDef.nodeDefType.code,
}

const typeByNodeDefType = {
  [NodeDef.nodeDefType.decimal]: type.quantitative,
  [NodeDef.nodeDefType.code]: type.categorical,
}

export const aggregateFn = {
  sum: 'sum',
  avg: 'avg',
  cnt: 'cnt',
  min: 'min',
  max: 'max',
  med: 'med',
}

// ====== READ

export const getProcessingStepUuid = R.prop(keys.processingStepUuid)

export const getAggregateFunction = ObjectUtils.getProp(keysProps.aggregateFn)
export const getFormula = ObjectUtils.getProp(keysProps.formula)
export const getNodeDefUuid = ObjectUtils.getNodeDefUuid
export const getLabels = ObjectUtils.getLabels
export const getLabel = ObjectUtils.getLabel
export const getType = ObjectUtils.getProp(keysProps.type, type.quantitative)

export const isQuantitative = R.pipe(getType, R.equals(type.quantitative))

export const getIndex = ObjectUtils.getIndex
export const getUuid = ObjectUtils.getUuid
export const getProps = ObjectUtils.getProps
export const getPropsDiff = ObjectUtils.getPropsDiff
export const isEqual = ObjectUtils.isEqual

export const isTemporary = ObjectUtils.isTemporary

// ====== UPDATE
export const assocIndex = ObjectUtils.assocIndex
export const assocProp = ObjectUtils.setProp
export const assocNodeDefUuid = R.assoc(keys.nodeDefUuid)
export const dissocTemporary = ObjectUtils.dissocTemporary

// ====== UTILS
export const getNodeDefType = R.pipe(getType, type => R.prop(type, nodeDefTypeByType))
export const getTypeByNodeDef = R.pipe(NodeDef.getType, nodeDefType => R.prop(nodeDefType, typeByNodeDefType))
