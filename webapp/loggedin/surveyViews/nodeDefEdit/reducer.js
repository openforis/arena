import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'

import * as NodeDefEditState from './nodeDefEditState'

import { nodeDefUuidEditUpdate } from './actions'

const actionHandlers = {
  // Reset form
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [nodeDefUuidEditUpdate]: (state, { nodeDefUuid }) => NodeDefEditState.assocNodeDefUuid(nodeDefUuid)(state),
}

export default exportReducer(actionHandlers)
