import React from 'react'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import { Countries } from '@core/Countries'
import * as UserAccessRequest from '@core/user/userAccessRequest'
import * as Validation from '@core/validation/validation'

import { FormItem } from '@webapp/components/form/Input'

import { useI18n } from '@webapp/store/system'
import { SurveyTemplateSelect } from './SurveyTemplateSelect'
import { Dropdown, EmailInput, TextInput } from '@webapp/components/form'
import ValidationTooltip from '@webapp/components/validationTooltip'

const CountryField = (props) => {
  const { field, onChange, value } = props

  const { name, defaultValue } = field

  const selectedValue = value || defaultValue

  return (
    <Dropdown
      selection={selectedValue ? Countries.list.find((item) => item.code === selectedValue) : null}
      items={Countries.list}
      itemValue="code"
      itemLabel="name"
      onChange={(item) => onChange({ name, value: item?.code })}
    />
  )
}

const TemplateField = (props) => {
  const { field, onChange, value } = props

  const { name, defaultValue } = field

  const selectedValue = value || defaultValue

  return <SurveyTemplateSelect selectedValue={selectedValue} onChange={(value) => onChange({ name, value })} />
}

const EmailField = (props) => {
  const { field, onChange, value } = props

  const { name } = field

  return (
    <EmailInput
      value={value}
      onChange={(val) => {
        onChange({ name, value: val })
      }}
    />
  )
}

const TextField = (props) => {
  const { field, onChange, value } = props

  const { name, normalizeFn } = field

  return (
    <TextInput
      value={value}
      onChange={(val) => {
        onChange({ name, value: val })
      }}
      textTransformFunction={normalizeFn}
    />
  )
}

const componentsByFieldName = {
  [`${UserAccessRequest.keys.props}.${UserAccessRequest.keysProps.country}`]: CountryField,
  [UserAccessRequest.keys.email]: EmailField,
  [`${UserAccessRequest.keys.props}.${UserAccessRequest.keysProps.templateUuid}`]: TemplateField,
}

export const AccessRequestField = (props) => {
  const { field, request, validation } = props

  const i18n = useI18n()
  const { name, required } = field

  let value = Objects.path(name.split('.'))(request)
  if (Objects.isEmpty(value)) {
    value = ''
  }

  const fieldComponent = React.createElement(componentsByFieldName[name] || TextField, { ...props, value })

  const validationFieldName = name.startsWith('props.') ? name.substring(6) : name
  const fieldValidation = Validation.getFieldValidation(validationFieldName)(validation)

  return (
    <FormItem label={i18n.t(`accessRequestView.fields.${name}`)} required={required}>
      <ValidationTooltip validation={fieldValidation}>{fieldComponent}</ValidationTooltip>
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
