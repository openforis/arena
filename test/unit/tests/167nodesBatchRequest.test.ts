import {
  groupEditsByRecord,
  parseNodesBatchRequest,
} from '@server/modules/record/service/update/nodesBatch/nodesBatchRequest'
import { NodesBatchLimits, failedResults } from '@server/modules/record/service/update/nodesBatch/nodesBatchTypes'

const edit = (recordUuid: string, nodeUuid: string, from: unknown = 1, to: unknown = 2) => ({
  recordUuid,
  nodeUuid,
  from,
  to,
})

const expectInvalid = (body: unknown, reason: string) => {
  try {
    parseNodesBatchRequest(body)
  } catch (error) {
    expect(error).toMatchObject({ key: 'appErrors:record.nodesBatchInvalid', statusCode: 400 })
    expect(error.params.reason).toBe(reason)
    return
  }
  throw new Error('expected an invalid request')
}

describe('nodes batch request', () => {
  test('a valid request is normalised (cycle as a string, missing from/to as null)', () => {
    const request = parseNodesBatchRequest({ cycle: 0, edits: [{ recordUuid: 'r1', nodeUuid: 'n1', to: 'x' }] })
    expect(request).toEqual({ cycle: '0', edits: [{ recordUuid: 'r1', nodeUuid: 'n1', from: null, to: 'x' }] })
  })

  test('invalid requests are refused with a reason', () => {
    expectInvalid(null, 'cycle')
    expectInvalid({ cycle: '0' }, 'edits')
    expectInvalid({ cycle: '0', edits: [] }, 'edits')
    expectInvalid({ cycle: '0', edits: [{ recordUuid: 'r1' }] }, 'edit')
    expectInvalid({ cycle: '0', edits: ['x'] }, 'edit')
    expectInvalid({ cycle: '0', edits: [edit('r1', 'n1'), edit('r1', 'n1')] }, 'duplicateNode')
  })

  test('more than 200 edits are refused', () => {
    const edits = Array.from({ length: NodesBatchLimits.maxEdits + 1 }, (_, i) => edit('r1', `n${i}`))
    expectInvalid({ cycle: '0', edits }, 'tooManyEdits')
  })

  test('more than 50 records are refused; 50 are accepted', () => {
    const editsOf = (count: number) => Array.from({ length: count }, (_, i) => edit(`r${i}`, `n${i}`))
    expect(parseNodesBatchRequest({ cycle: '0', edits: editsOf(50) }).edits).toHaveLength(50)
    expectInvalid({ cycle: '0', edits: editsOf(51) }, 'tooManyRecords')
  })

  test('edits are grouped by record, keeping their index in the request', () => {
    const groups = groupEditsByRecord([edit('r1', 'a'), edit('r2', 'b'), edit('r1', 'c')])
    expect([...groups.keys()]).toEqual(['r1', 'r2'])
    expect(groups.get('r1')).toEqual([
      { index: 0, nodeUuid: 'a', from: 1, to: 2 },
      { index: 2, nodeUuid: 'c', from: 1, to: 2 },
    ])
  })

  test('failedResults builds one failed result per edit', () => {
    expect(failedResults([{ index: 3 }, { index: 5 }], 'appErrors:forbidden')).toEqual([
      { index: 3, status: 'failed', messageKey: 'appErrors:forbidden' },
      { index: 5, status: 'failed', messageKey: 'appErrors:forbidden' },
    ])
  })
})
