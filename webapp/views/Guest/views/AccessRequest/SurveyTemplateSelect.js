import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'
import { LoadingBar } from '@webapp/components'
import { Dropdown } from '@webapp/components/form'

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

  if (loading) return <LoadingBar />

  const selectedItem = defaultValue ? items?.find((item) => Survey.getUuid(item) === defaultValue) : null

  return (
    <Dropdown
      value={selectedItem}
      items={items}
      itemDescription={
        (item) =>
          [Survey.getDefaultDescription(item), `${i18n.t('common.language_plural')}: ${Survey.getLanguages(item)}`]
            .filter(Boolean)
            .join('\n\n') // separate Languages from description only if description is not empty
      }
      itemLabel={(item) => Survey.getDefaultLabel(item) || Survey.getName(item)}
      itemValue={Survey.getUuid}
      onChange={(item) => onChange(Survey.getUuid(item))}
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
