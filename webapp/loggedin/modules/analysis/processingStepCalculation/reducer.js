import * as R from 'ramda'

import { exportReducer } from '@webapp/utils/reduxUtils'

import * as NodeDef from '@core/survey/nodeDef'

import * as ProcessingStepCalculationState from './processingStepCalculationState'

import {
  processingStepCalculationForEditUpdate,
  processingStepCalculationCreate,
  processingStepCalculationEditCancel,
} from '../processingStep/actions'
import { processingStepCalculationDirtyUpdate } from './actions'
import { nodeDefPropsUpdateCancel } from '@webapp/survey/nodeDefs/actions'

const actionHandlers = {
  [processingStepCalculationForEditUpdate]: (state, { calculation }) =>
    ProcessingStepCalculationState.assocCalculationForEdit(calculation)(state),

  [processingStepCalculationCreate]: (state, { calculation }) =>
    ProcessingStepCalculationState.assocCalculationForEdit(calculation)(state),

  [processingStepCalculationDirtyUpdate]: (state, { calculation }) =>
    ProcessingStepCalculationState.assocCalculationDirty(calculation)(state),

  [processingStepCalculationEditCancel]: () => ({}),

  // Update calculation attribute on node def edit cancel / back
  [nodeDefPropsUpdateCancel]: (state, { nodeDef }) =>
    R.when(
      R.always(NodeDef.isAnalysis(nodeDef)),
      ProcessingStepCalculationState.assocCalculationDirtyNodeDefUuid(NodeDef.getUuid(nodeDef)),
    )(state),
}

export default exportReducer(actionHandlers)
