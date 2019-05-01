import * as R from 'ramda'

import { isSystemAdmin } from '../../common/auth/authManager'

import Survey from '../../common/survey/survey'
import User from '../../common/user/user'

const keys = {
  status: 'status',
  user: 'user',
  activeJob: 'activeJob',
  errors: 'errors',
  systemError: 'systemError',

  // activeJob keys
  onComplete: 'onComplete',
}

export const getState = R.prop('app')

export const appStatus = {
  ready: 'ready'
}

export const isReady = R.pipe(getState, R.propEq(keys.status, appStatus.ready))

// ==== APP USER

export const getUser = R.pipe(getState, R.prop(keys.user))

export const logoutUser = R.dissoc(keys.user)

// On survey create, add current user to new survey's surveyAdmin group

export const assocSurveyAdminGroup = surveyInfo =>
  appState => {
    const user = R.prop(keys.user, appState)

    if (isSystemAdmin(user)) {
      return appState
    } else {

      const userGroups = R.pipe(
        R.prop(User.keys.authGroups),
        R.append(Survey.getSurveyAdminGroup(surveyInfo))
      )(user)

      return R.assocPath([keys.user, User.keys.authGroups], userGroups, appState)
    }
  }

// On survey delete, diccos survey from user
export const dissocSurveyGroups = surveyId =>
  appState => {
    const user = R.prop(keys.user, appState)
    // removing survey auth groups from user group
    const userGroups = R.reject(
      g => g.surveyId === surveyId,
      R.prop(User.keys.authGroups, user)
    )

    return R.assocPath([keys.user, User.keys.authGroups], userGroups, appState)
  }

// ==== APP CURRENT ACTIVE JOB

export const getActiveJob = R.pipe(getState, R.propOr(null, keys.activeJob))

export const startJob = (job, onComplete = null, autoHide = false) =>
  R.assoc(
    keys.activeJob,
    { ...job, onComplete, autoHide }
  )

export const updateActiveJob = job =>
  state => job
    ? R.assoc(
      keys.activeJob,
      R.mergeRight(R.prop(keys.activeJob)(state), job)
    )(state)
    : R.dissoc(keys.activeJob)(state)

export const getActiveJobOnCompleteCallback = R.propOr(null, keys.onComplete)

// ==== APP ERRORS

const _getAppErrors = R.pipe(
  R.prop(keys.errors),
  R.values,
  R.sort((a, b) => +b.id - +a.id)
)

export const getAppErrors = R.pipe(getState, _getAppErrors)

export const assocAppError = error => state => R.pipe(
  _getAppErrors,
  R.head,
  R.defaultTo({ id: -1 }),
  last => 1 + last.id,
  id => R.assocPath([keys.errors, id + ''], { id, ...error })(state)
)(state)

export const dissocAppError = error => R.dissocPath([keys.errors, error.id + ''])

// ==== System ERRORS

export const assocSystemError = (error) => R.assoc(keys.systemError, error)

export const getSystemError = R.pipe(getState, R.prop(keys.systemError))