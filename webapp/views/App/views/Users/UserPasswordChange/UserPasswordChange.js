import './UserPasswordChange.scss'

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import classNames from 'classnames'

import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'
import { UserPasswordChangeForm } from '@core/user/userPasswordChangeForm'
import { UserPasswordChangeFormValidator } from '@core/user/userPasswordChangeFormValidator'

import * as API from '@webapp/service/api'

import { Button, ButtonBack } from '@webapp/components'
import { useNotifyInfo } from '@webapp/components/hooks'
import { UserPasswordSetForm } from './UserPasswordSetForm'
import { useUser, useUserIsSystemAdmin } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import { useIsMobile } from '@webapp/components/hooks/useIsMobile'

const defaultState = { form: UserPasswordChangeForm.newForm(), userToUpdate: null, validation: {} }

const UserPasswordChange = () => {
  const { userUuid } = useParams()
  const i18n = useI18n()
  const notifyInfo = useNotifyInfo()
  const user = useUser()
  const isSystemAdmin = useUserIsSystemAdmin()
  const isMobile = useIsMobile()
  const [state, setState] = useState(defaultState)
  const { form, userToUpdate, validation } = state
  const empty = UserPasswordChangeForm.isEmpty(form)
  const canEdit = isSystemAdmin || userUuid === User.getUuid(user)

  useEffect(() => {
    const fetchAndSetUser = async () => {
      const userLoaded = await API.fetchUser({ userUuid })
      setState((statePrev) => ({ ...statePrev, userToUpdate: userLoaded }))
    }
    if (userUuid) {
      fetchAndSetUser()
    }
  }, [userUuid])

  const setStateProp = (prop) => async (value) => {
    const formNext = { ...form, [prop]: value }
    const validationNext = await UserPasswordChangeFormValidator.validate(formNext, {
      includeOldPassword: !isSystemAdmin,
    })
    setState((statePrev) => ({ ...statePrev, form: formNext, validation: validationNext }))
  }

  const resetState = () => setState(defaultState)

  const onChangePasswordClick = async () => {
    const { validation: validationUpdated } = await API.changeUserPassword({ form, userUuid })
    if (!validationUpdated) {
      notifyInfo({ key: 'userPasswordChangeView.passwordChangedSuccessfully' })
      resetState()
    } else {
      setState((statePrev) => ({ ...statePrev, validation: validationUpdated }))
    }
  }

  if (!canEdit) {
    return (
      <div className="user-change-password">
        {i18n.t('userPasswordChangeView.notAuthorizedToChangePasswordOfAnotherUser')}
      </div>
    )
  }

  return (
    <div className="user-change-password">
      {userUuid && userToUpdate && (
        <LabelWithTooltip
          className={classNames('title', { mobile: isMobile })}
          label={i18n.t('userPasswordChangeView.changingPasswordForUser', {
            user: `${User.getName(userToUpdate)} (${User.getEmail(userToUpdate)})`,
          })}
        />
      )}
      <UserPasswordSetForm
        form={form}
        onFieldChange={(key) => (value) => setStateProp(key)(value)}
        passwordChange={!isSystemAdmin}
        validation={validation}
      />

      <div className="button-bar">
        <ButtonBack />

        <Button
          className="btn-primary"
          disabled={Validation.isNotValid(validation) || empty}
          label="userPasswordChangeView.changePassword"
          onClick={onChangePasswordClick}
        />
      </div>
    </div>
  )
}

export default UserPasswordChange
