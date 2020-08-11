import './UserInvite.scss'

import React from 'react'

import * as UserInvite from '@core/user/userInvite'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'
import { FormItem, Input } from '@webapp/components/form/Input'

import DropdownUserGroup from '../DropdownUserGroup'

import { useInviteUser } from './store'

const UserInviteComponent = () => {
  const { userInvite, onUpdate, onInvite } = useInviteUser()

  const i18n = useI18n()

  const validation = UserInvite.getValidation(userInvite)

  return (
    <div className="user-invite form">
      <FormItem label={i18n.t('common.email')}>
        <Input
          placeholder={i18n.t('common.email')}
          value={UserInvite.getEmail(userInvite)}
          validation={Validation.getFieldValidation(UserInvite.keys.email)(validation)}
          onChange={(value) => onUpdate({ name: UserInvite.keys.email, value })}
        />
      </FormItem>
      <FormItem label={i18n.t('common.group')}>
        <DropdownUserGroup
          validation={Validation.getFieldValidation(UserInvite.keys.groupUuid)(validation)}
          groupUuid={UserInvite.getGroupUuid(userInvite)}
          onChange={(value) => onUpdate({ name: UserInvite.keys.groupUuid, value })}
        />
      </FormItem>

      <div className="user-invite__buttons">
        <button
          type="button"
          className="btn btn-invite"
          aria-disabled={!Validation.isValid(validation)}
          onClick={onInvite}
        >
          <span className="icon icon-envelop icon-left icon-12px" />
          {i18n.t('userView.sendInvitation')}
        </button>
      </div>
    </div>
  )
}

export default UserInviteComponent
