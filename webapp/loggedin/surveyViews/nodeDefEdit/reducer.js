import { exportReducer } from '@webapp/utils/reduxUtils'

import * as NodeDefEditState from '../nodeDefEdit/nodeDefEditState'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import { formReset } from '../surveyForm/actions'

import { nodeDefEditUpdate } from '../nodeDefEdit/actions'
import { nodeDefCreate } from '@webapp/survey/nodeDefs/actions'

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