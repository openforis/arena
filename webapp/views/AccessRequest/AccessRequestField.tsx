import React from 'react'

import { type ArenaValidation, Objects } from '@openforis/arena-core'

import { Countries } from '@core/countries'
import * as UserAccessRequest from '@core/user/userAccessRequest'
import * as Validation from '@core/validation/validation'
import { Dropdown, EmailInput, TextInput } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import ValidationTooltip from '@webapp/components/ValidationTooltip'

import { SurveyTemplateSelect } from './SurveyTemplateSelect'

type AccessRequestInputFieldProps = {
  field: Record<string, any>
  onChange: (...args: any[]) => any
  value: any
}

const CountryField = (props: AccessRequestInputFieldProps) => {
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

const TemplateField = (props: AccessRequestInputFieldProps) => {
  const { field, onChange, value } = props

  const { name, defaultValue } = field

  const selectedValue = value || defaultValue

  return <SurveyTemplateSelect selectedValue={selectedValue} onChange={(value) => onChange({ name, value })} />
}

const EmailField = (props: AccessRequestInputFieldProps) => {
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

const TextField = (props: AccessRequestInputFieldProps) => {
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

type AccessRequestFieldProps = {
  field: Record<string, any>
  onChange: (...args: any[]) => any
  request: Record<string, any>
  validation?: ArenaValidation
}

export const AccessRequestField = (props: AccessRequestFieldProps) => {
  const { field, onChange, request, validation = null } = props

  const { name, required } = field

  let value = Objects.path(name.split('.'))(request)
  if (Objects.isEmpty(value)) {
    value = ''
  }

  const fieldComponent = React.createElement(componentsByFieldName[name] || TextField, { ...props, onChange, value })

  const validationFieldName = name.startsWith('props.') ? name.substring(6) : name
  const fieldValidation = Validation.getFieldValidation(validationFieldName)(validation)

  return (
    <FormItem
      className={`access-request__field--${validationFieldName}`}
      label={`guest:accessRequestView.fields.${name}`}
      required={required}
    >
      <ValidationTooltip validation={fieldValidation}>{fieldComponent}</ValidationTooltip>
    </FormItem>
  )
}
