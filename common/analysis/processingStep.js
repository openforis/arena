import * as R from 'ramda'

import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  calculationSteps: 'calculationSteps',
  index: ObjectUtils.keys.index,
  processingChainUuid: 'processingChainUuid',
  props: ObjectUtils.keys.props,
  uuid: ObjectUtils.keys.uuid,
}

export const keysProps = {
  entityUuid: 'entityUuid', // OR
  categoryUuid: 'categoryUuid', // OR
  virtual: 'virtual', // True|false
}

// ====== READ

export const getProcessingChainUuid = R.prop(keys.processingChainUuid)
export const getCalculationSteps = R.propOr([], keys.calculationSteps)
export const getEntityUuid = ObjectUtils.getProp(keysProps.entityUuid)
export const getCategoryUuid = ObjectUtils.getProp(keysProps.categoryUuid)
export const isVirtual = ObjectUtils.getProp(keysProps.virtual, false)
export const getIndex = ObjectUtils.getIndex
export const getUuid = ObjectUtils.getUuid

// ====== UPDATE

export const assocCalculations = R.assoc(keys.calculationSteps)

export const assocCalculation = calculation => processingStep =>
  R.pipe(
    getCalculationSteps,
    R.ifElse(
      R.pipe(R.length, R.gte(ObjectUtils.getIndex(calculation))),
      R.append(calculation), // Add new calculation
      R.update(ObjectUtils.getIndex(calculation), calculation), // Replace calculation
    ),
    calculationSteps => assocCalculations(calculationSteps)(processingStep),
  )(processingStep)

export const mergeProps = ObjectUtils.mergeProps

export const dissocTemporaryCalculation = processingStep =>
  R.pipe(getCalculationSteps, R.reject(ProcessingStepCalculation.isTemporary), calculationSteps =>
    assocCalculations(calculationSteps)(processingStep),
  )(processingStep)
