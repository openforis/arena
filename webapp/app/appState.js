import * as R from 'ramda'

import Survey from '../../common/survey/survey'
import User from '../../common/user/user'
import AuthGroups from '../../common/auth/authGroups'

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
  severity: 'severity',
}

export const notificationSeverity = {
  info: 'info',
  warning: 'warning',
  error: 'error',
}

export const getState = R.prop('app')

export const appStatus = {
  ready: 'ready',
}

export const isReady = R.pipe(getState, R.propEq(keys.status, appStatus.ready))

// ==== APP USER

export const getUser = R.pipe(getState, R.prop(keys.user))

export const logoutUser = R.dissoc(keys.user)

export const assocUserPropsOnSurveyCreate = survey => appState => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const user = R.pipe(
    R.prop(keys.user),
    User.assocPrefSurveyCurrentAndCycle(Survey.getIdSurveyInfo(surveyInfo), Survey.getCycleOneKey(surveyInfo)),
    R.unless(
      User.isSystemAdmin,
      User.assocAuthGroup(Survey.getAuthGroupAdmin(surveyInfo))
    )
  )(appState)
  return R.assoc(keys.user, user, appState)
}

export const assocUserPropsOnSurveyUpdate = survey => appState => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const user = R.pipe(
    R.prop(keys.user),
    User.assocPrefSurveyCurrent(Survey.getIdSurveyInfo(surveyInfo))
  )(appState)
  return R.assoc(keys.user, user, appState)
}

export const dissocUserPropsOnSurveyDelete = surveyInfo => appState => {
  const authGroup = R.pipe(
    R.prop(keys.user),
    User.getAuthGroups,
    R.find(
      R.propEq(AuthGroups.keys.surveyUuid, Survey.getUuid(surveyInfo))
    )
  )(appState)
  const user = R.pipe(
    R.prop(keys.user),
    User.dissocAuthGroup(authGroup),
    User.deletePrefSurvey(Survey.getIdSurveyInfo(surveyInfo)),
  )(appState)
  return R.assoc(keys.user, user, appState)
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
export const getNotificationSeverity = R.pipe(getState, R.pathOr(notificationSeverity.info, [keys.notification, keysNotification.severity]))
export const isNotificationVisible = R.pipe(getState, R.pathEq([keys.notification, keysNotification.visible], true))

export const showNotification = notification => R.pipe(
  R.assoc(keys.notification, notification),
  R.assocPath([keys.notification, keysNotification.visible], true)
)

export const hideNotification = R.assocPath([keys.notification, keysNotification.visible], false)