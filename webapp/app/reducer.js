import * as R from 'ramda'

import { exportReducer, assocActionProps } from '../appUtils/reduxUtils'

import { appState } from './app'

import { updateActiveJob } from './components/job/appJobState'
import { assocAppError, dissocAppError, getAppErrors } from './appState'
import { setUserPref } from '../../common/user/userPrefs'

import {
  appStatusChange,
  appUserLogout,
  appUserPrefUpdate,
  appNewSurveyUpdate,
  appSurveysUpdate,
  appErrorCreate,
  appErrorDelete,
} from './actions'
import { loginSuccess } from '../login/actions'

/**
 * ======
 * App Jobs
 * ======
 */
import { appJobActiveUpdate } from './components/job/actions'

const actionHandlers = {

  [appStatusChange]: assocActionProps,

  // user and current survey are properties of app state
  [loginSuccess]: assocActionProps,

  [appUserPrefUpdate]: (state, {name, value}) => {
    const user = R.pipe(
      R.prop('user'),
      setUserPref(name, value)
    )(state)

    return assocActionProps(state, {user})
  },

  [appUserLogout]: (state, action) => appState.logoutUser(state),

  // new survey
  [appNewSurveyUpdate]: assocActionProps,

  //surveys list
  [appSurveysUpdate]: assocActionProps,

  //app job
  [appJobActiveUpdate]: (state, {job, hideAutomatically}) => updateActiveJob(job, hideAutomatically)(state),

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
