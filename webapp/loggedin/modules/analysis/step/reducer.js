import * as R from 'ramda'
import { exportReducer } from '@webapp/utils/reduxUtils'

import * as NodeDef from '@core/survey/nodeDef'
import * as StepState from '@webapp/loggedin/modules/analysis/step/state'

import { UserActions } from '@webapp/store/user'
import { SurveyActions, NodeDefsActions } from '@webapp/store/survey'

import { chainReset, chainSave } from '@webapp/loggedin/modules/analysis/chain/actions'
import {
  stepReset,
  stepCreate,
  stepUpdate,
  stepPropsUpdate,
  stepDelete,
  calculationCreate,
  calculationIndexUpdate,
} from '@webapp/loggedin/modules/analysis/step/actions'
import {
  calculationDelete,
  calculationDirtyUpdate,
  calculationReset,
} from '@webapp/loggedin/modules/analysis/calculation/actions'

const actionHandlers = {
  // Reset state
  [UserActions.APP_USER_LOGOUT]: () => ({}),
  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  // Chain
  [chainReset]: () => ({}),
  [chainSave]: (state, { step, calculation }) =>
    R.when(R.always(Boolean(step)), StepState.saveDirty(step, calculation))(state),

  // Step
  [stepReset]: () => ({}),

  [stepCreate]: (state, { processingStep }) => StepState.assocProcessingStep(processingStep)(state),

  [stepUpdate]: (state, { processingStep }) => StepState.assocProcessingStep(processingStep)(state),

  [stepPropsUpdate]: (state, { props }) => StepState.updateProps(props)(state),

  [stepDelete]: () => ({}),

  // Calculations
  [calculationCreate]: (state, { calculation }) => StepState.assocCalculation(calculation)(state),

  [calculationDirtyUpdate]: (state, { calculation }) => StepState.assocCalculation(calculation)(state),

  [calculationIndexUpdate]: (state, { indexFrom, indexTo }) =>
    StepState.updateCalculationIndex(indexFrom, indexTo)(state),

  [calculationDelete]: (state, { calculation }) => StepState.dissocCalculation(calculation)(state),

  [calculationReset]: (state, { calculation }) => StepState.dissocTemporaryCalculation(calculation)(state),

  // NodeDef (Virtual Entity)
  [NodeDefsActions.nodeDefSave]: (state, { nodeDef }) =>
    R.when(R.always(NodeDef.isVirtual(nodeDef)), StepState.updateEntityUuid(NodeDef.getUuid(nodeDef)))(state),
}

export default exportReducer(actionHandlers)
