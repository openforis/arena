import { useState, useEffect, useCallback } from 'react'

import * as Survey from '@core/survey/survey'

import { useSurveyInfo } from '@webapp/store/survey'

import { timeRanges } from './utils/timeRanges'
import { useActions } from './actions'

const initialState = {
  from: '',
  to: '',
  counts: [],
  userCounts: [],
  userDateCounts: [],
  dataEntry: 0,
  dataCleansing: 0,
  timeRange: timeRanges._1Year,
}

export const useRecordsSummary = () => {
  const surveyInfo = useSurveyInfo()

  const canHaveRecords = Survey.canHaveRecords(surveyInfo)

  const [recordsSummary, setRecordsSummary] = useState(initialState)
  const { onGetRecordsSummary } = useActions({
    recordsSummary,
    setRecordsSummary,
  })

  const { timeRange } = recordsSummary

  useEffect(() => {
    onGetRecordsSummary()
  }, [onGetRecordsSummary, timeRange])

  const onChangeTimeRange = useCallback(
    ({ timeRange }) => {
      setRecordsSummary({ ...recordsSummary, timeRange })
    },
    [recordsSummary]
  )

  useEffect(() => {
    if (!canHaveRecords) {
      setRecordsSummary(initialState)
    }
  }, [canHaveRecords])

  return {
    ...recordsSummary,

    onGetRecordsSummary,
    onChangeTimeRange,
  }
}
