import { exportReducer } from '../../../utils/reduxUtils'

import * as NodeDefEditState from '../nodeDefEdit/nodeDefEditState'

import { appUserLogout } from '../../../app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '../../../survey/actions'
import { formReset } from '../surveyForm/actions'

import { nodeDefEditUpdate } from '../nodeDefEdit/actions'
import { nodeDefCreate } from '../../../survey/nodeDefs/actions'

const actionHandlers = {
  // reset form
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  [nodeDefEditUpdate]: (state, { nodeDef }) => NodeDefEditState.assocNodeDef(nodeDef)(state),

  [nodeDefCreate]: (state, { nodeDef }) => NodeDefEditState.assocNodeDef(nodeDef)(state),
}

export default exportReducer(actionHandlers)