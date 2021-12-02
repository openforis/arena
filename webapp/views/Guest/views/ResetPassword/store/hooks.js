import { useAsyncGetRequest, useAsyncPutRequest, useOnUpdate } from '@webapp/components/hooks'
import { useEffect, useReducer } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useDispatch } from 'react-redux'

import { LoginValidator } from '@webapp/store/login'
import * as Validation from '@core/validation/validation'
import { appModuleUri } from '@webapp/app/appModules'
import { NotificationActions } from '@webapp/store/ui'

import * as actions from './actions'
import reducer from './reducer'
import initialState from './initialState'

export const useResetPassword = () => {
  const dispatchRedux = useDispatch()
  const { uuid } = useParams()
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(reducer, initialState)
  const { name, password, passwordConfirm, props = {} } = state.user
  const { title } = props

  const { data: { user } = {}, dispatch: getResetPasswordUser } = useAsyncGetRequest(`/auth/reset-password/${uuid}`)

  const { data: { result: resetComplete = false } = {}, dispatch: dispatchPostResetPassword } = useAsyncPutRequest(
    `/auth/reset-password/${uuid}`,
    { name, title, password }
  )

  const onChangeUser = (event) => actions.updateUser(event)(dispatch)
  const onChangeUserTitle = (userWithTitle) => actions.updateUserTitle(userWithTitle)(dispatch)

  const onSubmit = () => {
    ;(async () => {
      const validation = await LoginValidator.validateResetPasswordObj({ name, title, password, passwordConfirm })
      if (Validation.isValid(validation)) {
        dispatchPostResetPassword()
      } else {
        const error = LoginValidator.getFirstError(validation, ['name', 'title', 'password', 'passwordConfirm'])
        actions.updateError(error)(dispatch)
      }
    })()
  }

  useEffect(() => {
    getResetPasswordUser()
  }, [])

  useOnUpdate(() => {
    actions.initUser(user)(dispatch)
  }, [user])

  useOnUpdate(() => {
    navigate(appModuleUri())
    dispatchRedux(NotificationActions.notifyInfo({ key: 'resetPasswordView.passwordSuccessfullyReset' }))
  }, [resetComplete])

  return {
    state,
    onChangeUser,
    onChangeUserTitle,
    onSubmit,
  }
}
