import { NotificationActions } from '@webapp/store/ui'

import { appModules, appModuleUri } from '@webapp/app/appModules'

const _navigateToModuleDataHome = (navigate) => navigate(appModuleUri(appModules.data))

export const sessionExpired = (navigate) => (dispatch) => {
  dispatch(NotificationActions.notifyInfo({ key: 'recordView.sessionExpired' }))
  _navigateToModuleDataHome(navigate)
}

export const applicationError = (navigate, key, params) => (dispatch) => {
  dispatch(NotificationActions.notifyError({ key, params }))
  navigate(appModuleUri(appModules.designer))
}

export const cycleChanged = (navigate) => () => _navigateToModuleDataHome(navigate)
