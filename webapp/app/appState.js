import * as R from 'ramda'
import { isSystemAdmin } from '../../common/auth/authManager'
import Survey from '../../common/survey/survey'

const app = 'app'

export const appStatus = {
  ready: 'ready'
}

export const isReady = R.pathEq([app, 'status'], appStatus.ready)

// ==== APP USER
const userKey = 'user'
const authGroupsKey = 'authGroups'

export const getUser = R.path([app, userKey])

export const logoutUser = R.dissoc(userKey)

// On survey create, add current user to new survey's surveyAdmin group

export const assocSurveyAdminGroup = surveyInfo =>
  appState => {
    const user = R.prop(userKey, appState)

    if (isSystemAdmin(user)) {
      return appState
    } else {

      const userGroups = R.pipe(
        R.prop(authGroupsKey),
        R.append(Survey.getSurveyAdminGroup(surveyInfo))
      )(user)

      return R.assocPath([userKey, authGroupsKey], userGroups, appState)
    }
  }

export const dissocSurveyGroups = surveyId =>
  appState => {
    const user = R.prop(userKey, appState)
    // removing survey auth groups from user group
    const userGroups = R.reject(
      g => g.surveyId === surveyId,
      R.prop(authGroupsKey, user)
    )

    return R.assocPath([userKey, authGroupsKey], userGroups, appState)
  }

// ==== APP ERRORS
const errorsKey = 'errors'

export const getAppState = R.prop(app)

export const assocAppError = error => R.assocPath([errorsKey, error.id + ''], error)

export const dissocAppError = error => R.dissocPath([errorsKey, error.id + ''])

export const getAppErrors = R.pipe(
  R.prop(errorsKey),
  R.values,
  R.sort((a, b) => +b.id - +a.id)
)

const systemErrorKey = 'systemError'

export const assocSystemError = (error) => R.assoc(systemErrorKey, error)

export const getSystemError = R.path([app, systemErrorKey])