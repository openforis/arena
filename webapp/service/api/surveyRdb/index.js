import axios from 'axios'

import { Query } from '@common/model/query'

import * as A from '@core/arena'

const getEntityViewUrlPrefix = ({ surveyId, query }) =>
  `/api/surveyRdb/${surveyId}/${Query.getEntityDefUuid(query)}/query`

export const fetchEntityViewCount = async ({ surveyId, query, cycle }) => {
  const url = `${getEntityViewUrlPrefix({ surveyId, query })}/count`
  const { data } = await axios.post(url, {
    cycle,
    query: A.stringify(query),
  })
  return data
}
