import * as R from 'ramda'

import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import {
  homeActivityMessagesReset,
  homeActivityMessagesUpdate,
} from '@webapp/loggedin/modules/home/dashboard/activityLog/actions'
import * as ActivityLogState from './activityLogState'

const actionHandlers = {
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [homeActivityMessagesUpdate]: (state, { activityLogMessages, loadComplete }) =>
    R.pipe(
      ActivityLogState.assocInitialized,
      ActivityLogState.assocMessages(activityLogMessages),
      R.when(R.always(loadComplete), ActivityLogState.assocLoadComplete(loadComplete))
    )(state),

  [homeActivityMessagesReset]: () => ({}),
}

export default exportReducer(actionHandlers)
