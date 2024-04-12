import { useEffect, useState } from 'react'

import * as A from '@core/arena'
import { Query } from '@common/model/query'

import { useOnUpdate } from '@webapp/components/hooks'

import { useActions } from './actions'

const defaults = {
  [Query.displayTypes.table]: { limit: 15, offset: 0 },
}

export const useDataQuery = ({ query, limitData = true }) => {
  const defaultValues = defaults[Query.getDisplayType(query)]
  const initialLimit = limitData ? defaultValues.limit : null
  const [data, setData] = useState(null)
  const [count, setCount] = useState(null)
  const [limit, setLimit] = useState(initialLimit)
  const [offset, setOffset] = useState(defaultValues.offset)

  const hasSelection = Query.hasSelection(query)
  const mode = Query.getMode(query)
  const dataEmpty = data ? A.isEmpty(data.data) : true
  const dataLoaded = (data && (data.loaded === undefined || data.loaded) && hasSelection) || false
  const dataLoading = !!data?.loading
  const dataLoadingError = data?.error || false

  const entityDefUuid = Query.getEntityDefUuid(query)
  const attributeDefUuids = Query.getAttributeDefUuids(query)
  const dimensions = Query.getDimensions(query)
  const measures = Query.getMeasures(query)
  const measuresAggregateFnsSize = Array.from(measures.values()).flat().length
  const filter = Query.getFilter(query)
  const filterRecordUuid = Query.getFilterRecordUuid(query)
  const sort = Query.getSort(query)
  const Actions = useActions({ setData, setCount })

  // on entity def uuid or filter update: reset data
  useOnUpdate(Actions.reset, [entityDefUuid, filter])

  // on mount or on update offset, attributeDefUuids, dimensions, measures: fetch or reset
  useEffect(() => {
    if (hasSelection) Actions.fetch({ offset, limit, query })
    else Actions.reset()
  }, [limit, offset, attributeDefUuids, dimensions, hasSelection, measures, measuresAggregateFnsSize, mode, sort])

  // on filter update: fetch data and count
  useOnUpdate(() => {
    if (hasSelection) Actions.fetch({ offset, limit, query, includesCount: true })
  }, [filter, filterRecordUuid])

  return {
    count: count && count.data,
    data: data && data.data,
    dataEmpty,
    dataLoaded,
    dataLoading,
    dataLoadingError,
    limit,
    offset,
    setLimit,
    setOffset,
    setData: (dataUpdated) => setData({ ...data, data: dataUpdated }),
  }
}
