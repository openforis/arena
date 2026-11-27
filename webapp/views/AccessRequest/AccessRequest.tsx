import './AccessRequest.scss'

import { Link, useNavigate } from 'react-router'

import * as ProcessUtils from '@core/processUtils'
import * as UserAccessRequest from '@core/user/userAccessRequest'
import { appModuleUri, guestModules } from '@webapp/app/appModules'
import { Button } from '@webapp/components'
import { GuestViewHeader } from '@webapp/components/guest/GuestViewHeader'
import Markdown from '@webapp/components/Markdown'
import { ReCaptcha } from '@webapp/components/ReCaptcha'
import { useI18n } from '@webapp/store/system'

import { AccessRequestField } from './AccessRequestField'
import { getAccessRequestTexts } from './accessRequestTexts'
import { useAccessRequest } from './useAccessRequest'

const { keys, keysProps } = UserAccessRequest

// fields in the order they are shown (and focused with Tab)
const formFieldNamesInOrder = [
  `${keys.props}.${keysProps.firstName}`,
  `${keys.props}.${keysProps.lastName}`,
  keys.email,
  `${keys.props}.${keysProps.institution}`,
  `${keys.props}.${keysProps.country}`,
  `${keys.props}.${keysProps.templateUuid}`,
  `${keys.props}.${keysProps.purpose}`,
  `${keys.props}.${keysProps.surveyName}`,
]
const formFields = formFieldNamesInOrder.map((name) =>
  UserAccessRequest.editableFields.find((field) => field.name === name)
)

type AccessRequestSentProps = {
  email: string
}

const AccessRequestSent = ({ email }: AccessRequestSentProps) => {
  const i18n = useI18n()
  const navigate = useNavigate()
  const texts = getAccessRequestTexts()
  return (
    <div className="access-request">
      <GuestViewHeader icon="check" iconVariant="success" title={texts.sent} />
      <Markdown
        className="access-request__sent-message"
        source={i18n.t(texts.sentMessage, {
          email,
          senderEmail: ProcessUtils.ENV.emailFromResolved,
        })}
      />
      <Button
        className="guest__submit"
        label="guest:loginView.backToLogin"
        onClick={() => navigate(appModuleUri(guestModules.login))}
        variant="outlined"
      />
    </div>
  )
}

const AccessRequest = () => {
  const i18n = useI18n()
  const {
    isFieldValidationVisible,
    request,
    requestSentSuccessfully,
    onFieldValueChange,
    onSubmit,
    reCaptchaRef,
    validation,
  } = useAccessRequest()
  const texts = getAccessRequestTexts()

  if (requestSentSuccessfully) {
    return <AccessRequestSent email={request.email} />
  }
  return (
    <div className="access-request">
      <GuestViewHeader description={texts.introduction} title={texts.title} />
      <form className="access-request__form" onSubmit={(event) => event.preventDefault()}>
        {formFields.map((field) => (
          <AccessRequestField
            key={field.name}
            field={field}
            onChange={onFieldValueChange}
            request={request}
            validation={isFieldValidationVisible(field.name) ? validation : null}
          />
        ))}
        <div className="access-request__buttons">
          <div className="access-request__notes">
            <span>{`* = ${i18n.t('common.requiredField')}`}</span>
            <span>
              {i18n.t('guest:accessRequestView.alreadyHaveAnAccount')}{' '}
              <Link className="guest__link" to={appModuleUri(guestModules.login)}>
                {i18n.t('guest:loginView.login')}
              </Link>
            </span>
          </div>
          <div className="access-request__submit">
            <ReCaptcha ref={reCaptchaRef} />
            <Button iconName={texts.submitIcon} iconSize={14} label={texts.submit} onClick={onSubmit} type="submit" />
          </div>
        </div>
      </form>
    </div>
  )
}

export default AccessRequest
