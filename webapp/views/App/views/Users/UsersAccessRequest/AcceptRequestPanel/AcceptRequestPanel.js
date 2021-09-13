import React, { useState } from 'react'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'
import * as StringUtils from '@core/stringUtils'
import * as AuthGroup from '@core/auth/authGroup'
import * as Validation from '@core/validation/validation'
import * as UserAccessRequestAccept from '@core/user/userAccessRequestAccept'
import * as UserAccessRequestAcceptValidator from '@core/user/userAccessRequestAcceptValidator'

import { FormItem, Input } from '@webapp/components/form/Input'
import Dropdown from '@webapp/components/form/Dropdown'
import { Button } from '@webapp/components/buttons'

import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'

export const AcceptRequestPanel = (props) => {
  const { userAccessRequest } = props
  const { email, props: requestProps } = userAccessRequest

  const dispatch = useDispatch()
  const i18n = useI18n()

  const [accessRequestAccept, setAccessRequestAccept] = useState({
    email,
    surveyName: requestProps.surveyName,
    surveyLabel: i18n.t('usersAccessRequestView.acceptRequest.surveyLabelInitial'),
    role: AuthGroup.groupNames.surveyManager,
  })

  const { surveyName, surveyLabel, role, validation } = accessRequestAccept

  const roleLabelFunction = (r) => i18n.t(`authGroups.${r}.label`)

  const onUpdate = async ({ field, value }) => {
    const accessRequestAcceptUpdated = { ...accessRequestAccept, [field]: value }
    const validationUpdated = await UserAccessRequestAcceptValidator.validateUserAccessRequestAccept({
      accessRequestAccept: accessRequestAcceptUpdated,
    })
    setAccessRequestAccept({ ...accessRequestAcceptUpdated, validation: validationUpdated })
  }

  const onSubmit = () => {
    if (Validation.isNotValid(validation)) {
      dispatch(NotificationActions.notifyWarning({ key: 'common.formContainsErrorsCannotContinue' }))
    } else {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'usersAccessRequestView.acceptRequest.confirmAcceptRequestAndCreateSurvey',
          params: { email, role: roleLabelFunction(role), surveyName },
          onOk: async () => {},
        })
      )
    }
  }

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
      <FormItem label={i18n.t('usersAccessRequestView.acceptRequest.role')}>
        <Dropdown
          items={UserAccessRequestAccept.requestAcceptRoles}
          itemKey={A.identity}
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
