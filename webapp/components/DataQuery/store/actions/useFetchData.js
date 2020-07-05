import { useCallback } from 'react'

import { Query } from '@common/model/query'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { usePost } from '@webapp/components/hooks'

export const throttleTime = 250
export const getUrl = ({ surveyId, query }) => `/api/surveyRdb/${surveyId}/${Query.getEntityDefUuid(query)}/query`

const getBody = ({ cycle, offset, limit, query }) => ({
  cycle,
  nodeDefUuidCols: JSON.stringify(Query.getAttributeDefUuids(query)),
  offset,
  limit,
  filter: Query.getFilter(query) ? JSON.stringify(Query.getFilter(query)) : null,
  sort: JSON.stringify(Query.getSort(query)),
  editMode: Query.isModeRawEdit(query),
})

export const useFetchData = ({ setData }) => {
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const { post, reset } = usePost({ subscribe: setData, throttle: throttleTime })

  return {
    fetchData: useCallback(
      ({ offset, limit, query }) =>
        post({
          url: getUrl({ surveyId, query }),
          body: getBody({ cycle, query, limit, offset }),
        }),
      [cycle, surveyId, post]
    ),
    resetData: useCallback(reset, [reset]),
  }
}
