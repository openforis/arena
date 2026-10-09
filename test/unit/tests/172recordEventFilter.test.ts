import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'

import {
  filterNodesOfRecord,
  mergeNodesOfOpenRecord,
  mergeValidationsOfOpenRecord,
} from '@webapp/store/ui/record/recordEventFilter'
import * as RecordState from '@webapp/store/ui/record/state'

const user = { uuid: 'user-uuid' }

const buildSlice = () => {
  const record = Record.newRecord(user, '0')
  const recordUuid = Record.getUuid(record)
  const root = Node.newNode('root-def-uuid', recordUuid)
  const recordWithRoot = Record.assocNode(root)(record)
  return { slice: RecordState.assocRecord(recordWithRoot)({}), recordUuid, root }
}

describe('record editor: socket events of other records are ignored', () => {
  test('filterNodesOfRecord keeps the nodes of the record and the nodes without record uuid', () => {
    const nodes = {
      a: { uuid: 'a', recordUuid: 'r1' },
      b: { uuid: 'b', recordUuid: 'r2' },
      c: { uuid: 'c' },
    }
    expect(Object.keys(filterNodesOfRecord({ nodes, recordUuid: 'r1' }))).toEqual(['a', 'c'])
    expect(filterNodesOfRecord({ nodes, recordUuid: null })).toBe(nodes)
  })

  test('nodes of another record do not change the open record', () => {
    const { slice, root } = buildSlice()
    const foreignNode = Node.newNode('child-def-uuid', 'other-record-uuid', root)
    const sliceAfter = mergeNodesOfOpenRecord(slice, { nodes: { [Node.getUuid(foreignNode)]: foreignNode } })
    expect(sliceAfter).toBe(slice)
  })

  test('nodes of the open record are merged', () => {
    const { slice, recordUuid, root } = buildSlice()
    const child = Node.newNode('child-def-uuid', recordUuid, root)
    const sliceAfter = mergeNodesOfOpenRecord(slice, { nodes: { [Node.getUuid(child)]: child } })
    expect(Record.getNodeByUuid(Node.getUuid(child))(RecordState.getRecordEditInSlice(sliceAfter))).toBeDefined()
  })

  test('validations of another record are ignored; those of the open record are merged', () => {
    const { slice, recordUuid, root } = buildSlice()
    const validations = Validation.newInstance(false, {
      [Node.getUuid(root)]: Validation.newInstance(false, {}, [{ key: 'some.error' }]),
    })
    expect(mergeValidationsOfOpenRecord(slice, { recordUuid: 'other-record-uuid', validations })).toBe(slice)
    const sliceAfter = mergeValidationsOfOpenRecord(slice, { recordUuid, validations })
    expect(sliceAfter).not.toBe(slice)
  })

  test('with no open record the slice is handled as before', () => {
    expect(RecordState.getRecordUuidInSlice({})).toBeNull()
    const nodes = { a: { uuid: 'a', recordUuid: 'r1' } }
    expect(filterNodesOfRecord({ nodes, recordUuid: RecordState.getRecordUuidInSlice({}) })).toBe(nodes)
  })
})
