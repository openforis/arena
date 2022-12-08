import { useEffect, useState } from 'react'

import * as Survey from '@core/survey/survey'

import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'

const toOption = (surveyInfo) => {
  if (!surveyInfo) return null

  return {
    name: Survey.getName(surveyInfo),
    label: Survey.getDefaultLabel(surveyInfo),
    description: Survey.getDefaultDescription(surveyInfo),
    value: Survey.getIdSurveyInfo(surveyInfo),
  }
}

export const useSurveyDropdownOptions = () => {
  const [options, setOptions] = useState([])

  const i18n = useI18n()

  useEffect(() => {
    ;(async () => {
      const [surveys, templates] = await Promise.all([
        API.fetchSurveys({ draft: false }),
        API.fetchSurveys({ draft: false, template: true }),
      ])

      const surveyOptions = surveys.map(toOption)
      const templateOptions = templates.map(toOption)

      // sort surveys and templates by name
      const sortByNameFn = (a, b) => {
        if (a.name < b.name) return -1
        if (a.name > b.name) return 1
        return 0
      }
      surveyOptions.sort(sortByNameFn)
      templateOptions.sort(sortByNameFn)

      setOptions([
        {
          label: i18n.t('homeView.surveyCreate.template', { count: templateOptions.length }),
          options: templateOptions,
        },
        { label: i18n.t('homeView.surveyCreate.survey', { count: surveyOptions.length }), options: surveyOptions },
      ])
    })()
  }, [])

  return { options }
}
