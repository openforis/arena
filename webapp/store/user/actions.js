import axios from 'axios'

import * as User from '@core/user/user'

export const USER_UPDATE = 'store/user/update'

export const setUser =
  ({ user }) =>
  async (dispatch) => {
    dispatch({ type: USER_UPDATE, user })
  }

export const updateUserPrefs =
  ({ user }) =>
  async (dispatch) => {
    dispatch(setUser({ user }))
    await axios.post(`/api/user/${User.getUuid(user)}/prefs`, user)
  }
