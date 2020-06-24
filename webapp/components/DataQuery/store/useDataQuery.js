import { useState } from 'react'
import { Query } from '@common/model/query'

import { useOnUpdate } from '@webapp/components/hooks'

import { useActions } from './actions'

const defaults = {
  [Query.displayTypes.table]: { limit: 15, offset: 0 },
}

export const useDataQuery = ({ query }) => {
  const defaultValues = defaults[Query.getDisplayType(query)]
  const [data, setData] = useState([])
  const [limit] = useState(defaultValues.limit)
  const [offset, setOffset] = useState(defaultValues.offset)

  const entityDefUuid = Query.getEntityDefUuid(query)
  const attributeDefUuids = Query.getAttributeDefUuids(query)
  const dimensions = Query.getDimensions(query)
  const measures = Query.getMeasures(query)

  const Actions = useActions({ setData })

  // on entity def uuid update, reset data
  useOnUpdate(() => {
    setData([])
  }, [entityDefUuid])

  // offset, attributeDefUuids, dimensions, measures fetch or reset data
  useOnUpdate(() => {
    if (Query.hasSelection(query)) Actions.fetchData({ offset, limit, query })
    else setData([])
  }, [offset, attributeDefUuids, dimensions, measures])

  return {
    data,
    limit,
    offset,
    setOffset,
  }
}
