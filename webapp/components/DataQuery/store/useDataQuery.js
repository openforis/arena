import { useEffect, useState } from 'react'

import * as A from '@core/arena'
import { Query } from '@common/model/query'

import { useOnUpdate } from '@webapp/components/hooks'

import { useActions } from './actions'

const defaults = {
  [Query.displayTypes.table]: { limit: 15, offset: 0 },
}

export const useDataQuery = ({ query }) => {
  const defaultValues = defaults[Query.getDisplayType(query)]
  const [data, setData] = useState(null)
  const [count, setCount] = useState(null)
  const [limit] = useState(defaultValues.limit)
  const [offset, setOffset] = useState(defaultValues.offset)

  const hasSelection = Query.hasSelection(query)
  const mode = Query.getMode(query)
  const dataEmpty = data ? A.isEmpty(data.data) : true
  const dataLoaded = data ? data.loaded && hasSelection : false
  const dataLoading = data ? data.loading : false

  const entityDefUuid = Query.getEntityDefUuid(query)
  const attributeDefUuids = Query.getAttributeDefUuids(query)
  const dimensions = Query.getDimensions(query)
  const measures = Query.getMeasures(query)
  const filter = Query.getFilter(query)
  const sort = Query.getSort(query)

  const Actions = useActions({ setData, setCount })

  // on entity def uuid or filter update: reset data
  useOnUpdate(Actions.reset, [entityDefUuid, filter])

  // on mount or on update offset, attributeDefUuids, dimensions, measures: fetch or reset
  useEffect(() => {
    if (hasSelection) Actions.fetch({ offset, limit, query, includesCount: !dataLoaded })
    else Actions.reset()
  }, [offset, attributeDefUuids, dimensions, measures, mode, sort])

  // on filter update: fetch data and count
  useOnUpdate(() => {
    Actions.fetch({ offset, limit, query, includesCount: true })
  }, [filter])

  return {
    count: count && count.data,
    data: data && data.data,
    dataEmpty,
    dataLoaded,
    dataLoading,
    limit,
    offset,
    setOffset,
    setData: (dataUpdated) => setData({ ...data, data: dataUpdated }),
  }
}
