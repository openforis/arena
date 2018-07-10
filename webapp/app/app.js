import * as R from 'ramda'

export const appUri = '/app'

export const appStatus = {
  ready: 'ready'
}

export const isAppReady = R.pathEq(['app', 'status'], appStatus.ready)

