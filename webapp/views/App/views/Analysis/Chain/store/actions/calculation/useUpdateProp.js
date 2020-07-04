import { useCallback } from 'react'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { useUpdate } from './useUpdate'

import { State } from '../../state'

const resetNodeDefIfPropIsType = ({ prop }) => (calculation) =>
  prop === Calculation.keysProps.type ? Calculation.assocNodeDefUuid(null)(calculation) : calculation

const resetAggregateFunctionIfPropIsTypeAndTypeIsCategorical = ({ prop, value }) => (calculation) =>
  prop === Calculation.keysProps.type && value === Calculation.type.categorical
    ? Calculation.assocProp(Calculation.keysProps.aggregateFn, null)(calculation)
    : calculation

export const useUpdateProp = ({ setState }) => {
  const update = useUpdate({ setState })

  return useCallback(({ prop, value, state }) => {
    const calculationEdit = State.getCalculationEdit(state)
    let calculationUpdated = Calculation.assocProp(prop, value)(calculationEdit)
    calculationUpdated = resetNodeDefIfPropIsType({ prop })(calculationUpdated)
    calculationUpdated = resetAggregateFunctionIfPropIsTypeAndTypeIsCategorical({
      prop,
      value,
    })(calculationUpdated)

    update({ calculationUpdated, state })
  }, [])
}
