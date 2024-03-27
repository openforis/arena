import { useEffect, useState } from 'react'

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
  const [recordsSummary, setRecordsSummary] = useState(initialState)
  const { onGetRecordsSummary } = useActions({
    recordsSummary,
    setRecordsSummary,
  })

  const { timeRange } = recordsSummary

  useEffect(() => {
    onGetRecordsSummary()
  }, [onGetRecordsSummary, timeRange])

  const onChangeTimeRange = ({ timeRange }) => {
    setRecordsSummary({ ...recordsSummary, timeRange })
  }
  return {
    ...recordsSummary,

    onGetRecordsSummary,
    onChangeTimeRange,
  }
}
