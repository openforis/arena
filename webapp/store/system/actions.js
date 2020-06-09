import * as i18nFactory from '@core/i18n/i18nFactory'

import * as API from '@webapp/service/api'

export const SYSTEM_INIT = 'system/init'

export const initSystem = () => async (dispatch) => {
  const i18n = await i18nFactory.createI18nPromise('en')
  const { user, survey } = await API.fetchUserAndSurvey()
  dispatch({
    type: SYSTEM_INIT,
    i18n,
    user,
    survey,
  })
}
