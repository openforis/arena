import { useEffect, useState } from 'react'

import { Query, Sort } from '@common/model/query'

import { useFetchData } from '@webapp/components/DataQuery/store/actions/useFetchData'

type TotalsState = { data?: Record<string, unknown>[] | null } | null

/**
 * Fetches the grand totals of the measures of an aggregate query (same query without dimensions, so a single row).
 * @param {object} params - Parameters.
 * @param {object} params.query - The aggregate query.
 * @param {boolean} params.enabled - Whether the totals are needed.
 * @returns {object|null} - The totals row (indexed by measure column name) or null if not available.
 */
export const useTotals = ({ query, enabled }: { query: any; enabled: boolean }): Record<string, unknown> | null => {
  const [totals, setTotals] = useState<TotalsState>(null)
  const { fetchData, resetData } = useFetchData({ setData: setTotals })

  const entityDefUuid = Query.getEntityDefUuid(query)
  const measures = Query.getMeasures(query)
  const filter = Query.getFilter(query)
  const filterRecordUuid = Query.getFilterRecordUuid(query)

  useEffect(() => {
    if (enabled) {
      const queryTotals = Query.assocSort(Sort.create())(Query.assocDimensions([])(query))
      fetchData({ query: queryTotals, offset: null, limit: null, randomize: false })
    } else {
      resetData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- totals don't depend on dimensions and sort
  }, [enabled, entityDefUuid, measures, filter, filterRecordUuid, fetchData, resetData])

  return totals?.data?.[0] ?? null
}
