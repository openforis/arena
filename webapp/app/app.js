import * as R from 'ramda'

import { excludePathRoot } from '../app-utils/reduxUtils'

export const appUri = module => ['/app', module].join('/')
export const loginUri = '/'
export const isHome = R.equals(appUri())

export const systemStatus = {
  ready: 'ready'
}

const app = 'app'
const appSurvey = ['app', 'survey']

const statePath = {
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

  isReady: R.pathEq(statePath.status, systemStatus.ready),

  getUser: R.path(statePath.user),

  logoutUser: R.dissocPath(excludePathRoot(statePath.user)),

  //TODO Move to root survey state??
  surveyId: R.path(statePath.survey.id),

  surveyStatus: R.path(statePath.survey.status),

}

