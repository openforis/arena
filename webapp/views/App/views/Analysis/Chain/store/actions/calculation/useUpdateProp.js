import { useCallback } from 'react'

import * as ChainController from '@common/analysis/chainController'

import { useUpdate } from './useUpdate'

import { State } from '../../state'

export const useUpdateProp = ({ setState }) => {
  const update = useUpdate({ setState })

  return useCallback(({ prop, value, state }) => {
    const calculation = State.getCalculationEdit(state)
    const { calculation: calculationUpdated } = ChainController.assocCalculationProp({ calculation, prop, value })

    update({ calculationUpdated, state })
  }, [])
}
