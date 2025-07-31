import './UserInvite.scss'

import React, { useCallback } from 'react'

import * as AuthGroup from '@core/auth/authGroup'
import * as Authorizer from '@core/auth/authorizer'
import * as Survey from '@core/survey/survey'
import * as UserInvite from '@core/user/userGroupInvitation'
import * as Validation from '@core/validation/validation'
import * as Validator from '@core/validation/validator'

import { useSurveyInfo } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { useUser, useUserIsSystemAdmin } from '@webapp/store/user'

import { Button, Markdown } from '@webapp/components'
import { Checkbox } from '@webapp/components/form'
import { FormItem, Input } from '@webapp/components/form/Input'
import InputChipsText from '@webapp/components/form/InputChips/InputChipsText'

import { TestId } from '@webapp/utils/testId'

import DropdownUserGroup from '../DropdownUserGroup'

import { useInviteUser } from './store'

const UserInviteComponent = () => {
  const { userInvite, onUpdate, onInvite } = useInviteUser()

  const i18n = useI18n()
  const user = useUser()
  const userIsSystemAdmin = useUserIsSystemAdmin()
  const surveyInfo = useSurveyInfo()

  const emails = UserInvite.getEmails(userInvite)
  const validation = UserInvite.getValidation(userInvite)
  const selectedGroupUuid = UserInvite.getGroupUuid(userInvite)
  const groups = Authorizer.getUserGroupsCanAssign({ user, surveyInfo })
  const selectedGroup = groups.find((group) => group.uuid === selectedGroupUuid)
  const systemAdminGroup = groups.find(AuthGroup.isSystemAdminGroup)
  const selectedGroupName = AuthGroup.getName(selectedGroup)
  const isSelectedGroupSystemAdmin = AuthGroup.isEqual(systemAdminGroup)(selectedGroup)

  const onGroupChange = useCallback(
    (group) => {
      onUpdate({ name: UserInvite.keys.groupUuid, value: AuthGroup.getUuid(group) })
    },
    [onUpdate]
  )

  const onSystemAdminChange = useCallback(
    (selected) => {
      onGroupChange(selected ? systemAdminGroup : null)
    },
    [onGroupChange, systemAdminGroup]
  )

  return (
    <div className="user-invite form">
      <FormItem label="common.email_other">
        <InputChipsText
          id={TestId.userInvite.email}
          isInputFieldValueValid={Validator.isEmailValueValid}
          onChange={(value) => onUpdate({ name: UserInvite.keys.emails, value })}
          placeholder="userInviteView.typeEmail"
          selection={emails}
          validation={Validation.getFieldValidation(UserInvite.keys.emails)(validation)}
          textTransformFunction={(value) => value.trim().toLowerCase()}
        />
      </FormItem>
      {userIsSystemAdmin && (
        <FormItem label="auth:authGroups.systemAdmin.label">
          <Checkbox checked={isSelectedGroupSystemAdmin} onChange={onSystemAdminChange} />
        </FormItem>
      )}
      {!isSelectedGroupSystemAdmin && (
        <FormItem label="common.group">
          <DropdownUserGroup
            validation={Validation.getFieldValidation(UserInvite.keys.groupUuid)(validation)}
            groupUuid={selectedGroupUuid}
            onChange={onGroupChange}
            showOnlySurveyGroups
          />
        </FormItem>
      )}
      {!Survey.isPublished(surveyInfo) && (
        <Markdown
          className="user-invite__warning-message"
          source={i18n.t('userInviteView.surveyNotPublishedWarning')}
        />
      )}

      {selectedGroupName && (
        <FormItem label="userInviteView.groupPermissions.label">
          <ul dangerouslySetInnerHTML={{ __html: i18n.t(`userInviteView.groupPermissions.${selectedGroupName}`) }} />
        </FormItem>
      )}

      <FormItem
        info="userInviteView.messageInfo"
        label="userInviteView.messageOptional"
        onInfoClick={() => window.open('https://www.markdownguide.org/basic-syntax', 'markdown-guide', 'noopener')}
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
