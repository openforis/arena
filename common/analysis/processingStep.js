import * as R from 'ramda'

import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  calculations: 'calculations',
  calculationUuids: 'calculationUuids', // Associated only when processing step is saved
  calculationsCount: 'calculationsCount',
  index: ObjectUtils.keys.index,
  stepPrevAttributeUuids: 'stepPrevAttributeUuids',
  processingChainUuid: 'processingChainUuid',
  props: ObjectUtils.keys.props,
  temporary: ObjectUtils.keys.temporary,
  uuid: ObjectUtils.keys.uuid,
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
/**
 * Returns the uuids of all associated calculations.
 * Note: calculationUuids has a value only when calculation step is passed as parameter to the API
 */
export const getCalculationUuids = R.propOr([], keys.calculationUuids)

export const getStepPrevAttributeUuids = R.propOr([], keys.stepPrevAttributeUuids)

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
export const assocStepPrevAttributeUuids = R.assoc(keys.stepPrevAttributeUuids)

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
