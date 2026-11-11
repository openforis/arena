import './AcceptRequestPanel.scss'

import classNames from 'classnames'

import { Countries } from '@core/Countries'
import * as DateUtils from '@core/dateUtils'
import * as StringUtils from '@core/stringUtils'
import * as Validation from '@core/validation/validation'
import * as UserAccessRequest from '@core/user/userAccessRequest'
import * as UserAccessRequestAccept from '@core/user/userAccessRequestAccept'

import { FormItem, Input } from '@webapp/components/form/Input'
import { Button } from '@webapp/components/buttons'
import { useIsMobile } from '@webapp/components/hooks/useIsMobile'
import { useI18n } from '@webapp/store/system'

import { useAcceptRequestPanel } from './useAcceptRequestPanel'

type AcceptRequestPanelProps = {
  userAccessRequest: UserAccessRequest.UserAccessRequest
  onRequestAccepted: () => void
}

export const AcceptRequestPanel = ({ userAccessRequest, onRequestAccepted }: AcceptRequestPanelProps) => {
  const { email, props: requestProps } = userAccessRequest
  const { firstName, lastName, institution, country, purpose } = requestProps

  const { onUpdate, onSubmit, accessRequestAccept, validation, templateLabel } = useAcceptRequestPanel({
    userAccessRequest,
    onRequestAccepted,
  })

  const { surveyName } = accessRequestAccept

  const i18n = useI18n()
  const isMobile = useIsMobile()

  return (
    <div className={classNames('user-access-request-accept form', { mobile: isMobile })}>
      <div className="section-title">{i18n.t('usersAccessRequestView.acceptRequest.requestDetails')}</div>
      <FormItem label="common.email">
        <Input value={email} disabled />
      </FormItem>
      <FormItem label={`guest:accessRequestView.fields.props.${UserAccessRequest.keysProps.firstName}`}>
        <Input value={firstName} disabled />
      </FormItem>
      <FormItem label={`guest:accessRequestView.fields.props.${UserAccessRequest.keysProps.lastName}`}>
        <Input value={lastName} disabled />
      </FormItem>
      <FormItem label={`guest:accessRequestView.fields.props.${UserAccessRequest.keysProps.institution}`}>
        <Input value={institution} disabled />
      </FormItem>
      <FormItem label={`guest:accessRequestView.fields.props.${UserAccessRequest.keysProps.country}`}>
        <Input value={country ? Countries.getCountryName({ code: country }) : ''} disabled />
      </FormItem>
      <FormItem label={`guest:accessRequestView.fields.props.${UserAccessRequest.keysProps.purpose}`}>
        <Input value={purpose} inputType="textarea" textAreaRows={4} readOnly />
      </FormItem>
      <FormItem label="usersView:accessRequestDate">
        <Input value={DateUtils.formatDateTimeDisplay(UserAccessRequest.getDateCreated(userAccessRequest))} disabled />
      </FormItem>

      <div className="section-title">{i18n.t('usersAccessRequestView.acceptRequest.newSurvey')}</div>
      <FormItem label="usersAccessRequestView.acceptRequest.surveyName">
        <Input
          value={surveyName}
          validation={Validation.getFieldValidation(UserAccessRequestAccept.keys.surveyName)(validation)}
          onChange={(value) =>
            onUpdate({ field: UserAccessRequestAccept.keys.surveyName, value: StringUtils.normalizeName(value) })
          }
        />
      </FormItem>
      <FormItem label="usersAccessRequestView.acceptRequest.template">
        <Input value={templateLabel} disabled />
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
