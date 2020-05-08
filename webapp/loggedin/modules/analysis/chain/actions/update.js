import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'

import * as NotificationState from '@webapp/app/appNotification/appNotificationState'
import * as SurveyState from '@webapp/survey/surveyState'

import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'

import { showNotification } from '@webapp/app/appNotification/actions'
import { validateChain } from './validation'

export const chainPropUpdate = 'analysis/chain/prop/update'

const _onChainPropUpdate = (key, value) => async (dispatch) => {
  await dispatch({ type: chainPropUpdate, key, value })
  dispatch(validateChain())
}

export const updateChainProp = (key, value) => (dispatch) => dispatch(_onChainPropUpdate(key, value))

export const updateChainCycles = (cycles) => (dispatch, getState) => {
  const state = getState()

  const survey = SurveyState.getSurvey(state)
  const processingChain = ChainState.getProcessingChain(state)

  // Check that all step entity defs belong to the specified cycles
  const steps = Chain.getProcessingSteps(processingChain)
  const allStepEntitiesBelongToCycles = R.all(
    R.pipe(
      Step.getEntityUuid,
      (nodeDefUuid) => Survey.getNodeDefByUuid(nodeDefUuid)(survey),
      NodeDef.belongsToAllCycles(cycles)
    )
  )(steps)

  let allStepCalculationAttriutesBelongToCycles = false
  if (allStepEntitiesBelongToCycles) {
    // Check that all step calculation attribute defs belong to the specified cycles
    allStepCalculationAttriutesBelongToCycles = R.pipe(
      Chain.getCalculationAttributeUuids,
      R.all(R.pipe((nodeDefUuid) => Survey.getNodeDefByUuid(nodeDefUuid)(survey), NodeDef.belongsToAllCycles(cycles)))
    )(processingChain)
  }

  if (allStepEntitiesBelongToCycles && allStepCalculationAttriutesBelongToCycles) {
    dispatch(_onChainPropUpdate(Chain.keysProps.cycles, cycles))
  } else {
    dispatch(showNotification('processingChainView.cannotSelectCycle', {}, NotificationState.severity.error))
  }
}
