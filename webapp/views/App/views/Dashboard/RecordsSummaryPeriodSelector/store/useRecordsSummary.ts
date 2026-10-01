import { useState, useEffect, useCallback } from 'react'

import * as Survey from '@core/survey/survey'

import { useSurveyInfo } from '@webapp/store/survey'

import type { RecordsSummaryContextValue, RecordsSummaryState } from '../../RecordsSummaryContext'
import { timeRanges } from './utils/timeRanges'
import { useActions } from './actions'

const initialState: RecordsSummaryState = {
  from: '',
  to: '',
  counts: [],
  userCounts: [],
  dataEntry: 0,
  dataCleansing: 0,
  dataAnalysis: 0,
  timeRange: timeRanges._1Year,
}

export const useRecordsSummary = (): RecordsSummaryContextValue => {
  const surveyInfo = useSurveyInfo()

  const canHaveRecords = Survey.canHaveRecords(surveyInfo)

  const [recordsSummary, setRecordsSummary] = useState<RecordsSummaryState>(initialState)
  const { onGetRecordsSummary } = useActions({
    recordsSummary,
    setRecordsSummary,
  })

  const { timeRange } = recordsSummary

  useEffect(() => {
    onGetRecordsSummary()
  }, [onGetRecordsSummary, timeRange])

  const onChangeTimeRange = useCallback(
    ({ timeRange }: { timeRange: string }) => {
      setRecordsSummary({ ...recordsSummary, timeRange })
    },
    [recordsSummary]
  )

  return {
    // surveys that can't have records always expose the empty summary
    ...(canHaveRecords ? recordsSummary : initialState),

    onGetRecordsSummary,
    onChangeTimeRange,
  }
}
