import { useAsyncGetRequest, useAsyncPutRequest, useOnUpdate } from '@webapp/components/hooks'
import { useCallback, useEffect, useReducer } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useDispatch } from 'react-redux'

import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'

import { LoginValidator } from '@webapp/store/login'
import { appModuleUri, homeModules } from '@webapp/app/appModules'
import { NotificationActions } from '@webapp/store/ui'

import * as actions from './actions'
import reducer from './reducer'
import initialState from './initialState'

export const useResetPassword = () => {
  const dispatchRedux = useDispatch()
  const { uuid } = useParams()
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(reducer, initialState)
  const { user } = state
  const { name, password, passwordConfirm, props = {} } = user
  const hasAlreadyAccepted = User.hasAccepted(user)

  const { title } = props

  const { data: { user: userFetched } = {}, dispatch: getResetPasswordUser } = useAsyncGetRequest(
    `/auth/reset-password/${uuid}`
  )

  const { data: { result: resetComplete = false } = {}, dispatch: dispatchPostResetPassword } = useAsyncPutRequest(
    `/auth/reset-password/${uuid}`,
    { name, title, password }
  )

  const navigateToHomePage = () => navigate(appModuleUri(homeModules.dashboard))

  const onChangeUser = ({ prop, value }) => actions.updateUser({ prop, value })(dispatch)
  const onChangeUserTitle = (userWithTitle) => actions.updateUserTitle(userWithTitle)(dispatch)

  const onSubmit = useCallback(async () => {
    const validation = await LoginValidator.validateResetPasswordObj({
      name,
      title,
      password,
      passwordConfirm,
      hasAlreadyAccepted,
    })
    if (Validation.isValid(validation)) {
      dispatchPostResetPassword()
    } else {
      const error = LoginValidator.getFirstError(validation, ['name', 'title', 'password', 'passwordConfirm'])
      actions.updateError(error)(dispatch)
    }
  }, [dispatchPostResetPassword, hasAlreadyAccepted, name, password, passwordConfirm, title])

  useEffect(() => {
    getResetPasswordUser()
  }, [])

  useOnUpdate(() => {
    if (userFetched) {
      actions.initUser(userFetched)(dispatch)
    } else {
      dispatchRedux(NotificationActions.notifyError({ key: 'resetPasswordView.forgotPasswordLinkInvalid' }))
    }
  }, [userFetched])

  useOnUpdate(() => {
    navigate(appModuleUri())
    dispatchRedux(NotificationActions.notifyInfo({ key: 'resetPasswordView.passwordSuccessfullyReset' }))
  }, [resetComplete])

  return {
    state,
    onChangeUser,
    onChangeUserTitle,
    onSubmit,
    navigateToHomePage,
  }
}
