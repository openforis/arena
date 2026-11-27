import { useCallback, useEffect, useReducer } from 'react'
import axios from 'axios'
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
    const { title, firstName = '', lastName = '', institution = '', country = '' } = registrationInfo
    return {
      firstName,
      lastName,
      institution,
      country,
      ...(title ? { props: { ...user.props, title } } : {}),
    }
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

  // external login providers set only the name: the other info is saved before leaving the page
  const onBeforeExternalLogin = useCallback(async (): Promise<boolean> => {
    const missingFieldErrorKey = [
      [title, Validation.messageKeys.user.titleRequired],
      [firstName, Validation.messageKeys.userAccessRequest.firstNameRequired],
      [lastName, Validation.messageKeys.userAccessRequest.lastNameRequired],
    ].find(([value]) => !value)?.[1]
    if (missingFieldErrorKey) {
      actions.updateError(missingFieldErrorKey)(dispatch)
      return false
    }
    try {
      const { data } = await axios.put(`/auth/reset-password/${uuid}/info`, {
        title,
        firstName,
        lastName,
        institution,
        country,
      })
      return Boolean(data?.result)
    } catch {
      dispatchRedux(NotificationActions.notifyError({ key: 'guest:resetPasswordView.forgotPasswordLinkInvalid' }))
      return false
    }
  }, [country, dispatchRedux, firstName, institution, lastName, title, uuid])

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
    onBeforeExternalLogin,
    registrationInfo,
    state,
    onChangeUser,
    onChangeUserTitle,
    onSubmit,
    navigateToHomePage,
  }
}
