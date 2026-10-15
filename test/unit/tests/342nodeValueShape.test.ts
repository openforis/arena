import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import { isNodeValueShapeValid } from '@core/record/nodeValueShape'
import { uuidv4 } from '@core/uuid'
import { NodesBatchLimits } from '@common/record/nodesBatchLimits'

import { checkBatchEdit } from '@server/modules/record/service/update/nodesBatch/nodesBatchEditCheck'
import { parseNodesBatchRequest } from '@server/modules/record/service/update/nodesBatch/nodesBatchRequest'
import { NodesBatchMessageKeys } from '@server/modules/record/service/update/nodesBatch/nodesBatchTypes'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'

const { nodeDefType } = NodeDef
const nodeDefOf = (type: string) => ({ type })
const long = (length: number) => 'x'.repeat(length)

describe('Node value shape of a batch edit (342)', () => {
  test.each([
    [nodeDefType.text, 'some text', true],
    [nodeDefType.text, '', true],
    [nodeDefType.text, long(NodesBatchLimits.maxValueChars), true],
    [nodeDefType.text, long(NodesBatchLimits.maxValueChars + 1), false],
    [nodeDefType.text, 12, false],
    [nodeDefType.text, { value: 'x' }, false],
    [nodeDefType.integer, 12, true],
    [nodeDefType.integer, '12', true],
    [nodeDefType.integer, '-3', true],
    [nodeDefType.integer, 1.5, false],
    [nodeDefType.integer, '1.5', false],
    [nodeDefType.integer, 'abc', false],
    [nodeDefType.integer, Number.NaN, false],
    [nodeDefType.integer, { n: 1 }, false],
    [nodeDefType.decimal, 1.5, true],
    [nodeDefType.decimal, '1.5', true],
    [nodeDefType.decimal, '1e3', true],
    [nodeDefType.decimal, Number.POSITIVE_INFINITY, false],
    [nodeDefType.decimal, '0x10', false],
    [nodeDefType.decimal, 'Infinity', false],
    [nodeDefType.boolean, 'true', true],
    [nodeDefType.boolean, 'false', true],
    [nodeDefType.boolean, true, false],
    [nodeDefType.boolean, 'yes', false],
    [nodeDefType.date, '2024-02-29', true],
    [nodeDefType.date, '2023-02-29', false],
    [nodeDefType.date, '31/05/2024', false],
    [nodeDefType.date, 20240531, false],
    [nodeDefType.time, '14:30', true],
    [nodeDefType.time, '9:05', true],
    [nodeDefType.time, '14:30:15', true],
    [nodeDefType.time, '24:00', false],
    [nodeDefType.time, '14:60', false],
    [nodeDefType.time, '2pm', false],
    [nodeDefType.code, { code: 'A' }, true],
    [nodeDefType.code, { code: 'A', itemUuid: uuidv4() }, true],
    [nodeDefType.code, { itemUuid: uuidv4() }, true],
    [nodeDefType.code, {}, false],
    [nodeDefType.code, { code: 'A', extra: 1 }, false],
    [nodeDefType.code, { itemUuid: 'not-a-uuid' }, false],
    [nodeDefType.code, { code: long(NodesBatchLimits.maxValueChars) }, false],
    [nodeDefType.code, 'A', false],
    [nodeDefType.coordinate, { x: 10.5, y: '20', srs: '4326' }, true],
    [nodeDefType.coordinate, { x: 1, y: 2, srs: '4326', accuracy: 3, altitude: '4' }, true],
    [nodeDefType.coordinate, { x: 1, y: 2 }, false],
    [nodeDefType.coordinate, { x: 'a', y: 2, srs: '4326' }, false],
    [nodeDefType.coordinate, { x: 1, y: 2, srs: '4326', other: 1 }, false],
    [nodeDefType.coordinate, '1 2 4326', false],
    [nodeDefType.taxon, { taxonUuid: uuidv4() }, true],
    [nodeDefType.taxon, { taxonUuid: uuidv4(), vernacularNameUuid: uuidv4() }, true],
    [nodeDefType.taxon, { taxonUuid: uuidv4(), scientificName: 'Abies alba', vernacularName: 'Fir' }, true],
    [nodeDefType.taxon, { taxonUuid: 'x' }, false],
    [nodeDefType.taxon, { scientificName: 'Abies alba' }, false],
    [nodeDefType.taxon, { taxonUuid: uuidv4(), junk: 'x' }, false],
    [nodeDefType.file, { fileUuid: uuidv4(), fileName: 'f.txt' }, false],
    [nodeDefType.entity, {}, false],
  ])('%s: %j → %s', (type, value, expected) => {
    expect(isNodeValueShapeValid({ nodeDef: nodeDefOf(type), value })).toBe(expected)
  })

  test.each([nodeDefType.text, nodeDefType.integer, nodeDefType.code, nodeDefType.coordinate, nodeDefType.taxon])(
    'null clears a %s',
    (type) => {
      expect(isNodeValueShapeValid({ nodeDef: nodeDefOf(type), value: null })).toBe(true)
    }
  )

  test('an object nested in the value is refused', () => {
    expect(isNodeValueShapeValid({ nodeDef: nodeDefOf(nodeDefType.code), value: { code: { a: 1 } } })).toBe(false)
  })
})

describe('Batch edit values: size at parse, shape at check (342)', () => {
  const user = { uuid: 'user-uuid' }
  let survey: any
  let record: any
  let textNode: any
  let intNode: any

  beforeAll(async () => {
    survey = await SB.survey(
      user,
      SB.entity(
        'root',
        SB.attribute('root_key').key(),
        SB.attribute('note', NodeDef.nodeDefType.text),
        SB.attribute('num', NodeDef.nodeDefType.integer)
      )
    ).build()
    record = RB.record(
      user,
      survey,
      RB.entity('root', RB.attribute('root_key', '1'), RB.attribute('note', 'a'), RB.attribute('num', 5))
    ).build()
    textNode = RecordUtils.findNodeByPath('root/note')(survey, record)
    intNode = RecordUtils.findNodeByPath('root/num')(survey, record)
  })

  const check = (node: any, from: unknown, to: unknown) =>
    checkBatchEdit({
      survey,
      record,
      recordUuid: Record.getUuid(record),
      edit: { index: 3, nodeUuid: Node.getUuid(node), from, to },
    })

  test('a value of the wrong shape is refused as failed, with the attribute name', () => {
    expect(check(intNode, 5, { n: 1 })).toEqual({
      ok: false,
      result: {
        index: 3,
        status: 'failed',
        messageKey: NodesBatchMessageKeys.invalidValue,
        params: { attributeName: 'num' },
      },
    })
    expect(check(textNode, 'a', { value: 'b' })).toMatchObject({ ok: false })
  })

  test('a value of the right shape is accepted, a clearing null too', () => {
    expect(check(intNode, 5, 6).ok).toBe(true)
    expect(check(textNode, 'a', null).ok).toBe(true)
  })

  test('a malformed value is refused before the conflict check', () => {
    expect(check(intNode, 99, 'abc')).toMatchObject({
      ok: false,
      result: { status: 'failed', messageKey: NodesBatchMessageKeys.invalidValue },
    })
  })

  test('a value larger than the limit is refused by the request parser (400 invalid request)', () => {
    const edit = { recordUuid: uuidv4(), nodeUuid: uuidv4(), from: null }
    expect(() =>
      parseNodesBatchRequest({ cycle: '0', edits: [{ ...edit, to: long(NodesBatchLimits.maxValueChars + 2000) }] })
    ).toThrow(expect.objectContaining({ key: NodesBatchMessageKeys.invalidRequest, statusCode: 400 }))
    // `from` is only compared with the current value: a long stored text must not fail the whole request
    expect(
      parseNodesBatchRequest({
        cycle: '0',
        edits: [{ ...edit, from: long(NodesBatchLimits.maxValueChars + 2000), to: 1 }],
      }).edits
    ).toHaveLength(1)
    expect(
      parseNodesBatchRequest({ cycle: '0', edits: [{ ...edit, to: long(NodesBatchLimits.maxValueChars) }] }).edits
    ).toHaveLength(1)
  })

  test('a large object is refused by the request parser', () => {
    const to = Object.fromEntries(Array.from({ length: 2000 }, (_, index) => [`k${index}`, long(10)]))
    expect(() =>
      parseNodesBatchRequest({ cycle: '0', edits: [{ recordUuid: uuidv4(), nodeUuid: uuidv4(), from: null, to }] })
    ).toThrow(expect.objectContaining({ params: { reason: 'valueTooLarge' } }))
  })
})
