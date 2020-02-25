import './userInviteView.scss'

import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router'

import * as UserInvite from '@core/user/userInvite'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/commonComponents/hooks'
import { FormItem, Input } from '@webapp/commonComponents/form/input'
import DropdownUserGroup from '@webapp/loggedin/modules/users/components/dropdownUserGroup'

import * as UserInviteState from './userInviteViewState'
import { updateUserInviteProp, inviteUser, resetUserInviteState } from './actions'

const UserInviteView = () => {
  useEffect(() => {
    // Reset state on unmount
    return () => dispatch(resetUserInviteState())
  }, [])

  const i18n = useI18n()
  const dispatch = useDispatch()
  const history = useHistory()
  const userInvite = useSelector(UserInviteState.getUserInvite)
  const validation = UserInvite.getValidation(userInvite)

  return (
    <div className="user-invite form">
      <FormItem label={i18n.t('common.email')}>
        <Input
          placeholder={i18n.t('common.email')}
          value={UserInvite.getEmail(userInvite)}
          validation={Validation.getFieldValidation(UserInvite.keys.email)(validation)}
          onChange={value => dispatch(updateUserInviteProp(UserInvite.keys.email, value))}
        />
      </FormItem>
      <FormItem label={i18n.t('common.group')}>
        <DropdownUserGroup
          validation={Validation.getFieldValidation(UserInvite.keys.groupUuid)(validation)}
          groupUuid={UserInvite.getGroupUuid(userInvite)}
          onChange={groupUuid => dispatch(updateUserInviteProp(UserInvite.keys.groupUuid, groupUuid))}
        />
      </FormItem>

      <div className="user-invite__buttons">
        <button
          className="btn btn-invite"
          aria-disabled={!Validation.isValid(validation)}
          onClick={() => dispatch(inviteUser(history))}
        >
          <span className={`icon icon-envelop icon-left icon-12px`} />
          {i18n.t('userView.sendInvitation')}
        </button>
      </div>
    </div>
  )
}

export default UserInviteView
