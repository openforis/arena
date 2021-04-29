import { useEffect, useState } from 'react'

import * as Survey from '@core/survey/survey'

import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'

const toOption = (surveyInfo) => {
  if (!surveyInfo) return null

  return {
    label: Survey.getName(surveyInfo),
    value: Survey.getIdSurveyInfo(surveyInfo),
  }
}

export const useOptions = () => {
  const [options, setOptions] = useState([])

  const i18n = useI18n()

  useEffect(() => {
    ;(async () => {
      const [surveys, templates] = await Promise.all([API.fetchSurveys(), API.fetchSurveys({ template: true })])

      setOptions([
        {
          label: i18n.t('homeView.surveyCreate.template', { count: templates.length }),
          options: templates.map(toOption),
        },
        { label: i18n.t('homeView.surveyCreate.survey', { count: templates.length }), options: surveys.map(toOption) },
      ])
    })()
  }, [])

  return { options }
}
