import * as R from 'ramda'

import Authorizer from '../../common/auth/authorizer'

import Survey from '../../common/survey/survey'
import User from '../../common/user/user'

export const keys = {
  status: 'status',
  user: 'user',
  activeJob: 'activeJob',
  errors: 'errors',
  systemError: 'systemError',
  sideBarOpened: 'sideBarOpened',
  loaderVisible: 'loaderVisible',
  notification: 'notification',

  // activeJob keys
  onComplete: 'onComplete',

  // i18n
  i18n: 'i18n',
  lang: 'lang',
}

export const keysNotification = {
  messageKey: 'messageKey',
  messageParams: 'messageParams',
  visible: 'visible',
}

export const getState = R.prop('app')

export const appStatus = {
  ready: 'ready',
}

export const isReady = R.pipe(getState, R.propEq(keys.status, appStatus.ready))

// ==== APP USER

export const getUser = R.pipe(getState, R.prop(keys.user))

export const logoutUser = R.dissoc(keys.user)

// On survey create, add current user to new survey's surveyAdmin group
export const assocSurveyAdminGroup = surveyInfo =>
  appState => {
    const user = R.prop(keys.user, appState)

    if (Authorizer.isSystemAdmin(user)) {
      return appState
    } else {

      const userGroups = R.pipe(
        R.prop(User.keys.authGroups),
        R.append(Survey.getSurveyAdminGroup(surveyInfo))
      )(user)

      return R.assocPath([keys.user, User.keys.authGroups], userGroups, appState)
    }
  }

// On survey delete, dissoc survey from user
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

// ==== APP SIDE BAR
export const isSideBarOpened = R.pipe(getState, R.propEq(keys.sideBarOpened, true))

export const assocSideBarOpened = sideBarOpened => R.assoc(keys.sideBarOpened, sideBarOpened)

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

export const getActiveJobOnCompleteCallback = R.pipe(getActiveJob, R.defaultTo({}), R.propOr(null, keys.onComplete))

// ==== APP I18N
export const getI18n = R.pipe(getState, R.prop(keys.i18n))

export const getLang = R.pipe(getI18n, R.prop(keys.lang))

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

// ==== App Loader

export const isLoaderVisible = R.pipe(getState, R.propEq(keys.loaderVisible, true))

// ==== App Notification

export const getNotificationMessageKey = R.pipe(getState, R.pathOr(null, [keys.notification, keysNotification.messageKey]))
export const getNotificationMessageParams = R.pipe(getState, R.pathOr({}, [keys.notification, keysNotification.messageParams]))
export const isNotificationVisible = R.pipe(getState, R.pathEq([keys.notification, keysNotification.visible], true))

export const showNotification = notification => R.pipe(
  R.assoc(keys.notification, notification),
  R.assocPath([keys.notification, keysNotification.visible], true)
)

export const hideNotification = R.assocPath([keys.notification, keysNotification.visible], false)