import axios from 'axios'
import * as R from 'ramda'

import { appStatus } from './app'

export const appStatusChange = 'app/status/change'

export const initApp = () => async dispatch => {
  try {

    const resp = await axios.get('/auth/user')

    const data = R.prop('data', resp)

    dispatch({type: appStatusChange, status: appStatus.ready, ...data})

  } catch (e) {

  }
}
