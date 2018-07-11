import * as R from 'ramda'

export const appUri = '/app'
export const loginUri = '/'

export const appStatus = {
  ready: 'ready'
}

const appStatePath = {
  status: ['app', 'status'],
  user: ['app', 'user']
}

const removeRootStatePath = R.remove(0, 1)

export const appState = {

  isReady: R.pathEq(appStatePath.status, appStatus.ready),

  user: R.path(appStatePath.user),

  logoutUser: R.dissocPath(removeRootStatePath(appStatePath.user))

}
