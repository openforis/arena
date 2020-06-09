import axios from 'axios'

import * as i18nFactory from '@core/i18n/i18nFactory'

import { SystemStatusState } from '@webapp/store/system'

export const appPropsChange = 'app/props/change'

const _fetchUserAndSurvey = async () => {
  const {
    data: { user, survey },
  } = await axios.get('/auth/user')
  return { user, survey }
}

// ====== INIT

export const initApp = () => async (dispatch) => {
  const i18n = await i18nFactory.createI18nPromise('en')
  const { user, survey } = await _fetchUserAndSurvey()
  dispatch({
    type: appPropsChange,
    status: SystemStatusState.systemStatus.ready,
    i18n,
    user,
    survey,
  })
}
