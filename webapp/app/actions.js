import axios from 'axios'

import { systemStatus } from './app'
import { dispatchCurrentSurveyUpdate } from '../survey/actions'

export const appStatusChange = 'app/status/change'
export const appUserLogout = 'app/user/logout'

export const initApp = () => async dispatch => {
  try {

    const resp = await axios.get('/auth/user')

    const {data} = resp
    const {user, survey} = data

    if (survey)
      dispatchCurrentSurveyUpdate(dispatch, survey)

    dispatch({type: appStatusChange, status: systemStatus.ready, user})

  } catch (e) {
  }

}

export const logout = () => async dispatch => {
  try {
    await axios.post('/auth/logout')

    dispatch({type: appUserLogout})
  } catch (e) {
  }

}
