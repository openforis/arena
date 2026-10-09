import axios from 'axios'

import { Query } from '@common/model/query'

const getEntityViewUrlPrefix = ({ surveyId, query }) =>
  `/api/surveyRdb/${surveyId}/${Query.getEntityDefUuid(query)}/query`

/**
 * Returns the URL and body of the Explorer count request (the server reads the query as an object).
 * @param {object} params - Parameters.
 * @param {number} params.surveyId - Survey id.
 * @param {object} params.query - Explorer query.
 * @param {string} params.cycle - Survey cycle.
 * @returns {{url: string, body: object}} The request.
 */
export const getEntityViewDataCountRequest = ({ surveyId, query, cycle }) => ({
  url: `${getEntityViewUrlPrefix({ surveyId, query })}/count`,
  body: { cycle, query },
})

export const fetchEntityViewDataCount = async ({ surveyId, query, cycle }) => {
  const { url, body } = getEntityViewDataCountRequest({ surveyId, query, cycle })
  const { data } = await axios.post(url, body)
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
