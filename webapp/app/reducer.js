import * as R from 'ramda'

import { exportReducer, assocActionProps } from '../utils/reduxUtils'

import { startJob, updateActiveJob } from '../loggedin/appJob/appJobState'
import {
  assocAppError,
  assocSystemError,
  assocSurveyAdminGroup,
  dissocAppError,
  dissocSurveyGroups,
  getAppErrors,
  logoutUser
} from './appState'
import { setUserPref } from '../../common/user/userPrefs'

import {
  appStatusChange,
  appUserLogout,
  appUserPrefUpdate,
  appErrorCreate,
  appErrorDelete,
  systemErrorThrow,
} from './actions'
import { loginSuccess } from '../login/actions'

/**
 * ======
 * App Jobs
 * ======
 */
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

  [appUserLogout]: (state) => logoutUser(state),

  [surveyCreate]: (state, { survey: { info } }) => assocSurveyAdminGroup(info)(state),

  [surveyDelete]: (state, { surveyId }) => dissocSurveyGroups(surveyId)(state),

  // ====== app job
  [appJobStart]: (state, { job, onComplete, autoHide }) =>
    startJob(job, onComplete, autoHide)(state),

  [appJobActiveUpdate]: (state, { job }) =>
    updateActiveJob(job)(state),

  // ===== app errors
  [appErrorCreate]: (state, { error }) => R.pipe(
    getAppErrors,
    R.head,
    R.defaultTo({ id: -1 }),
    last => 1 + last.id,
    id => assocAppError({ id, ...error })(state)
  )(state),

  [appErrorDelete]: (state, { error }) => dissocAppError(error)(state),

  [systemErrorThrow]: (state, { error }) => assocSystemError(error)(state),

}

export default exportReducer(actionHandlers)
