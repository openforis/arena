import {
  groupEditsByRecord,
  parseNodesBatchRequest,
} from '@server/modules/record/service/update/nodesBatch/nodesBatchRequest'
import { NodesBatchLimits, failedResults } from '@server/modules/record/service/update/nodesBatch/nodesBatchTypes'

const uuidOf = (prefix: string, n: number) => `${prefix}-0000-4000-8000-${String(n).padStart(12, '0')}`
const rec = (n: number) => uuidOf('00000001', n)
const node = (n: number) => uuidOf('00000002', n)

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
    const request = parseNodesBatchRequest({ cycle: 0, edits: [{ recordUuid: rec(1), nodeUuid: node(1), to: 'x' }] })
    expect(request).toEqual({ cycle: '0', edits: [{ recordUuid: rec(1), nodeUuid: node(1), from: null, to: 'x' }] })
  })

  test('invalid requests are refused with a reason', () => {
    expect.assertions(18)
    expectInvalid(null, 'cycle')
    expectInvalid({ cycle: '0' }, 'edits')
    expectInvalid({ cycle: '0', edits: [] }, 'edits')
    expectInvalid({ cycle: '0', edits: [{ recordUuid: rec(1) }] }, 'edit')
    expectInvalid({ cycle: '0', edits: ['x'] }, 'edit')
    expectInvalid({ cycle: '0', edits: [edit(rec(1), node(1)), edit(rec(1), node(1))] }, 'duplicateNode')
    expectInvalid({ cycle: '0', edits: [edit('r1', node(1))] }, 'edit')
    expectInvalid({ cycle: '0', edits: [edit(rec(1), 'n1')] }, 'edit')
    expectInvalid({ cycle: '0', edits: [edit(rec(1), `${node(1)}x`)] }, 'edit')
  })

  test('exactly 200 edits are accepted', () => {
    const edits = Array.from({ length: NodesBatchLimits.maxEdits }, (_, i) => edit(rec(1), node(i)))
    expect(parseNodesBatchRequest({ cycle: '0', edits }).edits).toHaveLength(NodesBatchLimits.maxEdits)
  })

  test('more than 200 edits are refused', () => {
    expect.assertions(2)
    const edits = Array.from({ length: NodesBatchLimits.maxEdits + 1 }, (_, i) => edit(rec(1), node(i)))
    expectInvalid({ cycle: '0', edits }, 'tooManyEdits')
  })

  test('more than 50 records are refused; 50 are accepted', () => {
    expect.assertions(3)
    const editsOf = (count: number) => Array.from({ length: count }, (_, i) => edit(rec(i), node(i)))
    expect(parseNodesBatchRequest({ cycle: '0', edits: editsOf(50) }).edits).toHaveLength(50)
    expectInvalid({ cycle: '0', edits: editsOf(51) }, 'tooManyRecords')
  })

  test('edits are grouped by record, keeping their index in the request', () => {
    const groups = groupEditsByRecord([edit(rec(1), node(1)), edit(rec(2), node(2)), edit(rec(1), node(3))])
    expect([...groups.keys()]).toEqual([rec(1), rec(2)])
    expect(groups.get(rec(1))).toEqual([
      { index: 0, nodeUuid: node(1), from: 1, to: 2 },
      { index: 2, nodeUuid: node(3), from: 1, to: 2 },
    ])
  })

  test('failedResults builds one failed result per edit', () => {
    expect(failedResults([{ index: 3 }, { index: 5 }], 'appErrors:forbidden')).toEqual([
      { index: 3, status: 'failed', messageKey: 'appErrors:forbidden' },
      { index: 5, status: 'failed', messageKey: 'appErrors:forbidden' },
    ])
  })
})
