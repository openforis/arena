import analytics from '@webapp/service/analytics'
import * as API from '@webapp/service/api'
import { showJobMonitor } from '../app/job/actions'

export const SYSTEM_INIT = 'system/init'
export const SYSTEM_RESET = 'system/reset'

export const initSystem = () => async (dispatch) => {
  try {
    const { user, survey } = await API.fetchLoggedInUserAndSurvey()

    analytics.identify({
      userId: user?.uuid,
      properties: user,
    })

    dispatch({ type: SYSTEM_INIT, user, survey })

    if (user) {
      const activeJob = await API.fetchActiveJob()
      if (activeJob) {
        dispatch(showJobMonitor({ job: activeJob }))
      }
    }
  } catch (error) {
    dispatch({ type: SYSTEM_INIT, user: null, survey: null })
  }
}

export const resetSystem = () => ({ type: SYSTEM_RESET })
