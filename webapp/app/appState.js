import * as R from 'ramda'
import { excludePathRoot } from '../appUtils/reduxUtils'

const app = 'app'

export const appStatus = {
  ready: 'ready'
}

export const isReady = R.pathEq([app, 'status'], appStatus.ready)

// ==== APP USER
const user = 'user'

export const getUser = R.path([app, user])

export const logoutUser = R.dissoc(user)

// ==== APP ERRORS
const errors = 'errors'

export const getAppState = R.prop(app)

export const assocAppError = error => R.assocPath([errors, error.id + ''], error)

export const dissocAppError = error => R.dissocPath([errors, error.id + ''])

export const getAppErrors = R.pipe(
  R.prop(errors),
  R.values,
  R.sort((a, b) => +b.id - +a.id)
)