import * as R from 'ramda'

import * as Calculation from '@common/analysis/processingStepCalculation'
import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  calculations: 'calculations',
  calculationUuids: 'calculationUuids', // Associated only when processing step is saved
  calculationsCount: 'calculationsCount',
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
}

// ====== READ

export const getProcessingChainUuid = R.prop(keys.processingChainUuid)
export const getCalculations = R.propOr([], keys.calculations)
export const getCalculationsCount = R.pipe(R.propOr(0, keys.calculationsCount), Number)
export const getEntityUuid = ObjectUtils.getProp(keysProps.entityUuid)
export const getCategoryUuid = ObjectUtils.getProp(keysProps.categoryUuid)
export const isVirtual = ObjectUtils.getProp(keysProps.virtual, false)
export const { getIndex, getUuid, getProps, getPropsDiff } = ObjectUtils
/**
 * Returns the uuids of all associated calculations.
 * Note: calculationUuids has a value only when calculation step is passed as parameter to the API.
 */
export const getCalculationUuids = R.propOr([], keys.calculationUuids)

export const { isEqual, isTemporary } = ObjectUtils

// ====== UPDATE

export const { mergeProps } = ObjectUtils

export const assocCalculationUuids = R.assoc(keys.calculationUuids)
export const assocCalculations = (calculations) => {
  const calculationUuids = R.pluck(Calculation.keys.uuid)(calculations)
  return R.pipe(R.assoc(keys.calculations, calculations), assocCalculationUuids(calculationUuids))
}

const assocCalculationsCount = R.assoc(keys.calculationsCount)

const _updateCalculationsCount = (calculationStep) =>
  R.pipe(getCalculations, R.length, (calculationsCount) => assocCalculationsCount(calculationsCount)(calculationStep))(
    calculationStep
  )

export const assocCalculation = (calculation) =>
  R.pipe(R.assocPath([keys.calculations, Calculation.getIndex(calculation)], calculation), _updateCalculationsCount)

const _updateCalculations = (fn) => (processingStep) =>
  R.pipe(
    getCalculations,
    fn,
    (calculations) => assocCalculations(calculations)(processingStep),
    _updateCalculationsCount
  )(processingStep)

export const dissocCalculations = R.dissoc(keys.calculations)

export const dissocCalculation = (calculation) =>
  _updateCalculations(
    R.pipe(
      // Remove calculation
      R.reject(Calculation.isEqual(calculation)),
      // Update indexes of next calculations
      R.map(
        R.when(
          (calc) => Calculation.getIndex(calc) > Calculation.getIndex(calculation),
          (calc) => Calculation.assocIndex(Calculation.getIndex(calc) - 1)(calc)
        )
      )
    )
  )

// ===== UTILS

export const hasEntity = R.pipe(getEntityUuid, R.isNil, R.not)
export const hasCategory = R.pipe(getCategoryUuid, R.isNil, R.not)
