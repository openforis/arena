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
  const { request, validation, onFieldValueChange, onSubmit, reCaptchaRef } = useAccessRequest()

  return (
    <div className="access-request">
      <div className="title">{i18n.t('accessRequestView.title')}</div>
      <div className="content">
        <div className="introduction">
          <Markdown source={i18n.t('accessRequestView.introduction')} />
        </div>
        <form onSubmit={(event) => event.preventDefault()}>
          {UserAccessRequest.editableFields.map(({ items, name, normalizeFn, required, defaultValue }) => {
            const validationFieldName = name.startsWith('props.') ? name.substring(6) : name
            const value = R.path(name.split('.'))(request)
            const dropdownItems = items?.map((item) => ({
              key: item,
              value: i18n.t(`accessRequestView.fields.${name}_value.${item}`),
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
