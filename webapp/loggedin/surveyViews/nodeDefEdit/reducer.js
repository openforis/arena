import { exportReducer } from '../../../utils/reduxUtils'

import * as NodeDefEditState from '../nodeDefEdit/nodeDefEditState'

import { appUserLogout } from '../../../app/actions'
import { surveyDelete, surveyUpdate } from '../../../survey/actions'
import { formReset } from '../surveyForm/actions'

import { formNodeDefEditUpdate } from '../nodeDefEdit/actions'

const actionHandlers = {
  // reset form
  [appUserLogout]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  [formNodeDefEditUpdate]: (state, { nodeDef }) => NodeDefEditState.assocNodeDefEdit(nodeDef)(state),
}

export default exportReducer(actionHandlers)