import axios from 'axios'
import * as R from 'ramda'

export const loginError = 'login/error'
export const loginSuccess = 'login/success'

export const login = (username, password) => async dispatch => {
  try {
    const resp = await axios.post('/auth/login', {username, password})

    const {message: errorMessage, user} = R.prop('data', resp)

    if (errorMessage) {
      dispatch({type: loginError, errorMessage})
    } else {
      dispatch({type: loginSuccess, user})
    }
  } catch (e) {
    alert(e)
  }
}