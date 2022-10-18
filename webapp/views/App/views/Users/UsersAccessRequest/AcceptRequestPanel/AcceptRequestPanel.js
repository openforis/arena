import React from 'react'

import * as A from '@core/arena'
import * as StringUtils from '@core/stringUtils'
import * as Validation from '@core/validation/validation'
import * as UserAccessRequestAccept from '@core/user/userAccessRequestAccept'

import { FormItem, Input } from '@webapp/components/form/Input'
import Dropdown from '@webapp/components/form/Dropdown'
import { Button } from '@webapp/components/buttons'

import { useAcceptRequestPanel } from './useAcceptRequestPanel'

export const AcceptRequestPanel = (props) => {
  const { userAccessRequest, onRequestAccepted } = props
  const { email } = userAccessRequest

  const { i18n, roleLabelFunction, onUpdate, onSubmit, accessRequestAccept, validation, templateLabel } =
    useAcceptRequestPanel({
      userAccessRequest,
      onRequestAccepted,
    })

  const { surveyName, surveyLabel, role } = accessRequestAccept

  return (
    <div className="user-access-request-accept form">
      <FormItem label={i18n.t('common.email')}>
        <Input value={email} disabled />
      </FormItem>
      <FormItem label={i18n.t('usersAccessRequestView.acceptRequest.surveyName')}>
        <Input
          value={surveyName}
          validation={Validation.getFieldValidation(UserAccessRequestAccept.keys.surveyName)(validation)}
          onChange={(value) =>
            onUpdate({ field: UserAccessRequestAccept.keys.surveyName, value: StringUtils.normalizeName(value) })
          }
        />
      </FormItem>
      <FormItem label={i18n.t('usersAccessRequestView.acceptRequest.surveyLabel')}>
        <Input
          value={surveyLabel}
          validation={Validation.getFieldValidation(UserAccessRequestAccept.keys.surveyLabel)(validation)}
          onChange={(value) => onUpdate({ field: UserAccessRequestAccept.keys.surveyLabel, value })}
        />
      </FormItem>
      <FormItem label={i18n.t('usersAccessRequestView.acceptRequest.template')}>
        <Input value={templateLabel} disabled />
      </FormItem>
      <FormItem label={i18n.t('usersAccessRequestView.acceptRequest.role')}>
        <Dropdown
          items={UserAccessRequestAccept.requestAcceptRoles}
          itemValue={A.identity}
          itemLabel={roleLabelFunction}
          selection={role}
          onChange={(value) => onUpdate({ field: UserAccessRequestAccept.keys.role, value })}
          readOnlyInput
        />
      </FormItem>

      <div className="button-bar">
        <Button label="usersAccessRequestView.acceptRequest.acceptRequestAndCreateSurvey" onClick={onSubmit} />
      </div>
    </div>
  )
}
