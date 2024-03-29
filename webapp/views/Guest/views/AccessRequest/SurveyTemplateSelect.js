import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as Languages from '@core/app/languages'

import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'
import { LoadingBar } from '@webapp/components'
import { Dropdown } from '@webapp/components/form'

export const SurveyTemplateSelect = (props) => {
  const { selectedValue, onChange } = props

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

  if (loading) return <LoadingBar />

  const selectedItem = selectedValue ? items?.find((item) => Survey.getUuid(item) === selectedValue) : null

  return (
    <Dropdown
      items={items}
      itemDescription={(item) => {
        const description = Survey.getDefaultDescription(item)
        const languages = Survey.getLanguages(item)
          .map((lang) => Languages.getLanguageLabel(lang))
          .join(', ')
        return [description, `${i18n.t('common.language_plural')}: ${languages}`].filter(Boolean).join('\n\n')
      }}
      itemLabel={(item) => Survey.getDefaultLabel(item) || Survey.getName(item)}
      itemValue={Survey.getUuid}
      onChange={(item) => onChange(Survey.getUuid(item))}
      placeholder={i18n.t('accessRequestView.templateNotSelected')}
      selection={selectedItem}
    />
  )
}

SurveyTemplateSelect.propTypes = {
  selectedValue: PropTypes.string,
  onChange: PropTypes.func.isRequired,
}

SurveyTemplateSelect.defaultValues = {
  selectedValue: null,
}
