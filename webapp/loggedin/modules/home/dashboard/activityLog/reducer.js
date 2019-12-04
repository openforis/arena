import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import {
  homeActivityMessagesReset,
  homeActivityMessagesUpdate,
} from '@webapp/loggedin/modules/home/dashboard/activityLog/actions'

const actionHandlers = {
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [homeActivityMessagesUpdate]: (state, { activityLogMessages }) => activityLogMessages,
  [homeActivityMessagesReset]: () => ({}),
}

export default exportReducer(actionHandlers)
