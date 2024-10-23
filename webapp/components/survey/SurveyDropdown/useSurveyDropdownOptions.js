import { useCallback, useEffect, useState } from 'react'

import * as StringUtils from '@core/stringUtils'
import * as Survey from '@core/survey/survey'

import { SurveyType } from '@webapp/model'
import * as API from '@webapp/service/api'

const toOption = (surveyInfo) => {
  if (!surveyInfo) return null

  const surveyId = Survey.getIdSurveyInfo(surveyInfo)
  const surveyName = Survey.getName(surveyInfo)
  const surveyLabel = StringUtils.trim(Survey.getDefaultLabel(surveyInfo))
  const labelParts = [surveyName]
  if (surveyLabel) {
    labelParts.push(surveyLabel)
  }
  const label = labelParts.join(' - ')

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

export const useSurveyDropdownOptions = ({ type }) => {
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState([])

  const fetchSurveys = useCallback(async () => {
    const template = type === SurveyType.template
    const surveys = await API.fetchSurveys({ draft: false, template })

    // sort surveys and templates by name
    const sortByNameFn = (a, b) => {
      if (a.surveyName < b.surveyName) return -1
      if (a.surveyName > b.surveyName) return 1
      return 0
    }
    const surveyOptions = surveys.map(toOption).sort(sortByNameFn)
    setOptions(surveyOptions)
  }, [type])

  useEffect(() => {
    setLoading(true)
    fetchSurveys().then(() => {
      setLoading(false)
    })
  }, [fetchSurveys])

  return { loading, options }
}
