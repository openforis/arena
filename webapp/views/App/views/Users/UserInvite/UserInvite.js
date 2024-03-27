import './UserInvite.scss'

import React from 'react'

import * as AuthGroup from '@core/auth/authGroup'
import * as Authorizer from '@core/auth/authorizer'
import * as Survey from '@core/survey/survey'
import * as UserInvite from '@core/user/userGroupInvitation'
import * as Validation from '@core/validation/validation'
import * as Validator from '@core/validation/validator'

import { Button, ButtonIconInfo, Markdown } from '@webapp/components'
import { FormItem, Input } from '@webapp/components/form/Input'
import InputChipsText from '@webapp/components/form/InputChips/InputChipsText'
import { useSurveyInfo } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { useUser } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import DropdownUserGroup from '../DropdownUserGroup'

import { useInviteUser } from './store'

const UserInviteComponent = () => {
  const { userInvite, onUpdate, onInvite } = useInviteUser()

  const i18n = useI18n()
  const user = useUser()
  const surveyInfo = useSurveyInfo()

  const emails = UserInvite.getEmails(userInvite)
  const validation = UserInvite.getValidation(userInvite)
  const selectedGroupUuid = UserInvite.getGroupUuid(userInvite)
  const groups = Authorizer.getUserGroupsCanAssign({ user, surveyInfo })
  const selectedGroup = groups.find((group) => group.uuid === selectedGroupUuid)
  const selectedGroupName = AuthGroup.getName(selectedGroup)

  return (
    <div className="user-invite form">
      <FormItem label={i18n.t('common.email', { count: 2 })}>
        <InputChipsText
          id={TestId.userInvite.email}
          isInputFieldValueValid={Validator.isEmailValueValid}
          onChange={(value) => onUpdate({ name: UserInvite.keys.emails, value })}
          placeholder={i18n.t('userInviteView.typeEmail')}
          selection={emails}
          validation={Validation.getFieldValidation(UserInvite.keys.emails)(validation)}
          textTransformFunction={(value) => value.trim().toLowerCase()}
        />
      </FormItem>
      <FormItem label={i18n.t('common.group')}>
        <DropdownUserGroup
          validation={Validation.getFieldValidation(UserInvite.keys.groupUuid)(validation)}
          groupUuid={selectedGroupUuid}
          onChange={(group) => onUpdate({ name: UserInvite.keys.groupUuid, value: AuthGroup.getUuid(group) })}
        />
      </FormItem>

      {!Survey.isPublished(surveyInfo) && (
        <Markdown
          className="user-invite__warning-message"
          source={i18n.t('userInviteView.surveyNotPublishedWarning')}
        />
      )}

      {selectedGroupName && (
        <FormItem label={i18n.t('userInviteView.groupPermissions.label')}>
          <ul dangerouslySetInnerHTML={{ __html: i18n.t(`userInviteView.groupPermissions.${selectedGroupName}`) }} />
        </FormItem>
      )}

      <FormItem
        label={
          <div>
            {i18n.t('userInviteView.messageOptional')}
            <ButtonIconInfo
              title="userInviteView.messageInfo"
              onClick={() => window.open('https://www.markdownguide.org/basic-syntax', 'markdown-guide', 'noopener')}
            />
          </div>
        }
      >
        <Input
          id={TestId.userInvite.message}
          inputType="textarea"
          onChange={(value) => onUpdate({ name: UserInvite.keys.message, value })}
          validation={Validation.getFieldValidation(UserInvite.keys.message)(validation)}
          value={UserInvite.getMessage(userInvite)}
        />
      </FormItem>

      <div className="user-invite__buttons">
        <Button
          testId={TestId.userInvite.submitBtn}
          className="btn-invite"
          onClick={onInvite}
          iconClassName="icon-envelop icon-left icon-12px"
          label="userInviteView.sendInvitation"
        />
      </div>
    </div>
  )
}

export default UserInviteComponent
