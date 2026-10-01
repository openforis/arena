import { createContext, useContext } from 'react'

import type { UserCountRow } from './utils/filterActiveContributors'

type RecordsCountRow = { count?: string | number }

export type RecordsSummaryState = {
  from: string
  to: string
  counts: RecordsCountRow[]
  userCounts: UserCountRow[]
  userDateCounts: unknown[]
  dataEntry: number
  dataCleansing: number
  dataAnalysis: number
  timeRange: string
}

export type RecordsSummaryContextValue = RecordsSummaryState & {
  onGetRecordsSummary: () => Promise<void>
  onChangeTimeRange: (params: { timeRange: string }) => void
}

export const RecordsSummaryContext = createContext<RecordsSummaryContextValue | null>(null)

/**
 * Reads the records summary from the closest provider.
 *
 * @returns {RecordsSummaryContextValue} The records summary state and actions.
 */
export const useRecordsSummaryContext = (): RecordsSummaryContextValue => {
  const value = useContext(RecordsSummaryContext)
  if (!value) {
    throw new Error('useRecordsSummaryContext must be used inside a RecordsSummaryContext.Provider')
  }
  return value
}
