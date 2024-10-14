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

  const { roleLabelFunction, onUpdate, onSubmit, accessRequestAccept, validation, templateLabel } =
    useAcceptRequestPanel({
      userAccessRequest,
      onRequestAccepted,
    })

  const { surveyName, surveyLabel, role } = accessRequestAccept

  return (
    <div className="user-access-request-accept form">
      <FormItem label="common.email">
        <Input value={email} disabled />
      </FormItem>
      <FormItem label="usersAccessRequestView.acceptRequest.surveyName">
        <Input
          value={surveyName}
          validation={Validation.getFieldValidation(UserAccessRequestAccept.keys.surveyName)(validation)}
          onChange={(value) =>
            onUpdate({ field: UserAccessRequestAccept.keys.surveyName, value: StringUtils.normalizeName(value) })
          }
        />
      </FormItem>
      <FormItem label="usersAccessRequestView.acceptRequest.surveyLabel">
        <Input
          value={surveyLabel}
          validation={Validation.getFieldValidation(UserAccessRequestAccept.keys.surveyLabel)(validation)}
          onChange={(value) => onUpdate({ field: UserAccessRequestAccept.keys.surveyLabel, value })}
        />
      </FormItem>
      <FormItem label="usersAccessRequestView.acceptRequest.template">
        <Input value={templateLabel} disabled />
      </FormItem>
      <FormItem label="usersAccessRequestView.acceptRequest.role">
        <Dropdown
          items={UserAccessRequestAccept.requestAcceptRoles}
          itemValue={A.identity}
          itemLabel={roleLabelFunction}
          onChange={(value) => onUpdate({ field: UserAccessRequestAccept.keys.role, value })}
          searchable={false}
          selection={role}
        />
      </FormItem>

      <div className="button-bar">
        <Button
          className="btn-primary"
          label="usersAccessRequestView.acceptRequest.acceptRequestAndCreateSurvey"
          onClick={onSubmit}
        />
      </div>
    </div>
  )
}
