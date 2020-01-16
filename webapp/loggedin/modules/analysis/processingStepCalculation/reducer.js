import * as R from 'ramda'

import { exportReducer } from '@webapp/utils/reduxUtils'

import * as NodeDef from '@core/survey/nodeDef'

import * as ProcessingStepCalculationState from './processingStepCalculationState'

import { processingChainReset, processingChainSave } from '@webapp/loggedin/modules/analysis/processingChain/actions'
import {
  processingStepCalculationUpdate,
  processingStepCalculationCreate,
  processingStepUpdate,
} from '@webapp/loggedin/modules/analysis/processingStep/actions'
import {
  processingStepCalculationDirtyUpdate,
  processingStepCalculationReset,
  processingStepCalculationDelete,
} from './actions'
import { nodeDefSave } from '@webapp/survey/nodeDefs/actions'

const actionHandlers = {
  // Chain
  [processingChainReset]: () => ({}),

  [processingChainSave]: (state, { calculation }) => ProcessingStepCalculationState.saveDirty(calculation)(state),

  // Step
  [processingStepUpdate]: () => ({}),

  [processingStepCalculationUpdate]: (state, { calculation }) =>
    ProcessingStepCalculationState.assocCalculation(calculation)(state),

  [processingStepCalculationCreate]: (state, { calculation }) =>
    ProcessingStepCalculationState.assocCalculation(calculation)(state),

  [processingStepCalculationDirtyUpdate]: (state, { calculation }) =>
    ProcessingStepCalculationState.assocCalculationDirty(calculation)(state),

  [processingStepCalculationDelete]: () => ({}),

  [processingStepCalculationReset]: () => ({}),

  // Update calculation attribute on node def edit cancel / back
  [nodeDefSave]: (state, { nodeDef }) =>
    R.when(
      R.always(NodeDef.isAnalysis(nodeDef)),
      ProcessingStepCalculationState.assocCalculationDirtyNodeDefUuid(NodeDef.getUuid(nodeDef)),
    )(state),
}

export default exportReducer(actionHandlers)
