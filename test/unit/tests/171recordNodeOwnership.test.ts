import type { ArenaRecordNode } from '@openforis/arena-core'

import { createRequireNodeUuidBelongsToRecord } from '@server/modules/record/api/recordNodeOwnership'
import { getPendingNodeFromBody } from '@server/modules/record/api/recordQualifierMiddleware'

import { createFakeResponse } from '@test/unit/utils/fakeExpress'

const nodeOf = (recordUuid: string | undefined) =>
  ({ uuid: 'node-1', recordUuid, value: 5 }) as unknown as ArenaRecordNode

// the POST node handler reads the node with it too (integration test 051 runs the handler)
describe('per-node endpoint: the node is read from the body only', () => {
  test('a node sent only in the query string is ignored', () => {
    const req: any = { query: { node: JSON.stringify(nodeOf('record-a')) }, body: {} }
    expect(getPendingNodeFromBody(req)).toBeNull()
  })

  test('a node in the body is parsed', () => {
    const node = nodeOf('record-a')
    expect(getPendingNodeFromBody({ query: {}, body: { node: JSON.stringify(node) } } as any)).toEqual(node)
    expect(getPendingNodeFromBody({ query: {}, body: { node } } as any)).toEqual(node)
  })
})

describe('delete endpoint: the node uuid must belong to the record of the URL', () => {
  const nodeUuid = '0b8f4c1e-5d0a-4a52-9a43-2f1c7e6b9d10'

  const runDelete = async (fetched: string | null, uuid = nodeUuid) => {
    const fetchNodeRecordUuid = jest.fn().mockResolvedValue(fetched)
    const middleware = createRequireNodeUuidBelongsToRecord(fetchNodeRecordUuid)
    const req: any = { params: { surveyId: '1', recordUuid: 'record-a', nodeUuid: uuid }, query: {}, body: {} }
    const res = createFakeResponse()
    const next = jest.fn()
    await middleware(req, res, next)
    return { res, next, fetchNodeRecordUuid }
  }

  test('a node of the URL record passes', async () => {
    const { next, fetchNodeRecordUuid } = await runDelete('record-a')
    expect(fetchNodeRecordUuid).toHaveBeenCalledWith('1', nodeUuid)
    expect(next).toHaveBeenCalledWith()
  })

  test('a node of another record is refused with 400', async () => {
    const { res, next } = await runDelete('record-b')
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(400)
    expect(res.body).toMatchObject({ key: 'appErrors:record.nodeNotInRecord' })
  })

  test('a missing node passes: its create may still be queued', async () => {
    const { next } = await runDelete(null)
    expect(next).toHaveBeenCalledWith()
  })

  test('a malformed uuid is refused without any lookup', async () => {
    const { res, next, fetchNodeRecordUuid } = await runDelete('record-a', 'not-a-uuid')
    expect(fetchNodeRecordUuid).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(400)
  })
})
