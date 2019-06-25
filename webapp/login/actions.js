import * as JwtUtils from '../utils/jwtUtils'

export const loginError = 'login/error'
export const loginSuccess = 'login/success'

export const login = (username, password) => async dispatch => {
  try {

    const { user, survey } = await JwtUtils.authenticate(username, password)
    dispatch({ type: loginSuccess, user, survey })

  } catch (e) {
    dispatch({ type: loginError, errorMessage: e })
  }

}