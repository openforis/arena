import { useEffect, useCallback } from 'react'
import { useHistory } from 'react-router'

import { useSurveyId } from '@webapp/store/survey'
import { useAsyncGetRequest, useOnUpdate } from '@webapp/components/hooks'
import { getLimit, getOffset, getSort, updateQuery } from '@webapp/components/Table/tableLink'

export const useTable = ({ moduleApiUri, module, restParams }) => {
  const history = useHistory()
  const surveyId = useSurveyId()
  const apiUri = moduleApiUri || `/api/survey/${surveyId}/${module}`

  const offset = getOffset()
  const limit = getLimit()
  const sort = getSort()

  const {
    data: { list } = { list: [] },
    dispatch: fetchData,
    loading: loadingData,
  } = useAsyncGetRequest(apiUri, {
    params: { offset, limit, sortBy: sort.by, sortOrder: sort.order, ...restParams },
  })
  const {
    data: { count } = { count: 0 },
    dispatch: fetchCount,
    loading: loadingCount,
  } = useAsyncGetRequest(`${apiUri}/count`, {
    params: restParams,
  })

  const initData = useCallback(() => {
    fetchData()
    fetchCount()
  }, [])

  useEffect(initData, [JSON.stringify(restParams)])

  useOnUpdate(() => {
    fetchData()
  }, [limit, offset, sort.by, sort.order])

  const handleSortBy = useCallback(
    (orderByField) => {
      updateQuery(history)({
        value: { by: orderByField, order: sort.by !== orderByField || sort.order === 'asc' ? 'desc' : 'asc' },
        key: 'sort',
      })
    },
    [sort]
  )

  return { loadingData, loadingCount, list, offset, limit, sort, handleSortBy, count: Number(count), initData }
}
