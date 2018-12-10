import axios from 'axios'

import { appStatus } from './appState'

export const appStatusChange = 'app/status/change'
export const appUserLogout = 'app/user/logout'
export const appUserPrefUpdate = 'app/user/pref/update'

export const initApp = () => async (dispatch) => {
  try {
    // fetching user
    const resp = await axios.get('/auth/user')

    const {data} = resp
    const {user, survey} = data

    dispatch({type: appStatusChange, status: appStatus.ready, user, survey})

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

// ====== ERRORS HANDLING

export const appErrorCreate = 'app/error/create'
export const appErrorDelete = 'app/error/delete'

export const closeAppError = error => dispatch =>
  dispatch({type: appErrorDelete, error})

export const systemErrorThrow = 'system/error'

export const throwSystemError = error => dispatch =>
  dispatch({type: systemErrorThrow, error})