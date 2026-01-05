import * as User from '@core/user/user'
import analytics from '@webapp/service/analytics'
import * as API from '@webapp/service/api'
import { showJobMonitor } from '../app/job/actions'
import { useI18n } from './i18n'
import { MessageNotificationActions } from '../ui/messageNotification'
import { SystemActionTypes } from './actionTypes'

export const initSystem = () => async (dispatch) => {
  const i18n = useI18n()

  const { user, survey } = await API.fetchUserAndSurvey()

  analytics.identify({
    userId: user?.uuid,
    properties: user,
  })

  dispatch({ type: SystemActionTypes.SYSTEM_INIT, user, survey })

  const activeJob = await API.fetchActiveJob()
  if (activeJob) {
    dispatch(showJobMonitor({ job: activeJob }))
  }

  const userPreferredLanguage = user ? User.getPrefLanguage(user) : null
  if (userPreferredLanguage) {
    i18n.changeLanguage(userPreferredLanguage)
  }

  dispatch(MessageNotificationActions.fetchMessagesNotifiedToUser())
}

export const resetSystem = () => ({ type: SystemActionTypes.SYSTEM_RESET })
