import * as R from 'ramda'

import { exportReducer } from '@webapp/utils/reduxUtils'

import { SurveyActions } from '@webapp/store/survey'
import {
  homeActivityMessagesReset,
  homeActivityMessagesUpdate,
} from '@webapp/loggedin/modules/home/dashboard/activityLog/actions'
import * as ActivityLogState from './activityLogState'
import { SystemActions } from '@webapp/store/system'

const actionHandlers = {
  [SystemActions.SYSTEM_RESET]: () => ({}),
  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [homeActivityMessagesUpdate]: (state, { messages, loadComplete }) =>
    R.pipe(
      ActivityLogState.assocInitialized,
      ActivityLogState.assocMessages(messages),
      R.when(R.always(loadComplete), ActivityLogState.assocLoadComplete(loadComplete))
    )(state),

  [homeActivityMessagesReset]: () => ({}),
}

export default exportReducer(actionHandlers)
