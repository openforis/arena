import { useCallback, useEffect, useReducer } from 'react'
import { useNavigate, useParams } from 'react-router'

import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'
import { appModuleUri, homeModules } from '@webapp/app/appModules'
import { useAsyncGetRequest, useAsyncPutRequest, useOnUpdate } from '@webapp/components/hooks'
import { useAppDispatch } from '@webapp/store'
import { LoginValidator } from '@webapp/store/login'
import { NotificationActions } from '@webapp/store/ui'

import * as actions from './actions'
import initialState from './initialState'
import reducer from './reducer'

const getFullName = ({ firstName, lastName }) => [firstName, lastName].filter(Boolean).join(' ').trim()

// fields of the registration form: from the access request (not editable) or from the invited user
const getInitialRegistrationFields = ({ user, registrationInfo }) => {
  if (registrationInfo) {
    const { firstName = '', lastName = '', institution = '', country = '' } = registrationInfo
    return { firstName, lastName, institution, country }
  }
  // name possibly set when inviting the user: first word as first name
  const [firstName = '', ...lastNameParts] = (user.name ?? '').trim().split(/\s+/)
  return {
    firstName,
    lastName: lastNameParts.join(' '),
    institution: User.getInstitution(user),
    country: User.getCountry(user),
  }
}

export const useResetPassword = () => {
  const dispatchRedux = useAppDispatch()
  const { uuid } = useParams()
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(reducer, initialState)
  const { user } = state
  const { firstName, lastName, institution, country, password, passwordConfirm, props = {} } = user
  const name = getFullName({ firstName, lastName })
  const hasAlreadyAccepted = User.hasAccepted(user)

  const { title } = props

  const { data: { user: userFetched, registrationInfo = null } = {}, dispatch: getResetPasswordUser } =
    useAsyncGetRequest(`/auth/reset-password/${uuid}`)

  const { data: { result: resetComplete = false } = {}, dispatch: dispatchPostResetPassword } = useAsyncPutRequest(
    `/auth/reset-password/${uuid}`,
    { name, title, password, institution, country }
  )

  const navigateToHomePage = () => navigate(appModuleUri(homeModules.landing))

  const onChangeUser = ({ prop, value }) => actions.updateUser({ prop, value })(dispatch)
  const onChangeUserTitle = (userWithTitle) => actions.updateUserTitle(userWithTitle)(dispatch)

  const onSubmit = useCallback(async () => {
    const validation = await LoginValidator.validateResetPasswordObj({
      firstName,
      lastName,
      title,
      password,
      passwordConfirm,
      hasAlreadyAccepted,
    })
    if (Validation.isValid(validation)) {
      dispatchPostResetPassword()
    } else {
      const error = LoginValidator.getFirstError(validation, [
        'title',
        'firstName',
        'lastName',
        'password',
        'passwordConfirm',
      ])
      actions.updateError(error)(dispatch)
    }
  }, [dispatchPostResetPassword, firstName, hasAlreadyAccepted, lastName, password, passwordConfirm, title])

  useEffect(() => {
    getResetPasswordUser()
  }, [])

  useOnUpdate(() => {
    if (userFetched) {
      actions.initUser({ ...userFetched, ...getInitialRegistrationFields({ user: userFetched, registrationInfo }) })(
        dispatch
      )
    } else {
      dispatchRedux(NotificationActions.notifyError({ key: 'guest:resetPasswordView.forgotPasswordLinkInvalid' }))
    }
  }, [userFetched])

  useOnUpdate(() => {
    navigate(appModuleUri())
    dispatchRedux(NotificationActions.notifyInfo({ key: 'guest:resetPasswordView.passwordSuccessfullyReset' }))
  }, [resetComplete])

  return {
    registrationInfo,
    state,
    onChangeUser,
    onChangeUserTitle,
    onSubmit,
    navigateToHomePage,
  }
}
