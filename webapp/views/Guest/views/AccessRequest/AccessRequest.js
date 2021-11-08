import './AccessRequest.scss'

import React from 'react'
import * as R from 'ramda'

import * as UserAccessRequest from '@core/user/userAccessRequest'
import * as Validation from '@core/validation/validation'

import { FormItem, Input } from '@webapp/components/form/Input'
import Dropdown from '@webapp/components/form/Dropdown'
import Markdown from '@webapp/components/markdown'
import { ReCaptcha } from '@webapp/components/ReCaptcha'

import { useI18n } from '@webapp/store/system'
import { useAccessRequest } from './useAccessRequest'

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
          {UserAccessRequest.editableFields.map((field) => {
            const { name, normalizeFn, required, defaultValue } = field
            const validationFieldName = name.startsWith('props.') ? name.substring(6) : name
            const value = R.path(name.split('.'))(request)
            const items = UserAccessRequest.getFieldItems({ field })
            const dropdownItems = items?.map((item) => ({
              key: UserAccessRequest.getFieldItemKey({ field, item }),
              value:
                UserAccessRequest.getFieldItemLabel({ field, item }) ||
                i18n.t(`accessRequestView.fields.${name}_value.${item}`),
            }))
            const dropdownSelection = dropdownItems?.find((item) => item.key === (value || defaultValue))

            return (
              <FormItem key={name} label={i18n.t(`accessRequestView.fields.${name}`)} required={required}>
                {items ? (
                  <Dropdown
                    selection={dropdownSelection}
                    items={dropdownItems}
                    onChange={(item) => onFieldValueChange({ name, value: item.key })}
                  />
                ) : (
                  <Input
                    value={value}
                    onChange={(val) => {
                      onFieldValueChange({ name, value: normalizeFn ? normalizeFn(val) : val })
                    }}
                    validation={Validation.getFieldValidation(validationFieldName)(validation)}
                  />
                )}
              </FormItem>
            )
          })}
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
