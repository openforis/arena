import { useEffect, useCallback } from 'react'

import { useSurveyId } from '@webapp/store/survey'
import { useAsyncGetRequest, useOnUpdate } from '@webapp/components/hooks'
import { getLimit, getOffset } from '@webapp/components/Table/tableLink'

export const useTable = ({ moduleApiUri, module, restParams }) => {
  const surveyId = useSurveyId()
  const apiUri = moduleApiUri || `/api/survey/${surveyId}/${module}`

  const offset = getOffset()
  const limit = getLimit()

  const {
    data: { list } = { list: [] },
    dispatch: fetchData,
    loading: loadingData,
  } = useAsyncGetRequest(apiUri, {
    params: { offset, limit, ...restParams },
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
  }, [limit, offset])

  return { loadingData, loadingCount, list, offset, limit, count: Number(count), initData }
}
