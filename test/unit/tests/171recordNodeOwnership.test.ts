import {
  getNodeRecordMismatchError,
  requireNodeBelongsToRecord,
  createRequireNodeUuidBelongsToRecord,
} from '@server/modules/record/api/recordNodeOwnership'

import { createFakeResponse } from '@test/unit/utils/fakeExpress'

const nodeOf = (recordUuid: string | undefined) => ({ uuid: 'node-1', recordUuid, value: 5 })

const run = (urlRecordUuid: string, node: unknown) => {
  const req: any = {
    params: { surveyId: '1', recordUuid: urlRecordUuid },
    query: {},
    body: { node: JSON.stringify(node) },
  }
  const res = createFakeResponse()
  const next = jest.fn()
  requireNodeBelongsToRecord(req, res, next)
  return { res, next }
}

describe('per-node endpoint: the node must belong to the record of the URL', () => {
  test('a node of the URL record passes', () => {
    const { res, next } = run('record-a', nodeOf('record-a'))
    expect(next).toHaveBeenCalledWith()
    expect(res.body).toBeUndefined()
  })

  test('a node of another record is refused with 400 and the request goes no further', () => {
    const { res, next } = run('record-a', nodeOf('record-b'))
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(400)
    expect(res.body).toMatchObject({ key: 'appErrors:record.nodeNotInRecord' })
  })

  test('a node without record uuid is refused', () => {
    expect(getNodeRecordMismatchError({ node: nodeOf(undefined), recordUuid: 'record-a' })).toMatchObject({
      key: 'appErrors:record.nodeNotInRecord',
      statusCode: 400,
    })
  })

  test('no node in the request: nothing to check', () => {
    expect(getNodeRecordMismatchError({ node: null, recordUuid: 'record-a' })).toBeNull()
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

  test('a missing node is refused with 400', async () => {
    const { res, next } = await runDelete(null)
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(400)
  })

  test('a malformed uuid is refused without any lookup', async () => {
    const { res, next, fetchNodeRecordUuid } = await runDelete('record-a', 'not-a-uuid')
    expect(fetchNodeRecordUuid).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(400)
  })
})
