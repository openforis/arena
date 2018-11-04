import * as R from 'ramda'

import { exportReducer, assocActionProps, dissocStateProps } from '../appUtils/reduxUtils'

import { appState } from './app'

import { startJob, updateActiveJob } from './components/job/appJobState'
import { assocAppError, dissocAppError, getAppErrors } from './appState'
import { setUserPref } from '../../common/user/userPrefs'

import {
  appStatusChange,
  appUserLogout,
  appUserPrefUpdate,
  appErrorCreate,
  appErrorDelete,
} from './actions'
import { loginSuccess } from '../login/actions'

/**
 * ======
 * App Jobs
 * ======
 */
import { appJobStart, appJobActiveUpdate } from './components/job/actions'

const actionHandlers = {

  [appStatusChange]: (state, {survey, ...props}) => assocActionProps(state, props),

  // user and current survey are properties of app state
  [loginSuccess]: (state, {survey, ...props}) => assocActionProps(state, props),

  [appUserPrefUpdate]: (state, {name, value}) => {
    const user = R.pipe(
      R.prop('user'),
      setUserPref(name, value)
    )(state)

    return assocActionProps(state, {user})
  },

  [appUserLogout]: (state, action) => appState.logoutUser(state),

  //app job
  [appJobStart]: (state, {job, onComplete, autoHide}) =>
    startJob(job, onComplete, autoHide)(state),

  [appJobActiveUpdate]: (state, {job}) =>
    updateActiveJob(job)(state),

  // ===== app errors
  [appErrorCreate]: (state, {error}) => R.pipe(
    getAppErrors,
    R.head,
    R.defaultTo({id: -1}),
    last => 1 + last.id,
    id => assocAppError({id, ...error})(state)
  )(state),

  [appErrorDelete]: (state, {error}) => dissocAppError(error)(state),
}

export default exportReducer(actionHandlers)
