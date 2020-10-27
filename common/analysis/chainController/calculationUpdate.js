import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'

import * as Calculation from '@common/analysis/processingStepCalculation'

export const assocIndex = ({ calculation, index }) => ({
  calculation: ObjectUtils.assocIndex(index)(calculation),
})

const _assocNodeDefUuid = A.assoc(Calculation.keys.nodeDefUuid)

export const assocNodeDefUuid = ({ calculation, nodeDefUuid }) => ({
  calculation: _assocNodeDefUuid(nodeDefUuid, calculation),
})

const _resetNodeDefWhenTypeChanges = ({ prop }) => (calculation) =>
  prop === Calculation.keysProps.type ? _assocNodeDefUuid(null)(calculation) : calculation

const _resetAggregateFunctionWhenTypeChangesToCategorical = ({ prop, value }) => (calculation) =>
  prop === Calculation.keysProps.type && value === Calculation.type.categorical
    ? ObjectUtils.setProp(Calculation.keysProps.aggregateFn, null)(calculation)
    : calculation

export const assocProp = ({ calculation, prop, value }) =>
  A.pipe(
    ObjectUtils.setProp(prop, value),
    _resetNodeDefWhenTypeChanges({ prop }),
    _resetAggregateFunctionWhenTypeChangesToCategorical({ prop, value }),
    (calculationUpdated) => ({ calculation: calculationUpdated })
  )(calculation)
