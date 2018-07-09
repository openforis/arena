import axios from 'axios'
import * as R from 'ramda'

export const loginError = 'login/error'
export const loginSuccess = 'login/success'

export const login = (username, password) => async dispatch => {
  try {
    const resp = await axios.post('/auth/login', {username, password})

    const errorMessage = R.path(['data', 'message'], resp)
    const redirectUrl = R.path(['data', 'redirectUrl'], resp)

    if (errorMessage) {
      dispatch({type: loginError, errorMessage})
    } else if (redirectUrl) {
      dispatch({type: loginSuccess})
      window.location = redirectUrl
    }
  } catch (e) {
    alert(e)
  }
}