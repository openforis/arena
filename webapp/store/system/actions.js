import * as i18nFactory from '@core/i18n/i18nFactory'

import * as API from '@webapp/service/api'

export const SYSTEM_INIT = 'system/init'
export const SYSTEM_RESET = 'system/reset'

export const initSystem = () => async (dispatch) => {
  const { user, survey } = await API.fetchUserAndSurvey()

  dispatch({
    type: SYSTEM_INIT,
    user,
    survey,
  })
}

export const resetSystem = () => ({ type: SYSTEM_RESET })