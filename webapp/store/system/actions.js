import * as User from '@core/user/user'
import analytics from '@webapp/service/analytics'
import * as API from '@webapp/service/api'

import { showJobMonitor } from '../app/job/actions'
import { useI18n } from './i18n'
import { MessageNotificationActions } from '../ui/messageNotification'
import { SystemActionTypes } from './actionTypes'

export const initSystem = () => async (dispatch) => {
  try {
    const i18n = useI18n()

    const { user, survey } = await API.fetchLoggedInUserAndSurvey()

    analytics.identify({ userId: user?.uuid, properties: user })

    const sytemInitPayload = { user, survey }

    if (user) {
      const info = await API.fetchInfo()

      Object.assign(sytemInitPayload, { info })

      const activeJob = await API.fetchActiveJob()
      if (activeJob) {
        dispatch(showJobMonitor({ job: activeJob }))
      }
      const userPreferredLanguage = User.getPrefLanguage(user)
      if (userPreferredLanguage) {
        i18n.changeLanguage(userPreferredLanguage)
      }

      dispatch(MessageNotificationActions.fetchMessagesNotifiedToUser({ i18n }))
    }
    dispatch({ type: SystemActionTypes.SYSTEM_INIT, ...sytemInitPayload })
  } catch (error) {
    dispatch({ type: SystemActionTypes.SYSTEM_INIT, info: null, user: null, survey: null, errorMessage: String(error) })
  }
}

export const resetSystem = () => ({ type: SystemActionTypes.SYSTEM_RESET })
