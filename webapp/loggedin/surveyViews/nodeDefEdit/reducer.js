import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import { formReset } from '../surveyForm/actions'

import * as NodeDefEditState from './nodeDefEditState'

import { nodeDefEditUpdate } from './actions'

const actionHandlers = {
  // Reset form
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  [nodeDefEditUpdate]: (state, { nodeDefUuid }) => NodeDefEditState.assocNodeDef(nodeDefUuid)(state),
}

export default exportReducer(actionHandlers)
