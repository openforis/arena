import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import { nodeDefPropsUpdateTemp, nodeDefPropsTempCancel } from '@webapp/survey/nodeDefs/actions'
import { nodeDefEditUpdate } from './actions'

import * as NodeDefEditState from './nodeDefEditState'

const actionHandlers = {
  // Reset form
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [nodeDefEditUpdate]: (state, { nodeDef, nodeDefValidation }) =>
    NodeDefEditState.assocNodeDefForEdit(nodeDef, nodeDefValidation)(state),

  [nodeDefPropsUpdateTemp]: (state, { nodeDef, nodeDefValidation, props, propsAdvanced }) =>
    NodeDefEditState.assocNodeDefProps(nodeDef, nodeDefValidation, props, propsAdvanced)(state),

  [nodeDefPropsTempCancel]: () => ({}),
}

export default exportReducer(actionHandlers)
