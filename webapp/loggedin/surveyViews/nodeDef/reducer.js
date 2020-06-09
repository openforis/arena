import { exportReducer } from '@webapp/utils/reduxUtils'

import { UserActions } from '@webapp/store/user'
import { SurveyActions, NodeDefsActions } from '@webapp/store/survey'
import { nodeDefEditUpdate } from './actions'

import * as NodeDefState from './nodeDefState'

const actionHandlers = {
  // Reset form
  [UserActions.USER_LOGOUT]: () => ({}),
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
