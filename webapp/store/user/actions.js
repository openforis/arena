import axios from 'axios'
import * as API from '@webapp/service/api'

import { LoaderActions } from '@webapp/store/ui'
import * as User from '@core/user/user'

export const USER_LOGOUT = 'store/user/logout'

export const USER_INIT = 'store/user/init'
export const USER_UPDATE = 'store/user/update'

export const logout = () => async (dispatch) => {
  dispatch(LoaderActions.showLoader())

  await axios.post('/auth/logout')

  dispatch({ type: USER_LOGOUT })
  dispatch(LoaderActions.hideLoader())
}

export const initUser = () => async (dispatch) => {
  const { user, survey } = await API.fetchUserAndSurvey()
  dispatch({ type: USER_INIT, user, survey })
}

export const setUser = ({ user }) => async (dispatch) => {
  dispatch({ type: USER_UPDATE, user })
}

export const updateUserPrefs = ({ user }) => async (dispatch) => {
  dispatch(setUser({ user }))
  await axios.post(`/api/user/${User.getUuid(user)}/prefs`, user)
}
