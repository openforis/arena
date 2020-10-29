import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import * as NodeDef from '@core/survey/nodeDef'

export const keys = {
  index: ObjectUtils.keys.index,
  uuid: ObjectUtils.keys.uuid,
  nodeDefUuid: ObjectUtils.keys.nodeDefUuid,
  processingStepUuid: 'processingStepUuid',
  props: ObjectUtils.keys.props,
  script: 'script',
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
export const getScript = R.prop(keys.script)

export const getFormula = ObjectUtils.getProp(keysProps.formula)
export const getType = ObjectUtils.getProp(keysProps.type, type.quantitative)

export const {
  getNodeDefUuid,
  getLabels,
  getLabel,
  getIndex,
  getUuid,
  getProps,
  getPropsDiff,
  isEqual,
  isTemporary,
} = ObjectUtils

// ====== UTILS
export const getNodeDefType = R.pipe(getType, (typeValue) => R.prop(typeValue, nodeDefTypeByType))
export const getTypeByNodeDef = R.pipe(NodeDef.getType, (nodeDefType) => R.prop(nodeDefType, typeByNodeDefType))
