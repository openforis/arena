import { exportReducer } from '@webapp/utils/reduxUtils'

import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import { nodeDefSave } from '@webapp/survey/nodeDefs/actions'

import { chainReset, chainSave } from '@webapp/loggedin/modules/analysis/chain/actions'
import {
  processingStepReset,
  processingStepCreate,
  processingStepUpdate,
  processingStepPropsUpdate,
  processingStepDelete,
  processingStepDataLoad,
  processingStepCalculationCreate,
  processingStepCalculationIndexUpdate,
} from '@webapp/loggedin/modules/analysis/processingStep/actions'
import {
  processingStepCalculationDelete,
  processingStepCalculationReset,
} from '@webapp/loggedin/modules/analysis/processingStepCalculation/actions'

const actionHandlers = {
  // Reset state
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  // Chain
  [chainReset]: () => ({}),
  [chainSave]: (state, { step, calculation }) =>
    R.when(R.always(Boolean(step)), ProcessingStepState.saveDirty(step, calculation))(state),

  // Step
  [processingStepReset]: () => ({}),

  [processingStepCreate]: (state, { processingStep }) => ProcessingStepState.assocProcessingStep(processingStep)(state),

  [processingStepUpdate]: (state, { processingStep }) => ProcessingStepState.assocProcessingStep(processingStep)(state),

  [processingStepPropsUpdate]: (state, { props }) => ProcessingStepState.mergeProcessingStepProps(props)(state),

  [processingStepDelete]: () => ({}),

  [processingStepDataLoad]: (state, { calculations, stepPrevAttributeUuids }) =>
    ProcessingStepState.assocStepData(calculations, stepPrevAttributeUuids)(state),

  // Calculations
  [processingStepCalculationCreate]: (state, { calculation }) =>
    ProcessingStepState.assocCalculation(calculation)(state),

  [processingStepCalculationIndexUpdate]: (state, { indexFrom, indexTo }) =>
    ProcessingStepState.updateCalculationIndex(indexFrom, indexTo)(state),

  [processingStepCalculationDelete]: (state, { calculation }) =>
    ProcessingStepState.dissocCalculation(calculation)(state),

  [processingStepCalculationReset]: (state) => ProcessingStepState.dissocTemporaryCalculation(state),

  // NodeDef (Virtual Entity)
  [nodeDefSave]: (state, { nodeDef }) =>
    R.when(R.always(NodeDef.isVirtual(nodeDef)), ProcessingStepState.updateEntityUuid(NodeDef.getUuid(nodeDef)))(state),
}

export default exportReducer(actionHandlers)
