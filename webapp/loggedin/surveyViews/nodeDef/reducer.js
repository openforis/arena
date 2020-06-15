import { exportReducer } from '@webapp/utils/reduxUtils'

import { SystemActions } from '@webapp/store/system'
import { SurveyActions, NodeDefsActions } from '@webapp/store/survey'
import { nodeDefEditUpdate } from './actions'

import * as NodeDefState from './nodeDefState'

const actionHandlers = {
  // Reset form
  [SystemActions.SYSTEM_RESET]: () => ({}),
  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [nodeDefEditUpdate]: (state, { nodeDef, nodeDefValidation }) =>
    NodeDefState.assocNodeDefForEdit(nodeDef, nodeDefValidation)(state),

  [NodeDefsActions.nodeDefSave]: (state, { nodeDef, nodeDefValidation }) =>
    NodeDefState.assocNodeDefForEdit(nodeDef, nodeDefValidation)(state),

  [NodeDefsActions.nodeDefPropsUpdate]: (state, { nodeDef, nodeDefValidation, props, propsAdvanced }) =>
    NodeDefState.assocNodeDefProps(nodeDef, nodeDefValidation, props, propsAdvanced)(state),

  [NodeDefsActions.nodeDefPropsUpdateCancel]: () => ({}),
}

export default exportReducer(actionHandlers)
