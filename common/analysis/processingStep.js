import * as R from 'ramda'

import * as StepVariable from '@common/analysis/stepVariable'

import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  calculations: 'calculations',
  calculationUuids: 'calculationUuids', // Associated only when processing step is saved
  index: ObjectUtils.keys.index,
  processingChainUuid: 'processingChainUuid',
  props: ObjectUtils.keys.props,
  temporary: ObjectUtils.keys.temporary,
  uuid: ObjectUtils.keys.uuid,
}

export const keysProps = {
  entityUuid: 'entityUuid', // OR
  categoryUuid: 'categoryUuid', // OR
  virtual: 'virtual', // True|false
  variablesPreviousStep: 'variablesPreviousStep', // Array of calculation variables of previous step (sorted by calculations)
}

// ====== READ

export const getProcessingChainUuid = R.prop(keys.processingChainUuid)
export const getCalculations = R.propOr([], keys.calculations)
export const getEntityUuid = ObjectUtils.getProp(keysProps.entityUuid)
export const getCategoryUuid = ObjectUtils.getProp(keysProps.categoryUuid)
export const isVirtual = ObjectUtils.getProp(keysProps.virtual, false)
export const getVariablesPreviousStep = ObjectUtils.getProp(keysProps.variablesPreviousStep, {})
export const hasVariablePreviousStep = (variableUuid) =>
  R.pipe(
    getVariablesPreviousStep,
    R.find((variable) => StepVariable.getUuid(variable) === variableUuid),
    Boolean
  )
export const { getIndex, getUuid, getProps, getPropsDiff } = ObjectUtils
/**
 * Returns the uuids of all associated calculations.
 * Note: calculationUuids has a value only when calculation step is passed as parameter to the API.
 */
export const getCalculationUuids = R.propOr([], keys.calculationUuids)

export const { isEqual, isTemporary } = ObjectUtils

// ===== UTILS

export const hasEntity = R.pipe(getEntityUuid, R.isNil, R.not)
export const hasCategory = R.pipe(getCategoryUuid, R.isNil, R.not)
