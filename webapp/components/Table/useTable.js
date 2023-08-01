import { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router'

import { useSurveyId } from '@webapp/store/survey'
import { useAsyncGetRequest, useOnUpdate } from '@webapp/components/hooks'
import { getLimit, getOffset, getSearch, getSort, updateQuery } from '@webapp/components/Table/tableLink'
import { ArrayUtils } from '@core/arrayUtils'

export const useTable = ({
  keyExtractor,
  moduleApiUri,
  module,
  restParams,
  onRowClick: onRowClickProp,
  selectable,
}) => {
  const [totalCount, setTotalCount] = useState(0)
  const navigate = useNavigate()
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

  const initData = () => {
    fetchData()
    fetchCount()
  }

  // init data on mount and on restParams and search update
  useEffect(initData, [JSON.stringify(restParams), search])

  useEffect(() => {
    if (totalCount < count) {
      setTotalCount(count)
    }
  }, [count, totalCount])

  useOnUpdate(() => {
    fetchData()
  }, [limit, offset, sort.by, sort.order])

  const handleSortBy = useCallback(
    (orderByField) => {
      let order = sort.by !== orderByField && sort.order !== 'asc' ? 'desc' : 'asc'
      order = sort.by === orderByField && sort.order === 'asc' ? null : order

      updateQuery(navigate)({ sort: { by: orderByField, order }, offset: null })
    },
    [sort]
  )

  const handleSearch = useCallback((searchText) => {
    updateQuery(navigate)({ search: searchText, offset: null })
  }, [])

  // on rest params and limit update, go to first page (reset offset)
  useOnUpdate(() => {
    updateQuery(navigate)({ offset: null })
  }, [JSON.stringify(restParams), limit])

  // selected items
  const [selectedItems, setSelectedItems] = useState([])

  // reset selected items on data (list) update
  useOnUpdate(() => {
    if (selectedItems.length > 0) {
      setSelectedItems([])
    }
  }, [list])

  const onRowClick = useCallback(
    async (item) => {
      if (onRowClickProp) {
        await onRowClickProp(item)
      }
      if (selectable) {
        const key = keyExtractor({ item })
        const selectedItemsUpdated = ArrayUtils.addOrRemoveItem({
          item,
          compareFn: (_item) => keyExtractor({ item: _item }) === key,
        })
        setSelectedItems(selectedItemsUpdated)
      }
    },
    [keyExtractor, onRowClickProp, selectable]
  )

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
    onRowClick,
    selectedItems,
  }
}
