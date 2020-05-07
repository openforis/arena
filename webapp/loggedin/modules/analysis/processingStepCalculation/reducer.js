import * as R from 'ramda'

import { exportReducer } from '@webapp/utils/reduxUtils'

import * as NodeDef from '@core/survey/nodeDef'

import { nodeDefSave } from '@webapp/survey/nodeDefs/actions'
import { chainReset, chainSave } from '@webapp/loggedin/modules/analysis/chain/actions'
import { calculationUpdate, calculationCreate, stepUpdate } from '@webapp/loggedin/modules/analysis/step/actions'
import {
  processingStepCalculationDirtyUpdate,
  processingStepCalculationReset,
  processingStepCalculationDelete,
} from './actions'

import * as ProcessingStepCalculationState from './processingStepCalculationState'

const actionHandlers = {
  // Chain
  [chainReset]: () => ({}),
  [chainSave]: (state, { calculation }) =>
    R.when(R.always(Boolean(calculation)), ProcessingStepCalculationState.saveDirty(calculation))(state),

  // Step
  [stepUpdate]: () => ({}),

  [calculationUpdate]: (state, { calculation }) => ProcessingStepCalculationState.assocCalculation(calculation)(state),

  [calculationCreate]: (state, { calculation }) => ProcessingStepCalculationState.assocCalculation(calculation)(state),

  [processingStepCalculationDirtyUpdate]: (state, { calculation }) =>
    ProcessingStepCalculationState.assocCalculationDirty(calculation)(state),

  [processingStepCalculationDelete]: () => ({}),

  [processingStepCalculationReset]: () => ({}),

  // Update calculation attribute on node def edit cancel / back
  [nodeDefSave]: (state, { nodeDef }) =>
    R.when(
      R.always(NodeDef.isAnalysis(nodeDef) && NodeDef.isAttribute(nodeDef)),
      ProcessingStepCalculationState.assocCalculationDirtyNodeDefUuid(NodeDef.getUuid(nodeDef))
    )(state),
}

export default exportReducer(actionHandlers)
