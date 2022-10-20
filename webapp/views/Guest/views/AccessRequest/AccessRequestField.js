import React from 'react'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import { Countries } from '@core/Countries'
import * as UserAccessRequest from '@core/user/userAccessRequest'
import * as Validation from '@core/validation/validation'

import { FormItem, Input } from '@webapp/components/form/Input'

import { useI18n } from '@webapp/store/system'
import { SurveyTemplateSelect } from './SurveyTemplateSelect'
import { Dropdown } from '@webapp/components/form'

export const AccessRequestField = (props) => {
  const { field, onChange, request, validation } = props

  const i18n = useI18n()

  const { name, normalizeFn, required, defaultValue } = field

  const validationFieldName = name.startsWith('props.') ? name.substring(6) : name
  const value = Objects.path(name.split('.'))(request)
  const selectedValue = value || defaultValue

  return (
    <FormItem key={name} label={i18n.t(`accessRequestView.fields.${name}`)} required={required}>
      <>
        {name === `${UserAccessRequest.keys.props}.${UserAccessRequest.keysProps.country}` ? (
          <Dropdown
            selection={selectedValue ? Countries.list.find((item) => item.code === selectedValue) : null}
            items={Countries.list}
            itemValue="code"
            itemLabel="name"
            onChange={(item) => onChange({ name, value: item?.code })}
          />
        ) : name === `${UserAccessRequest.keys.props}.${UserAccessRequest.keysProps.templateUuid}` ? (
          <SurveyTemplateSelect selectedValue={selectedValue} onChange={(value) => onChange({ name, value })} />
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
