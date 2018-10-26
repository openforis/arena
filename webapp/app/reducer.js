import * as R from 'ramda'

import { exportReducer, assocActionProps } from '../appUtils/reduxUtils'

import { setUserPref } from '../../common/user/userPrefs'

import {
  appStatusChange,
  appUserLogout,
  appUserPrefUpdate,
  appNewSurveyUpdate,
  appSurveysUpdate,
} from './actions'

import { loginSuccess } from '../login/actions'
import { appState } from './app'

/**
 * ======
 * App Jobs
 * ======
 */
import { appJobActiveUpdate } from './components/job/actions'

import { updateActiveJob } from './components/job/appJobState'

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
}

export default exportReducer(actionHandlers)
