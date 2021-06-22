import './AccessRequest.scss'

import React from 'react'
import * as R from 'ramda'

import * as UserAccessRequest from '@core/user/userAccessRequest'
import * as Validation from '@core/validation/validation'

import { FormItem, Input } from '@webapp/components/form/Input'
import { ReCaptcha } from '@webapp/components/ReCaptcha'

import { useI18n } from '@webapp/store/system'
import { useAccessRequest } from './useAccessRequest'

const AccessRequest = () => {
  const i18n = useI18n()
  const { request, validation, onFieldValueChange, onSubmit, reCaptchaRef } = useAccessRequest()

  return (
    <div className="access-request">
      <div className="title">{i18n.t('accessRequestView.title')}</div>
      <div className="introduction">{i18n.t('accessRequestView.introduction')}</div>
      <form onSubmit={(event) => event.preventDefault()}>
        {UserAccessRequest.editableFields.map(({ name }) => {
          const validationFieldName = name.startsWith('props.') ? name.substring(6) : name
          return (
            <FormItem key={name} label={i18n.t(`accessRequestView.fields.${name}`)}>
              <Input
                value={R.path(name.split('.'))(request)}
                onChange={(value) => onFieldValueChange({ name, value })}
                validation={Validation.getFieldValidation(validationFieldName)(validation)}
              />
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
  )
}

export default AccessRequest
