import * as R from 'ramda'

import { excludePathRoot } from '../app-utils/reduxUtils'

export const appUri = '/app'
export const loginUri = '/'

export const appStatus = {
  ready: 'ready'
}

const appStatePath = {
  status: ['app', 'status'],
  user: ['app', 'user']
}

export const appState = {

  isReady: R.pathEq(appStatePath.status, appStatus.ready),

  user: R.path(appStatePath.user),

  logoutUser: R.dissocPath(excludePathRoot(appStatePath.user))

}
