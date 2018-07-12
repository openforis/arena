import * as R from 'ramda'

import { excludePathRoot } from '../app-utils/reduxUtils'

export const appUri = '/app'
export const loginUri = '/'

export const appStatus = {
  ready: 'ready'
}

const appStatePath = {
  //application status
  status: ['app', 'status'],

  //logged in user
  user: ['app', 'user'],

  //active survey
  surveyId: ['app', 'surveyId'],
}

export const appState = {

  isReady: R.pathEq(appStatePath.status, appStatus.ready),

  user: R.path(appStatePath.user),

  logoutUser: R.dissocPath(excludePathRoot(appStatePath.user)),

  surveyId: R.path(appStatePath.surveyId),

}
