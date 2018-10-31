import axios from 'axios'

export const loginError = 'login/error'
export const loginSuccess = 'login/success'

export const login = (username, password) => async dispatch => {
  try {
    const {data} = await axios.post('/auth/login', {username, password})

    const {message: errorMessage, user, survey} = data

    if (errorMessage)
      dispatch({type: loginError, errorMessage})
    else
      dispatch({type: loginSuccess, user, survey})

  } catch (e) {
    alert(e)
  }
}