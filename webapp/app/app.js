import * as R from 'ramda'

import { excludePathRoot } from '../appUtils/reduxUtils'
import { appModules } from '../appModules/appModules'
import { getLocationPathname } from '../appUtils/routerUtils'

const app = 'app'

//default home is dashboard
export const appModuleUri = (module = appModules.home) => ['/' + app, module].join('/') + '/'

export const loginUri = '/'

const isPath = path => R.pipe(
  getLocationPathname,
  R.equals(path),
)
export const isLocationLogin = isPath(loginUri)

export const systemStatus = {
  ready: 'ready'
}

const statePath = {
  //application status
  status: [app, 'status'],

  //logged in user
  user: [app, 'user'],
}

export const appState = {
  isReady: R.pathEq(statePath.status, systemStatus.ready),

  getUser: R.path(statePath.user),

  logoutUser: R.dissocPath(excludePathRoot(statePath.user)),
}

export const getSurveys = R.path([app, 'surveys'])
