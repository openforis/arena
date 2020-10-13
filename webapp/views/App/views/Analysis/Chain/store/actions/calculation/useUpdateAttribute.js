import { useCallback } from 'react'

import * as ChainController from '@common/analysis/chainController'
import * as NodeDef from '@core/survey/nodeDef'
import { useUpdate } from './useUpdate'

import { State } from '../../state'

export const useUpdateAttribute = ({ setState }) => {
  const update = useUpdate({ setState })

  return useCallback(({ attrDef, state }) => {
    const calculation = State.getCalculationEdit(state)
    const { calculation: calculationUpdated } = ChainController.assocCalculationNodeDefUuid({
      calculation,
      nodeDefUuid: NodeDef.getUuid(attrDef),
    })
    return update({ calculationUpdated })
  }, [])
}
