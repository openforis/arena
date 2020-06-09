import axios from 'axios'
import { LoaderActions } from '@webapp/store/ui'

export const APP_USER_LOGOUT = 'app/user/logout'

export const logout = () => async (dispatch) => {
  dispatch(LoaderActions.showLoader())

  await axios.post('/auth/logout')

  dispatch({ type: APP_USER_LOGOUT })
  dispatch(LoaderActions.hideLoader())
}
