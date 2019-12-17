import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import { nodeDefPropsUpdateTemp, nodeDefPropsTempCancel } from '@webapp/survey/nodeDefs/actions'
import { nodeDefEditUpdate } from './actions'

import * as NodeDefState from './nodeDefState'

const actionHandlers = {
  // Reset form
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [nodeDefEditUpdate]: (state, { nodeDef, nodeDefValidation }) =>
    NodeDefState.assocNodeDefForEdit(nodeDef, nodeDefValidation)(state),

  [nodeDefPropsUpdateTemp]: (state, { nodeDef, nodeDefValidation, props, propsAdvanced }) =>
    NodeDefState.assocNodeDefProps(nodeDef, nodeDefValidation, props, propsAdvanced)(state),

  [nodeDefPropsTempCancel]: () => ({}),
}

export default exportReducer(actionHandlers)
