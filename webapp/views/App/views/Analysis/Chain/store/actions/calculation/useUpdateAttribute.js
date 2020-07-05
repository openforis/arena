import { useCallback } from 'react'
import * as Calculation from '@common/analysis/processingStepCalculation'
import * as NodeDef from '@core/survey/nodeDef'
import { useUpdate } from './useUpdate'

import { State } from '../../state'

export const useUpdateAttribute = ({ setState }) => {
  const update = useUpdate({ setState })

  return useCallback(({ attrDef, state }) => {
    const calculationEdit = State.getCalculationEdit(state)
    const calculationUpdated = Calculation.assocNodeDefUuid(NodeDef.getUuid(attrDef))(calculationEdit)
    update({ calculationUpdated, state })
  }, [])
}
