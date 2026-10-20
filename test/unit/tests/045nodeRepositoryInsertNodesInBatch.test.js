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
  map: async (query, params, cb) => {
    pgp.as.format(query, params)
    const fakeRow = { id: 1 }
    cb(fakeRow, 0)
    return [fakeRow]
  },
})

describe('nodeRepository.insertNodesInBatch', () => {
  it('does not misinterpret a node value containing a literal "$" followed by digits as a query parameter', async () => {
    const recordUuid = 'record-uuid-1'
    const node = Node.newNode('node-def-uuid-1', recordUuid, null, 'It costs $90, not more')

    const client = newFakeClient()

    const nodesInserted = await insertNodesInBatch({ surveyId: 1, nodes: [node] }, client)

    // the fake client's `map` above would have thrown "Variable $90 out of range" before reaching
    // this point if the value had been misformatted as a query parameter
    expect(nodesInserted[0].id).toBe(1)
  })
})
