import axios from 'axios'

import * as DateUtils from '@core/dateUtils'

import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'

import { getFromDate } from '../utils'

const formatDate = (date) => DateUtils.formatDateISO(date)

export const useGetRecordsSummary = ({ recordsSummary, setRecordsSummary }) => {
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()

  return () => {
    if (surveyId) {
      ;(async () => {
        const { timeRange } = recordsSummary
        const now = Date.now()
        const from = formatDate(getFromDate(now, timeRange))
        const to = formatDate(now)
        const { data: counts } = await axios.get(`/api/survey/${surveyId}/records/dashboard/count`, {
          params: { cycle, from, to, countType: 'default' },
        })
        const { data: userCounts } = await axios.get(`/api/survey/${surveyId}/records/dashboard/count`, {
          params: { cycle, from, to, countType: 'user' },
        })
        const { data: userDateCounts } = await axios.get(`/api/survey/${surveyId}/records/dashboard/count`, {
          params: { cycle, from, to, addDate: true, countType: 'user' },
        })
        const { data: countsByStep } = await axios.get(`/api/survey/${surveyId}/records/dashboard/count`, {
          params: { cycle, countType: 'step' },
        })

        const [dataEntry, dataCleansing, dataAnalysis] = Object.values(countsByStep)

        setRecordsSummary({
          counts,
          from,
          to,
          timeRange,
          userCounts,
          userDateCounts,
          dataEntry,
          dataCleansing,
          dataAnalysis,
        })
      })()
    }
  }
}
