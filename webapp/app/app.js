import * as R from 'ramda'

import { excludePathRoot } from '../app-utils/reduxUtils'

export const appUri = '/app'
export const loginUri = '/'

export const appStatus = {
  ready: 'ready'
}

const app = 'app'
const appSurvey = ['app', 'survey']

const appStatePath = {
  //application status
  status: [app, 'status'],

  //logged in user
  user: [app, 'user'],

  //active survey
  survey: {
    id: [...appSurvey, 'id'],
    status: [...appSurvey, 'status'],
  },
}

export const appState = {

  isReady: R.pathEq(appStatePath.status, appStatus.ready),

  user: R.path(appStatePath.user),

  logoutUser: R.dissocPath(excludePathRoot(appStatePath.user)),

  //TODO Move to root survey state
  surveyId: R.path(appStatePath.survey.id),

  surveyStatus: R.path(appStatePath.survey.status),

}
