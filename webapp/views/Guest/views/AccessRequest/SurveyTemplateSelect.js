import './SurveyTemplateSelect.scss'

import React, { useEffect, useState } from 'react'
import Select, { components } from 'react-select'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'
import { LoadingBar } from '@webapp/components'

const OptionWithDescription = (props) => {
  const { data } = props

  const { label, description: descriptionProp } = data
  const description = descriptionProp || ''

  return (
    <components.Option {...props}>
      <div className="select-option">
        <span className="select-option__label">{label}</span>
        <span className="select-option__description">{description}</span>
      </div>
    </components.Option>
  )
}

export const SurveyTemplateSelect = (props) => {
  const { defaultValue, onChange } = props

  const [state, setState] = useState({ loading: true, items: null })
  const { loading, items } = state

  const i18n = useI18n()

  useEffect(() => {
    const loadItems = async () => {
      const fetchedItems = await API.fetchSurveyTemplatesPublished()
      setState({ loading: false, items: fetchedItems })
    }
    loadItems()
  }, [])

  const options = items?.map((item) => ({
    value: Survey.getUuid(item),
    label: Survey.getDefaultLabel(item) || Survey.getName(item),
    description: [
      Survey.getDefaultDescription(item),
      `${i18n.t('common.language_plural')}: ${Survey.getLanguages(item)}`,
    ]
      .filter(Boolean)
      .join('\n\n'), // separate Languages from description only if description is not empty
  }))

  if (loading) return <LoadingBar />

  return (
    <Select
      components={{ Option: OptionWithDescription }}
      isClearable
      defaultValue={defaultValue}
      options={options}
      onChange={(item) => onChange(item?.value)}
      placeholder={i18n.t('accessRequestView.templateNotSelected')}
    />
  )
}

SurveyTemplateSelect.propTypes = {
  defaultValue: PropTypes.string,
  onChange: PropTypes.func.isRequired,
}

SurveyTemplateSelect.defaultValues = {
  defaultValue: null,
}
