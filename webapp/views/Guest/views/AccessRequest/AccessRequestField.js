import React from 'react'
import PropTypes from 'prop-types'
import Select from 'react-select'

import { Objects } from '@openforis/arena-core'

import { Countries } from '@core/Countries'
import * as UserAccessRequest from '@core/user/userAccessRequest'
import * as Validation from '@core/validation/validation'

import { FormItem, Input } from '@webapp/components/form/Input'

import { useI18n } from '@webapp/store/system'
import { SurveyTemplateSelect } from './SurveyTemplateSelect'

export const AccessRequestField = (props) => {
  const { field, onChange, request, validation } = props

  const i18n = useI18n()

  const { name, normalizeFn, required, defaultValue } = field

  const validationFieldName = name.startsWith('props.') ? name.substring(6) : name
  const value = Objects.path(name.split('.'))(request)

  return (
    <FormItem key={name} label={i18n.t(`accessRequestView.fields.${name}`)} required={required}>
      <>
        {name === `${UserAccessRequest.keys.props}.${UserAccessRequest.keysProps.country}` ? (
          <Select
            isClearable
            defaultValue={defaultValue}
            options={Countries.list().map((countryItem) => ({ value: countryItem.code, label: countryItem.name }))}
            onChange={(item) => onChange({ name, value: item?.value })}
          />
        ) : name === `${UserAccessRequest.keys.props}.${UserAccessRequest.keysProps.templateUuid}` ? (
          <SurveyTemplateSelect defaultValue={defaultValue} onChange={(value) => onChange({ name, value })} />
        ) : (
          <Input
            value={value}
            onChange={(val) => {
              onChange({ name, value: normalizeFn ? normalizeFn(val) : val })
            }}
            validation={Validation.getFieldValidation(validationFieldName)(validation)}
          />
        )}
      </>
    </FormItem>
  )
}

AccessRequestField.propTypes = {
  field: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  request: PropTypes.object.isRequired,
  validation: PropTypes.object,
}

AccessRequestField.defaultProps = {
  validation: null,
}
