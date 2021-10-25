import { useEffect, useCallback, useState } from 'react'
import { useHistory } from 'react-router'

import { useSurveyId } from '@webapp/store/survey'
import { useAsyncGetRequest, useOnUpdate } from '@webapp/components/hooks'
import { getLimit, getOffset, getSearch, getSort, updateQuery } from '@webapp/components/Table/tableLink'

export const useTable = ({ moduleApiUri, module, restParams }) => {
  const [totalCount, setTotalCount] = useState(0)
  const history = useHistory()
  const surveyId = useSurveyId()
  const apiUri = moduleApiUri || `/api/survey/${surveyId}/${module}`

  const offset = getOffset()
  const limit = getLimit()
  const sort = getSort()
  const search = getSearch()

  const {
    data: { list } = { list: [] },
    dispatch: fetchData,
    loading: loadingData,
  } = useAsyncGetRequest(apiUri, {
    params: {
      ...(offset ? { offset } : {}),
      limit,
      sortBy: sort.by,
      sortOrder: sort.order,
      search,
      ...restParams,
    },
  })
  const {
    data: { count } = { count: 0 },
    dispatch: fetchCount,
    loading: loadingCount,
  } = useAsyncGetRequest(`${apiUri}/count`, {
    params: {
      search,
      ...restParams,
    },
  })

  const resetOffset = () => updateQuery(history)({ offset: null })

  const initData = useCallback(() => {
    fetchData()
    fetchCount()
  }, [fetchData, fetchCount])

  useEffect(initData, [JSON.stringify(restParams)])

  useEffect(() => {
    if (totalCount < count) {
      setTotalCount(count)
    }
  }, [count, totalCount])

  useOnUpdate(() => {
    fetchData()
  }, [limit, offset, sort.by, sort.order, search])

  useEffect(() => {
    fetchCount()
  }, [search])

  const handleSortBy = useCallback(
    (orderByField) => {
      let order = sort.by !== orderByField && sort.order !== 'asc' ? 'desc' : 'asc'
      order = sort.by === orderByField && sort.order === 'asc' ? null : order

      updateQuery(history)({ sort: { by: orderByField, order }, offset: null })
    },
    [sort]
  )

  const handleSearch = useCallback((searchText) => {
    updateQuery(history)({ search: searchText, offset: null })
  }, [])

  // on rest params update, go to first page (reset offset)
  useEffect(() => {
    resetOffset()
  }, [JSON.stringify(restParams)])

  return {
    loadingData,
    loadingCount,
    list,
    offset,
    limit,
    sort,
    search,
    handleSearch,
    handleSortBy,
    count: Number(count),
    totalCount: Number(totalCount),
    initData,
  }
}
