import * as R from 'ramda'

import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as ObjectUtils from '@core/objectUtils'
import * as Validation from '@core/validation/validation'

export const keys = {
  calculations: 'calculations',
  calculationUuids: 'calculationUuids',
  calculationsCount: 'calculationsCount',
  index: ObjectUtils.keys.index,
  processingChainUuid: 'processingChainUuid',
  props: ObjectUtils.keys.props,
  uuid: ObjectUtils.keys.uuid,
  temporary: ObjectUtils.keys.temporary,
}

export const keysProps = {
  entityUuid: 'entityUuid', // OR
  categoryUuid: 'categoryUuid', // OR
  virtual: 'virtual', // True|false
}

// ====== READ

export const getProcessingChainUuid = R.prop(keys.processingChainUuid)
export const getCalculations = R.propOr([], keys.calculations)
export const getCalculationsCount = R.pipe(R.propOr(0, keys.calculationsCount), Number)
export const getEntityUuid = ObjectUtils.getProp(keysProps.entityUuid)
export const getCategoryUuid = ObjectUtils.getProp(keysProps.categoryUuid)
export const isVirtual = ObjectUtils.getProp(keysProps.virtual, false)
export const getIndex = ObjectUtils.getIndex
export const getUuid = ObjectUtils.getUuid
export const getProps = ObjectUtils.getProps
export const getPropsDiff = ObjectUtils.getPropsDiff
export const getCalculationUuids = R.propOr([], keys.calculationUuids)

export const isEqual = ObjectUtils.isEqual
export const isTemporary = ObjectUtils.isTemporary

// ====== UPDATE

export const assocIndex = ObjectUtils.assocIndex
export const mergeProps = ObjectUtils.mergeProps
export const dissocTemporary = ObjectUtils.dissocTemporary

export const assocEntityUuid = entityUuid => ObjectUtils.setProp(keysProps.entityUuid, entityUuid)
export const assocCalculations = R.assoc(keys.calculations)
export const dissocCalculations = R.dissoc(keys.calculations)
export const assocCalculationUuids = R.assoc(keys.calculationUuids)

export const assocCalculation = calculation =>
  R.assocPath([keys.calculations, ProcessingStepCalculation.getIndex(calculation)], calculation)

export const dissocTemporaryCalculation = processingStep =>
  R.pipe(
    getCalculations,
    // Remove temporary calculation
    R.reject(ProcessingStepCalculation.isTemporary),
    // Update calculation steps in processing step
    calculationSteps => assocCalculations(calculationSteps)(processingStep),
  )(processingStep)

export const dissocCalculation = calculation => processingStep =>
  R.pipe(
    getCalculations,
    // Remove calculation
    R.reject(ProcessingStepCalculation.isEqual(calculation)),
    // Update indexes of next calculations
    R.map(
      R.when(
        calc => ProcessingStepCalculation.getIndex(calc) > ProcessingStepCalculation.getIndex(calculation),
        calc => ProcessingStepCalculation.assocIndex(ProcessingStepCalculation.getIndex(calc) - 1)(calc),
      ),
    ),
    // Update calculation steps in processing step
    calculationSteps => assocCalculations(calculationSteps)(processingStep),
  )(processingStep)

// ====== VALIDATION
export const getValidation = Validation.getValidation
export const hasValidation = Validation.hasValidation
export const assocValidation = Validation.assocValidation
export const dissocValidation = Validation.dissocValidation
