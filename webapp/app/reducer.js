import * as R from 'ramda'

import { exportReducer, assocActionProps } from '../utils/reduxUtils'

import { setUserPref } from '../../common/user/userPrefs'

import * as AppJobState from '../loggedin/appJob/appJobState'
import * as AppState from './appState'

import {
  appStatusChange,
  appUserLogout,
  appUserPrefUpdate,
  appErrorCreate,
  appErrorDelete,
  systemErrorThrow,
} from './actions'
import { loginSuccess } from '../login/actions'
import { appJobStart, appJobActiveUpdate } from '../loggedin/appJob/actions'
import { surveyCreate, surveyDelete } from '../survey/actions'

const actionHandlers = {

  [appStatusChange]: (state, { survey, ...props }) => assocActionProps(state, props),

  // ====== user
  // user and current survey are properties of app state
  [loginSuccess]: (state, { survey, ...props }) => assocActionProps(state, props),

  [appUserPrefUpdate]: (state, { name, value }) => {
    const user = R.pipe(
      R.prop('user'),
      setUserPref(name, value)
    )(state)

    return assocActionProps(state, { user })
  },

  [appUserLogout]: (state) => AppState.logoutUser(state),

  [surveyCreate]: (state, { survey: { info } }) => AppState.assocSurveyAdminGroup(info)(state),

  [surveyDelete]: (state, { surveyId }) => AppState.dissocSurveyGroups(surveyId)(state),

  // ====== app job
  [appJobStart]: (state, { job, onComplete, autoHide }) => AppJobState.startJob(job, onComplete, autoHide)(state),

  [appJobActiveUpdate]: (state, { job }) => AppJobState.updateActiveJob(job)(state),

  // ===== app errors
  [appErrorCreate]: (state, { error }) => AppState.assocAppError(error)(state),

  [appErrorDelete]: (state, { error }) => AppState.dissocAppError(error)(state),

  [systemErrorThrow]: (state, { error }) => AppState.assocSystemError(error)(state),

}

export default exportReducer(actionHandlers)
