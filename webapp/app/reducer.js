import * as R from 'ramda'

import { assocActionProps, exportReducer } from '../utils/reduxUtils'
import { setUserPref } from '../../common/user/userPrefs'

import * as AppState from './appState'

import {
  appPropsChange,
  appUserLogout,
  appUserPrefUpdate,
  appErrorCreate,
  appErrorDelete,
  appSideBarOpenedUpdate,
  appJobActiveUpdate,
  appJobStart,
  systemErrorThrow,
  appNotificationShow,
  appNotificationHide,
} from './actions'
import { surveyCreate, surveyDelete } from '../survey/actions'

const actionHandlers = {

  [appPropsChange]: (state, { survey, ...props }) => assocActionProps(state, props),

  // ====== user

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

  // ====== sideBar
  [appSideBarOpenedUpdate]: (state, { sideBarOpened }) => AppState.assocSideBarOpened(sideBarOpened)(state),

  // ====== app job
  [appJobStart]: (state, { job, onComplete, autoHide }) => AppState.startJob(job, onComplete, autoHide)(state),

  [appJobActiveUpdate]: (state, { job }) => AppState.updateActiveJob(job)(state),

  // ===== app errors
  [appErrorCreate]: (state, { error }) => AppState.assocAppError(error)(state),

  [appErrorDelete]: (state, { error }) => AppState.dissocAppError(error)(state),

  [systemErrorThrow]: (state, { error }) => AppState.assocSystemError(error)(state),

  // ===== app notification
  [appNotificationShow]: (state, { notification }) => AppState.showNotification(notification)(state),

  [appNotificationHide]: AppState.hideNotification,
}

export default exportReducer(actionHandlers)
