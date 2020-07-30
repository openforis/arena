import { NotificationActions } from '@webapp/store/ui'

import { appModules, appModuleUri } from '@webapp/app/appModules'

const _navigateToModuleDataHome = (history) => history.push(appModuleUri(appModules.data))

export const sessionExpired = (history) => (dispatch) => {
  dispatch(NotificationActions.notifyInfo({ key: 'recordView.sessionExpired' }))
  _navigateToModuleDataHome(history)
}

export const applicationError = (history, key, params) => (dispatch) => {
  dispatch(NotificationActions.notifyError({ key, params }))
  history.push(appModuleUri(appModules.designer))
}

export const cycleChanged = (history) => () => _navigateToModuleDataHome(history)
