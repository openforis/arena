import axios from 'axios'
import { LoaderActions } from '@webapp/store/ui'

export const USER_LOGOUT = 'user/logout'

export const logout = () => async (dispatch) => {
  dispatch(LoaderActions.showLoader())

  await axios.post('/auth/logout')

  dispatch({ type: USER_LOGOUT })
  dispatch(LoaderActions.hideLoader())
}
