import React, { useState } from 'react'

import * as A from '@core/arena'
import * as AuthGroup from '@core/auth/authGroup'
import * as Validation from '@core/validation/validation'

import { FormItem, Input } from '@webapp/components/form/Input'
import Dropdown from '@webapp/components/form/Dropdown'
import { Button } from '@webapp/components/buttons'

import { useI18n } from '@webapp/store/system'

export const AcceptRequestPanel = (props) => {
  const { userAccessRequest } = props
  const { email, props: requestProps } = userAccessRequest

  const i18n = useI18n()

  const [accessRequestAccept, setAccessRequestAccept] = useState({
    email,
    surveyName: requestProps.surveyName,
    surveyLabel: i18n.t('usersAccessRequestView.acceptRequest.surveyLabelInitial'),
    role: AuthGroup.groupNames.surveyManager,
  })

  const { surveyName, surveyLabel, role } = accessRequestAccept
  const validation = Validation.getValidation(accessRequestAccept)

  const roles = [AuthGroup.groupNames.systemAdmin, AuthGroup.groupNames.surveyManager, AuthGroup.groupNames.surveyAdmin]

  const onUpdate = ({ field, value }) => {
    const accessRequestAcceptUpdated = { ...accessRequestAccept, [field]: value }
    setAccessRequestAccept(accessRequestAcceptUpdated)
  }

  const onSubmit = () => {}

  return (
    <div className="user-access-request-accept form">
      <FormItem label={i18n.t('common.email')}>
        <Input value={email} disabled />
      </FormItem>
      <FormItem label={i18n.t('usersAccessRequestView.acceptRequest.surveyName')}>
        <Input
          value={surveyName}
          validation={Validation.getFieldValidation('surveyName')(validation)}
          onChange={(value) => onUpdate({ field: 'surveyName', value: StringUtils.normalizeName(value) })}
        />
      </FormItem>
      <FormItem label={i18n.t('usersAccessRequestView.acceptRequest.surveyLabel')}>
        <Input
          placeholder={i18n.t('usersAccessRequestView.acceptRequest.surveyLabel')}
          value={surveyLabel}
          validation={Validation.getFieldValidation('surveyLabel')(validation)}
          onChange={(value) => onUpdate({ field: 'surveyLabel', value })}
        />
      </FormItem>
      <FormItem label={i18n.t('usersAccessRequestView.acceptRequest.role')}>
        <Dropdown
          items={roles}
          itemKey={A.identity}
          itemLabel={(item) => i18n.t(`authGroups.${item}.label_plural`)}
          selection={role}
          onChange={(value) => onUpdate({ field: 'role', value })}
          readOnlyInput
        />
      </FormItem>

      <div className="button-bar">
        <Button label="usersAccessRequestView.acceptRequest.acceptRequestAndCreateSurvey" onClick={onSubmit} />
      </div>
    </div>
  )
}
