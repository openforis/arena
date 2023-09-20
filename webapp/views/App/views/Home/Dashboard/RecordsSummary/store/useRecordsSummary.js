import { useState, useEffect } from 'react'

import { useActions } from './actions'

import { timeRanges } from './utils/timeRanges'

const initialState = {
  from: '',
  to: '',
  counts: [],
  userCounts: [],
  userDateCounts: [],
  timeRange: timeRanges._2Weeks,
}

export const useRecordsSummary = () => {
  const [recordsSummary, setRecordsSummary] = useState(initialState)
  const { onGetRecordsSummary } = useActions({
    recordsSummary,
    setRecordsSummary,
  })

  useEffect(onGetRecordsSummary, [recordsSummary.timeRange])

  const onChangeTimeRange = ({ timeRange }) => {
    setRecordsSummary({ ...recordsSummary, timeRange })
  }
  return {
    ...recordsSummary,

    onGetRecordsSummary,
    onChangeTimeRange,
  }
}
