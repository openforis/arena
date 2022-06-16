import axios from 'axios'

import { Query } from '@common/model/query'

import * as A from '@core/arena'

const getEntityViewUrlPrefix = ({ surveyId, query }) =>
  `/api/surveyRdb/${surveyId}/${Query.getEntityDefUuid(query)}/query`

export const fetchEntityViewDataCount = async ({ surveyId, query, cycle }) => {
  const url = `${getEntityViewUrlPrefix({ surveyId, query })}/count`
  const { data } = await axios.post(url, {
    cycle,
    query: A.stringify(query),
  })
  return data
}

export const fetchEntityViewDataRowsCountByDefUuid = async ({ surveyId, cycle, entityDefUuids = [] }) => {
  const url = `/api/surveyRdb/${surveyId}/view_data_rows_counts`
  const { data } = await axios.get(url, {
    params: {
      cycle,
      entityDefUuids,
    },
  })
  return data
}
