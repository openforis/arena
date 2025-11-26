import * as User from '@core/user/user'
import analytics from '@webapp/service/analytics'
import * as API from '@webapp/service/api'
import { showJobMonitor } from '../app/job/actions'
import { useI18n } from './i18n'

export const SYSTEM_INIT = 'system/init'
export const SYSTEM_RESET = 'system/reset'

export const initSystem = () => async (dispatch) => {
  const i18n = useI18n()

  const { user, survey } = await API.fetchUserAndSurvey()

  analytics.init({ user })

  dispatch({ type: SYSTEM_INIT, user, survey })

  const activeJob = await API.fetchActiveJob()
  if (activeJob) {
    dispatch(showJobMonitor({ job: activeJob }))
  }

  const userPreferredLanguage = user ? User.getPrefLanguage(user) : null
  if (userPreferredLanguage) {
    i18n.changeLanguage(userPreferredLanguage)
  }
}

export const resetSystem = () => ({ type: SYSTEM_RESET })
