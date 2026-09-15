import { useEffect, useState } from 'react'

import * as Survey from '@core/survey/survey'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'

export const surveyInfoToLabel = (surveyInfo: object): string => {
  const surveyName = Survey.getName(surveyInfo)
  const surveyLabel = Survey.getDefaultLabel(surveyInfo)
  return surveyLabel ? `${surveyLabel} [${surveyName}]` : surveyName
}

const compareSurveysByLabelOrName = (surveyA: object, surveyB: object): number => {
  const nameA = Survey.getName(surveyA)
  const nameB = Survey.getName(surveyB)
  const labelOrNameA = Survey.getDefaultLabel(surveyA) ?? nameA
  const labelOrNameB = Survey.getDefaultLabel(surveyB) ?? nameB
  const labelOrNameCompare = labelOrNameA.localeCompare(labelOrNameB)
  return labelOrNameCompare !== 0 ? labelOrNameCompare : nameA.localeCompare(nameB)
}

interface UseOtherSurveysListResult {
  surveys: object[]
  surveysLoading: boolean
}

/**
 * Fetches published and draft surveys, excluding the current survey, sorted by label (or name).
 *
 * @returns {UseOtherSurveysListResult} List of other surveys and their loading state.
 */
export const useOtherSurveysList = (): UseOtherSurveysListResult => {
  const currentSurveyId = useSurveyId()
  const [surveys, setSurveys] = useState<object[]>([])
  const [surveysLoading, setSurveysLoading] = useState(true)

  useEffect(() => {
    Promise.all([API.fetchSurveys({ draft: false }), API.fetchSurveys({ draft: true })])
      .then(([surveysPublished, surveysDraft]) => {
        const surveysById = [...surveysPublished, ...surveysDraft].reduce<Record<string, object>>((acc, surveyInfo) => {
          acc[Survey.getIdSurveyInfo(surveyInfo)] = surveyInfo
          return acc
        }, {})
        const surveysFiltered = Object.values(surveysById)
          .filter((surveyInfo) => Survey.getIdSurveyInfo(surveyInfo) !== currentSurveyId)
          .sort(compareSurveysByLabelOrName)

        setSurveys(surveysFiltered)
      })
      .catch(() => setSurveys([]))
      .finally(() => setSurveysLoading(false))
  }, [currentSurveyId])

  return { surveys, surveysLoading }
}
