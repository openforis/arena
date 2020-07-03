import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { useSurvey } from '@webapp/store/survey'
import { NotificationActions } from '@webapp/store/ui'

import { State } from '../../state'
import { useUpdateChain } from './useUpdateChain'

export const useUpdateCycles = ({ setState }) => {
  const survey = useSurvey()
  const dispatch = useDispatch()
  const updateChain = useUpdateChain({ setState })

  const nodeDefsBelongToCycles = ({ nodeDefUuids, cycles }) =>
    Survey.getNodeDefsByUuids(nodeDefUuids)(survey).every(NodeDef.belongsToAllCycles(cycles))

  return useCallback(({ cycles, state }) => {
    const steps = Chain.getProcessingSteps(State.getChainEdit(state))
    const allStepEntitiesBelongToCycles = nodeDefsBelongToCycles({
      nodeDefUuids: steps.map(Step.getEntityUuid),
      cycles,
    })
    const allStepCalculationAttriutesBelongToCycles = nodeDefsBelongToCycles({
      nodeDefUuids: steps.flatMap((step) => Step.getCalculations(step).map(Calculation.getNodeDefUuid)),
      cycles,
    })

    if (allStepEntitiesBelongToCycles && allStepCalculationAttriutesBelongToCycles) {
      updateChain({ name: Chain.keysProps.cycles, value: cycles, state })
    } else {
      dispatch(NotificationActions.notifyError({ key: 'processingChainView.cannotSelectCycle' }))
    }
  }, [])
}
