import { getNodeRecordMismatchError, requireNodeBelongsToRecord } from '@server/modules/record/api/recordNodeOwnership'

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
