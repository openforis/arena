import { exportReducer } from '../../../utils/reduxUtils'

import * as NodeDefEditState from '../nodeDefEdit/nodeDefEditState'

import { appUserLogout } from '../../../app/actions'
import { surveyDelete, surveyUpdate } from '../../../survey/actions'
import { formReset } from '../surveyForm/actions'

import { nodeDefEditUpdate } from '../nodeDefEdit/actions'

const actionHandlers = {
  // reset form
  [appUserLogout]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  [nodeDefEditUpdate]: (state, { nodeDef }) => NodeDefEditState.assocNodeDef(nodeDef)(state),
}

export default exportReducer(actionHandlers)