import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'

import {
  filterNodesOfRecord,
  isEventOfOpenRecord,
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
      [Node.getUuid(root)]: Validation.newInstance(false, {}, [{ key: 'some.error', valid: false }]),
    })
    expect(mergeValidationsOfOpenRecord(slice, { recordUuid: 'other-record-uuid', validations })).toBe(slice)
    const sliceAfter = mergeValidationsOfOpenRecord(slice, { recordUuid, validations })
    expect(sliceAfter).not.toBe(slice)
    const record = RecordState.getRecordEditInSlice(sliceAfter)
    const rootValidation = Validation.getFieldValidation(Node.getUuid(root))(Record.getValidation(record))
    expect(rootValidation.errors.map((error: any) => error.key)).toEqual(['some.error'])
  })

  test('a mixed batch merges only the nodes of the open record', () => {
    const { slice, recordUuid, root } = buildSlice()
    const own = Node.newNode('child-def-uuid', recordUuid, root)
    const foreign = Node.newNode('child-def-uuid', 'other-record-uuid', root)
    const sliceAfter = mergeNodesOfOpenRecord(slice, {
      nodes: { [Node.getUuid(own)]: own, [Node.getUuid(foreign)]: foreign },
    })
    const record = RecordState.getRecordEditInSlice(sliceAfter)
    expect(Record.getNodeByUuid(Node.getUuid(own))(record)).toBeDefined()
    expect(Record.getNodeByUuid(Node.getUuid(foreign))(record)).toBeUndefined()
  })

  test('isEventOfOpenRecord ignores the events of another record', () => {
    expect(isEventOfOpenRecord({ recordUuid: 'r1', openRecordUuid: 'r1' })).toBe(true)
    expect(isEventOfOpenRecord({ recordUuid: 'r2', openRecordUuid: 'r1' })).toBe(false)
    expect(isEventOfOpenRecord({ recordUuid: 'r2', openRecordUuid: undefined })).toBe(true)
    expect(isEventOfOpenRecord({ recordUuid: undefined, openRecordUuid: 'r1' })).toBe(true)
  })

  test('empty slice: both merge functions behave as the plain merges did', () => {
    const nodes = { a: { uuid: 'a', recordUuid: 'r1' } }
    expect(mergeNodesOfOpenRecord({}, { nodes })).toEqual(
      RecordState.mergeRecordNodes(nodes, { removeDirtyFlag: true })({})
    )
    const validations = Validation.newInstance()
    expect(mergeValidationsOfOpenRecord({}, { recordUuid: 'r1', validations })).toEqual(
      RecordState.mergeRecordNodeValidations(validations)({})
    )
  })

  test('with no open record the slice is handled as before', () => {
    expect(RecordState.getRecordUuidInSlice({})).toBeNull()
    const nodes = { a: { uuid: 'a', recordUuid: 'r1' } }
    expect(filterNodesOfRecord({ nodes, recordUuid: RecordState.getRecordUuidInSlice({}) })).toBe(nodes)
  })
})
