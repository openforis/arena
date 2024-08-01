import * as StringUtils from '@core/stringUtils'

import { LoaderActions, NotificationActions } from '@webapp/store/ui'
import { appModules, appModuleUri } from '@webapp/app/appModules'
import { AppSavingActions } from '@webapp/store/app'

const appErrorsNamespace = 'appErrors:'

const _navigateToModuleDataHome = (navigate) => navigate(appModuleUri(appModules.data))

export const sessionExpired = (navigate) => (dispatch) => {
  dispatch(NotificationActions.notifyInfo({ key: 'recordView.sessionExpired' }))
  _navigateToModuleDataHome(navigate)
}

const _toMessageKey = (key) => [key, StringUtils.prependIfMissing(appErrorsNamespace)(key)]

export const applicationError =
  ({ i18n, navigate, key, params }) =>
  (dispatch) => {
    const { error, errorJson } = params
    const details = errorJson ? i18n.t(_toMessageKey(errorJson.key), errorJson.params) : error
    dispatch(
      NotificationActions.notifyError({
        key: _toMessageKey(key),
        params: { ...params, details },
      })
    )
    dispatch(LoaderActions.hideLoader())
    dispatch(AppSavingActions.hideAppSaving())

    navigate(appModuleUri(appModules.designer))
  }

export const cycleChanged = (navigate) => () => _navigateToModuleDataHome(navigate)
