import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as RecordValidation from '@core/record/recordValidation'
import * as Validation from '@core/validation/validation'

import { areNodeValuesEqual } from '@core/record/nodeValueEquality'
import {
  checkBatchEdit,
  findUniquenessErrorKey,
  isNodeDefBatchEditable,
} from '@server/modules/record/service/update/nodesBatch/nodesBatchEditCheck'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'

const user = { uuid: 'user-uuid' }

describe('areNodeValuesEqual', () => {
  test.each([
    [null, undefined, true],
    [null, '', true],
    [{}, null, true],
    [{ itemUuid: null }, null, true],
    [1, '1', true],
    [1.5, '1.50', false],
    ['a', 'b', false],
    [{ x: 1, y: 2, srs: '4326' }, { srs: '4326', y: '2', x: '1' }, true],
    [{ itemUuid: 'u1', code: 'A' }, { itemUuid: 'u1' }, false],
    [{ itemUuid: 'u1', code: null }, { itemUuid: 'u1' }, true],
    [null, 0, false],
  ])('%p vs %p → %p', (a, b, expected) => {
    expect(areNodeValuesEqual(a, b)).toBe(expected)
  })
})

describe('checkBatchEdit', () => {
  let survey: any
  let record: any
  let numNode: any
  let totalNode: any

  beforeAll(async () => {
    survey = await SB.survey(
      user,
      SB.entity(
        'root',
        SB.attribute('root_key').key(),
        SB.attribute('num', NodeDef.nodeDefType.integer),
        SB.attribute('total', NodeDef.nodeDefType.decimal).readOnly(),
        SB.attribute('photo', NodeDef.nodeDefType.file)
      )
    ).build()
    record = RB.record(
      user,
      survey,
      RB.entity('root', RB.attribute('root_key', '1'), RB.attribute('num', 5), RB.attribute('total', 10))
    ).build()
    numNode = RecordUtils.findNodeByPath('root/num')(survey, record)
    totalNode = RecordUtils.findNodeByPath('root/total')(survey, record)
  })

  const check = (edit: Record<string, unknown>, recordUuid = Record.getUuid(record)) =>
    checkBatchEdit({ survey, record, recordUuid, edit: { index: 0, from: null, to: null, ...edit } as any })

  test('an edit whose from equals the current value is accepted', () => {
    const outcome = check({ nodeUuid: Node.getUuid(numNode), from: 5, to: 6 })
    expect(outcome.ok).toBe(true)
  })

  test('a changed value is a conflict', () => {
    expect(check({ nodeUuid: Node.getUuid(numNode), from: 4, to: 6 })).toEqual({
      ok: false,
      result: { index: 0, status: 'conflict' },
    })
  })

  test('a node that is no longer in the record is a conflict', () => {
    expect(check({ nodeUuid: 'gone-node-uuid', from: 4, to: 6 })).toEqual({
      ok: false,
      result: { index: 0, status: 'conflict' },
    })
  })

  test('a node of another record fails', () => {
    expect(check({ nodeUuid: Node.getUuid(numNode), from: 5, to: 6 }, 'other-record-uuid')).toEqual({
      ok: false,
      result: { index: 0, status: 'failed', messageKey: 'appErrors:record.nodeNotInRecord' },
    })
  })

  test('read-only attributes and entities fail', () => {
    expect(check({ nodeUuid: Node.getUuid(totalNode), from: 10, to: 1 })).toMatchObject({
      ok: false,
      result: { status: 'failed', messageKey: 'validationErrors:nodeValueParser.attributeNotEditable' },
    })
    expect(check({ nodeUuid: Node.getUuid(Record.getRootNode(record)) })).toMatchObject({
      ok: false,
      result: { status: 'failed' },
    })
  })

  test('file attributes are not batch-editable', () => {
    expect(isNodeDefBatchEditable(Survey.getNodeDefByName('photo')(survey))).toBe(false)
    expect(isNodeDefBatchEditable(Survey.getNodeDefByName('num')(survey))).toBe(true)
  })
})

describe('findUniquenessErrorKey', () => {
  test('finds the record key duplicate error of the node', () => {
    const validation = Validation.newInstance(false, {
      'node-1': RecordValidation.newValidationRecordDuplicate({ unique: false }),
    })
    expect(findUniquenessErrorKey({ validation, nodeUuid: 'node-1' })).toBe('validationErrors:record.keyDuplicate')
    expect(findUniquenessErrorKey({ validation, nodeUuid: 'node-2' })).toBeNull()
  })

  test('a unique node has no error', () => {
    const validation = Validation.newInstance(true, {
      'node-1': RecordValidation.newValidationRecordDuplicate({ unique: true }),
    })
    expect(findUniquenessErrorKey({ validation, nodeUuid: 'node-1' })).toBeNull()
    expect(findUniquenessErrorKey({ validation: null, nodeUuid: 'node-1' })).toBeNull()
  })

  test('finds the unique attribute duplicate error', () => {
    const validation = Validation.newInstance(false, {
      'node-1': RecordValidation.newValidationRecordDuplicate({
        unique: false,
        errorKey: Validation.messageKeys.record.uniqueAttributeDuplicate,
      }),
    })
    expect(findUniquenessErrorKey({ validation, nodeUuid: 'node-1' })).toBe(
      'validationErrors:record.uniqueAttributeDuplicate'
    )
  })
})
