import axios from 'axios'
import { useCallback } from 'react'

import * as DateUtils from '@core/dateUtils'

import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'

import { getFromDate } from '../utils'

const formatDate = (date) => DateUtils.formatDateISO(date)

export const useGetRecordsSummary = ({ recordsSummary, setRecordsSummary }) => {
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const { timeRange } = recordsSummary

  return useCallback(async () => {
    if (!surveyId) return

    const now = Date.now()
    const from = formatDate(getFromDate(now, timeRange))
    const to = formatDate(now)
    const countUrl = `/api/survey/${surveyId}/records/dashboard/count`

    const [{ data: counts }, { data: userCounts }, { data: countsByStep }] = await Promise.all([
      axios.get(countUrl, { params: { cycle, from, to, countType: 'default' } }),
      axios.get(countUrl, { params: { cycle, from, to, countType: 'user' } }),
      axios.get(countUrl, { params: { cycle, countType: 'step' } }),
    ])

    const [dataEntry, dataCleansing, dataAnalysis] = Object.values(countsByStep)

    setRecordsSummary({
      counts,
      from,
      to,
      timeRange,
      userCounts,
      dataEntry,
      dataCleansing,
      dataAnalysis,
    })
  }, [cycle, setRecordsSummary, surveyId, timeRange])
}
