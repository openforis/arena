import React, { useEffect, useState } from 'react'
import Select, { components } from 'react-select'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import Markdown from '@webapp/components/markdown'

import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'
import { LoadingBar } from '@webapp/components'

const OptionWithDescription = (props) => {
  const { data } = props

  const description = (data.description || '').replaceAll('\n', '\n\n') // double line breaks to render breakdown line breaks

  const markdownSource = `**${data.label}**
  
    ${description}`

  return (
    <components.Option {...props}>
      <Markdown source={markdownSource} />
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
    description: `${Survey.getDefaultDescription(item)}
${i18n.t('common.language_plural')}: ${Survey.getLanguages(item)}`,
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
