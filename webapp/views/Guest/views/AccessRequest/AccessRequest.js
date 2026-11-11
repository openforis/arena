import './AccessRequest.scss'

import { Link, useNavigate } from 'react-router'
import PropTypes from 'prop-types'

import * as ProcessUtils from '@core/processUtils'
import * as UserAccessRequest from '@core/user/userAccessRequest'

import { appModuleUri, guestModules } from '@webapp/app/appModules'
import { Button } from '@webapp/components'
import Markdown from '@webapp/components/markdown'
import { ReCaptcha } from '@webapp/components/ReCaptcha'
import { GuestViewHeader } from '@webapp/views/Guest/components/GuestViewHeader'

import { useI18n } from '@webapp/store/system'

import { useAccessRequest } from './useAccessRequest'
import { AccessRequestField } from './AccessRequestField'

const AccessRequestSent = ({ email }) => {
  const i18n = useI18n()
  const navigate = useNavigate()
  return (
    <div className="access-request">
      <GuestViewHeader icon="icon-checkmark" iconVariant="success" title="guest:accessRequestView.requestSent" />
      <Markdown
        className="access-request__sent-message"
        source={i18n.t('guest:accessRequestView.requestSentMessage', {
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

AccessRequestSent.propTypes = {
  email: PropTypes.string.isRequired,
}

const AccessRequest = () => {
  const i18n = useI18n()
  const { request, requestSentSuccessfully, onFieldValueChange, onSubmit, reCaptchaRef, validation } =
    useAccessRequest()

  if (requestSentSuccessfully) {
    return <AccessRequestSent email={request.email} />
  }
  return (
    <div className="access-request">
      <GuestViewHeader description="guest:accessRequestView.introduction" title="guest:accessRequestView.title" />
      <form className="access-request__form" onSubmit={(event) => event.preventDefault()}>
        {UserAccessRequest.editableFields.map((field) => (
          <AccessRequestField
            key={field.name}
            field={field}
            onChange={onFieldValueChange}
            request={request}
            validation={validation}
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
            <Button
              iconClassName="icon-envelop icon-12px"
              label="guest:accessRequestView.sendRequest"
              onClick={onSubmit}
              type="submit"
            />
          </div>
        </div>
      </form>
    </div>
  )
}

export default AccessRequest
