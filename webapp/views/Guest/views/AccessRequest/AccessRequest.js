import './AccessRequest.scss'

import React from 'react'

import * as UserAccessRequest from '@core/user/userAccessRequest'

import Markdown from '@webapp/components/markdown'
import { ReCaptcha } from '@webapp/components/ReCaptcha'

import { useI18n } from '@webapp/store/system'

import { useAccessRequest } from './useAccessRequest'
import { AccessRequestField } from './AccessRequestField'

const AccessRequest = () => {
  const i18n = useI18n()
  const { request, requestSentSuccessfully, onFieldValueChange, onSubmit, reCaptchaRef, validation } =
    useAccessRequest()

  if (requestSentSuccessfully) {
    return (
      <div className="access-request">
        <div className="title">{i18n.t('accessRequestView.requestSent')}</div>
        <div className="content">
          <Markdown
            className="request-sent-message"
            source={i18n.t('accessRequestView.requestSentMessage', { email: request.email })}
          />
        </div>
      </div>
    )
  }
  return (
    <div className="access-request">
      <div className="title">{i18n.t('accessRequestView.title')}</div>
      <div className="content">
        <div className="introduction">
          <Markdown source={i18n.t('accessRequestView.introduction')} />
        </div>
        <form onSubmit={(event) => event.preventDefault()}>
          {UserAccessRequest.editableFields.map((field) => (
            <AccessRequestField
              key={field.name}
              field={field}
              onChange={onFieldValueChange}
              request={request}
              validation={validation}
            />
          ))}
          <div className="form-label">* = {i18n.t('common.requiredField')}</div>
          <div className="recaptcha-wrapper">
            <ReCaptcha ref={reCaptchaRef} />
          </div>
          <div className="guest__buttons">
            <button type="submit" className="btn" onClick={onSubmit}>
              {i18n.t('accessRequestView.sendRequest')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AccessRequest
