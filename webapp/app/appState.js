import * as R from 'ramda'

import { isSystemAdmin } from '../../common/auth/authManager'

import Survey from '../../common/survey/survey'

const keys = {
  status: 'status',
  user: 'user',
  authGroups: 'authGroups',
  errors: 'errors',
  systemError: 'systemError',
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
        R.prop(keys.authGroups),
        R.append(Survey.getSurveyAdminGroup(surveyInfo))
      )(user)

      return R.assocPath([keys.user, keys.authGroups], userGroups, appState)
    }
  }

export const dissocSurveyGroups = surveyId =>
  appState => {
    const user = R.prop(keys.user, appState)
    // removing survey auth groups from user group
    const userGroups = R.reject(
      g => g.surveyId === surveyId,
      R.prop(keys.authGroups, user)
    )

    return R.assocPath([keys.user, keys.authGroups], userGroups, appState)
  }

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
  id => R.assocPath([keys.errors, id + ''], error)(state)
)(state)

export const dissocAppError = error => R.dissocPath([keys.errors, error.id + ''])

// ==== System ERRORS

export const assocSystemError = (error) => R.assoc(keys.systemError, error)

export const getSystemError = R.pipe(getState, R.prop(keys.systemError))