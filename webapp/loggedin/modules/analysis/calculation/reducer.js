import * as R from 'ramda'

import { exportReducer } from '@webapp/utils/reduxUtils'

import * as NodeDef from '@core/survey/nodeDef'

import { nodeDefSave } from '@webapp/survey/nodeDefs/actions'
import { chainReset, chainSave } from '@webapp/loggedin/modules/analysis/chain/actions'
import { calculationUpdate, calculationCreate, stepUpdate } from '@webapp/loggedin/modules/analysis/step/actions'
import { calculationDirtyUpdate, calculationReset, calculationDelete } from './actions'

import * as CalculationState from './state/calculationState'

const actionHandlers = {
  // Chain
  [chainReset]: () => ({}),
  [chainSave]: (state, { calculation }) =>
    R.when(R.always(Boolean(calculation)), CalculationState.saveDirty(calculation))(state),

  // Step
  [stepUpdate]: () => ({}),

  [calculationUpdate]: (state, { calculation }) => CalculationState.assocCalculation(calculation)(state),

  [calculationCreate]: (state, { calculation }) => CalculationState.assocCalculation(calculation)(state),

  [calculationDirtyUpdate]: (state, { calculation }) => CalculationState.assocCalculationDirty(calculation)(state),

  [calculationDelete]: () => ({}),

  [calculationReset]: () => ({}),

  // Update calculation attribute on node def edit cancel / back
  [nodeDefSave]: (state, { nodeDef }) =>
    R.when(
      R.always(NodeDef.isAnalysis(nodeDef) && NodeDef.isAttribute(nodeDef)),
      CalculationState.assocCalculationDirtyNodeDefUuid(NodeDef.getUuid(nodeDef))
    )(state),
}

export default exportReducer(actionHandlers)
