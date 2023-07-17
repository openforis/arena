import { useEffect, useState } from 'react'

import * as StringUtils from '@core/stringUtils'
import * as Survey from '@core/survey/survey'

import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'

const toOption = (surveyInfo) => {
  if (!surveyInfo) return null

  const surveyId = Survey.getIdSurveyInfo(surveyInfo)
  const surveyName = Survey.getName(surveyInfo)
  const surveyLabel = StringUtils.trim(Survey.getDefaultLabel(surveyInfo))
  const label = `${surveyName}${surveyLabel ? ` - ${surveyLabel}` : ''}`

  return {
    value: surveyId,
    label,
    surveyId,
    surveyName,
    surveyLabel,
    description: StringUtils.trim(Survey.getDefaultDescription(surveyInfo)),
    cycles: Survey.getCycleKeys(surveyInfo),
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
