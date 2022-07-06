import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import { Countries } from '@core/Countries'
import * as Survey from '@core/survey/survey'
import * as UserAccessRequest from '@core/user/userAccessRequest'
import * as Validation from '@core/validation/validation'

import { Dropdown } from '@webapp/components/form'
import { FormItem, Input } from '@webapp/components/form/Input'

import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'
import { LoadingBar } from '@webapp/components'

const itemsFetchFunctionByFieldName = {
  [`${UserAccessRequest.keys.props}.${UserAccessRequest.keysProps.country}`]: () => Countries.list(),
  [`${UserAccessRequest.keys.props}.${UserAccessRequest.keysProps.template}`]: async () =>
    API.fetchSurveyTemplatesPublished(),
}

const toDropdownItemsFunctionByFieldName = {
  [`${UserAccessRequest.keys.props}.${UserAccessRequest.keysProps.country}`]: (item) => ({
    key: item.code,
    value: item.name,
  }),
  [`${UserAccessRequest.keys.props}.${UserAccessRequest.keysProps.template}`]: (item) => ({
    key: Survey.getUuid(item),
    value: Survey.getLabel(item, Survey.getDefaultLanguage(item)),
  }),
}

export const AccessRequestField = (props) => {
  const { field, onChange, request, validation } = props

  const i18n = useI18n()

  const { name, normalizeFn, required, defaultValue } = field

  const [state, setState] = useState({ loading: true, items: null })

  useEffect(() => {
    const loadItems = async () => {
      const fetchFunction = itemsFetchFunctionByFieldName[name]
      const fetchedItems = fetchFunction ? await fetchFunction() : null
      setState({ loading: false, items: fetchedItems })
    }
    loadItems()
  }, [name])

  const { loading, items } = state

  const validationFieldName = name.startsWith('props.') ? name.substring(6) : name
  const value = Objects.path(name.split('.'))(request)
  const dropdownItems = items?.map((item) => {
    const toDropdownItemFunction = toDropdownItemsFunctionByFieldName[name]
    return toDropdownItemFunction ? toDropdownItemFunction(item) : item
  })
  const dropdownSelection = dropdownItems?.find((item) => item.key === (value || defaultValue))

  return (
    <FormItem key={name} label={i18n.t(`accessRequestView.fields.${name}`)} required={required}>
      <>
        {loading && <LoadingBar />}
        {!loading && items && (
          <Dropdown
            selection={dropdownSelection}
            items={dropdownItems}
            onChange={(item) => onChange({ name, value: item?.key })}
          />
        )}
        {!loading && !items && (
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
