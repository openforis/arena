import { assocActionProps, exportReducer } from '../utils/reduxUtils'

import {
  appPropsChange,
  appUserLogout,
  appErrorCreate,
  appErrorDelete,
  appSideBarOpenedUpdate,
  appJobActiveUpdate,
  appJobStart,
  systemErrorThrow,
  appNotificationShow,
  appNotificationHide,
  appSavingUpdate,
} from './actions'

import { surveyCreate, surveyDelete, surveyUpdate } from '../survey/actions'

import * as AppState from './appState'

interface IProps {
  survey: any;
  type: any;
  [s: string]: any;
}

const actionHandlers = {

  [appPropsChange]: (state, { survey, ...props }: IProps ) => assocActionProps(state, props),

  // ====== user

  [appUserLogout]: (state) => AppState.logoutUser(state),

  [surveyCreate]: (state, { survey }) => AppState.assocUserPropsOnSurveyCreate(survey)(state),

  [surveyUpdate]: (state, { survey }) => AppState.assocUserPropsOnSurveyUpdate(survey)(state),

  [surveyDelete]: (state, { surveyInfo }) => AppState.dissocUserPropsOnSurveyDelete(surveyInfo)(state),

  // ====== saving
  [appSavingUpdate]: (state, { saving }) => AppState.assocSaving(saving)(state),

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
