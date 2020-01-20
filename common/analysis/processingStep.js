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

export const assocCalculations = R.assoc(keys.calculations)
export const dissocCalculations = R.dissoc(keys.calculations)
export const assocCalculationUuids = R.assoc(keys.calculationUuids)
const assocCalculationsCount = R.assoc(keys.calculationsCount)

const _updateCalculationsCount = calculationStep =>
  R.pipe(getCalculations, R.length, calculationsCount => assocCalculationsCount(calculationsCount)(calculationStep))(
    calculationStep,
  )

export const assocCalculation = calculation =>
  R.pipe(
    R.assocPath([keys.calculations, ProcessingStepCalculation.getIndex(calculation)], calculation),
    _updateCalculationsCount,
  )

const _updateCalculations = fn => processingStep =>
  R.pipe(
    getCalculations,
    fn,
    calculations => assocCalculations(calculations)(processingStep),
    _updateCalculationsCount,
  )(processingStep)

export const dissocTemporaryCalculation = _updateCalculations(
  // Remove temporary calculation
  R.reject(ProcessingStepCalculation.isTemporary),
)

export const dissocCalculation = calculation =>
  _updateCalculations(
    R.pipe(
      // Remove calculation
      R.reject(ProcessingStepCalculation.isEqual(calculation)),
      // Update indexes of next calculations
      R.map(
        R.when(
          calc => ProcessingStepCalculation.getIndex(calc) > ProcessingStepCalculation.getIndex(calculation),
          calc => ProcessingStepCalculation.assocIndex(ProcessingStepCalculation.getIndex(calc) - 1)(calc),
        ),
      ),
    ),
  )

// ====== VALIDATION
export const getValidation = Validation.getValidation
export const hasValidation = Validation.hasValidation
export const assocValidation = Validation.assocValidation
export const dissocValidation = Validation.dissocValidation
