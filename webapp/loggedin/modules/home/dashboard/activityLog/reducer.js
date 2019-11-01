import { exportReducer } from '@webapp/utils/reduxUtils'
import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import {
  homeActivityLogsUpdate,
  homeActivityLogsReset,
} from '@webapp/loggedin/modules/home/dashboard/activityLog/actions'

const actionHandlers = {
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [homeActivityLogsUpdate]: (state, { activityLogs }) => activityLogs,
  [homeActivityLogsReset]: () => ([]),
}

export default exportReducer(actionHandlers)