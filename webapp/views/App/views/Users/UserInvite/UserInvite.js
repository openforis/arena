import './UserInvite.scss'

import React from 'react'

import * as Survey from '@core/survey/survey'
import * as UserInvite from '@core/user/userInvite'
import * as Validation from '@core/validation/validation'

import { useSurveyInfo } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { FormItem, Input } from '@webapp/components/form/Input'
import Markdown from '@webapp/components/markdown'

import { DataTestId } from '@webapp/utils/dataTestId'

import DropdownUserGroup from '../DropdownUserGroup'

import { useInviteUser } from './store'

const UserInviteComponent = () => {
  const { userInvite, onUpdate, onInvite } = useInviteUser()

  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()

  const validation = UserInvite.getValidation(userInvite)

  return (
    <div className="user-invite form">
      <FormItem label={i18n.t('common.email')}>
        <Input
          id={DataTestId.userInvite.email}
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

      {!Survey.isPublished(surveyInfo) && (
        <Markdown
          className="user-invite__warning-message"
          source={i18n.t('userView.invitation.surveyNotPublishedWarning')}
        />
      )}

      <div className="user-invite__buttons">
        <button
          data-testid={DataTestId.userInvite.submitBtn}
          type="button"
          className="btn btn-invite"
          aria-disabled={!Validation.isValid(validation)}
          onClick={onInvite}
        >
          <span className="icon icon-envelop icon-left icon-12px" />
          {i18n.t('userView.invitation.sendInvitation')}
        </button>
      </div>
    </div>
  )
}

export default UserInviteComponent
