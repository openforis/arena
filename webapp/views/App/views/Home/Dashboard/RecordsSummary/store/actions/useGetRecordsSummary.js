import axios from 'axios'

import * as DateUtils from '@core/dateUtils'

import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'

import { getFromDate } from '../utils'

const formatDate = (date) => DateUtils.formatDateISO(date)

export const useGetRecordsSummary = ({ recordsSummary, setRecordsSummary }) => {
  const surveyId = useSurveyId()
  const surveyCycleKey = useSurveyCycleKey()

  return () => {
    ;(async () => {
      const { timeRange } = recordsSummary
      const now = Date.now()
      const from = formatDate(getFromDate(now, timeRange))
      const to = formatDate(now)
      const { data: counts } = await axios.get(`/api/survey/${surveyId}/records/dashboard/count`, {
        params: { cycle: surveyCycleKey, from, to },
      })
      const { data: userCounts } = await axios.get(`/api/survey/${surveyId}/records/dashboard/count/by-user`, {
        params: { cycle: surveyCycleKey, from, to },
      })
      const { data: userDateCounts } = await axios.get(`/api/survey/${surveyId}/records/dashboard/count/by-user`, {
        params: { cycle: surveyCycleKey, from, to, addDate: true },
      })

      setRecordsSummary({ counts, from, to, timeRange, userCounts, userDateCounts })
    })()
  }
}
