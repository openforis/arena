import pgPromise from 'pg-promise'

import * as Node from '@core/record/node'
import { insertNodesInBatch } from '@server/modules/record/repository/nodeRepository'

const pgp = pgPromise()

/**
 * Creates a fake pg-promise-like client whose `.map` runs the query text through the real
 * pg-promise formatting engine (as the actual `db.map` does internally), without touching a real
 * database (there is no DB available in the unit test environment). This is what reproduces the
 * "Variable $N out of range" bug: `insertNodesInBatch` builds a query with values already embedded
 * as literals, then re-runs it through pg-promise formatting with an empty parameters array.
 * @returns {object} - The fake client.
 */
const newFakeClient = () => ({
  map: async (query, params) => {
    pgp.as.format(query, params)
    return []
  },
})

describe('nodeRepository.insertNodesInBatch', () => {
  it('does not throw when a node value contains a literal "$" followed by digits', async () => {
    const recordUuid = 'record-uuid-1'
    const node = Node.newNode('node-def-uuid-1', recordUuid, null, 'It costs $90, not more')

    const client = newFakeClient()

    await insertNodesInBatch({ surveyId: 1, nodes: [node] }, client)
  })
})
