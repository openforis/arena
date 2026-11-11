import { NodeValues } from '@core/record/nodeValues'
import { nodeDefType } from '@core/survey/nodeDefType'

const indexableTypes = [
  nodeDefType.boolean,
  nodeDefType.text,
  nodeDefType.integer,
  nodeDefType.decimal,
  nodeDefType.code,
]
const nonIndexableTypes = [nodeDefType.date, nodeDefType.time, nodeDefType.taxon, nodeDefType.coordinate]

describe('NodeValues.isTypeFastIndexable', () => {
  it('supports boolean, text, integer, decimal and code', () => {
    indexableTypes.forEach((type) => {
      expect(NodeValues.isTypeFastIndexable(type)).toBe(true)
    })
  })

  it('does not support date, time, taxon and coordinate', () => {
    nonIndexableTypes.forEach((type) => {
      expect(NodeValues.isTypeFastIndexable(type)).toBe(false)
    })
  })
})

describe('NodeValues.getFastEqualityKeyWithoutRecordContext', () => {
  const survey: any = {}

  // The whole point of this key is to be a faster substitute for isValueEqual when building/using a
  // lookup index: for any 2 non-empty values, "same key" must agree with isValueEqual's own verdict.
  const keysAgreeWithIsValueEqual = ({
    nodeDef,
    value,
    valueSearch,
  }: {
    nodeDef: any
    value: any
    valueSearch: any
  }) => {
    const { key: key1 } = NodeValues.getFastEqualityKeyWithoutRecordContext({ survey, nodeDef, value })
    const { key: key2 } = NodeValues.getFastEqualityKeyWithoutRecordContext({ survey, nodeDef, value: valueSearch })
    const keysMatch = key1 !== null && key2 !== null && key1 === key2
    const isValueEqualResult = NodeValues.isValueEqual({ survey, nodeDef, value, valueSearch })
    return keysMatch === isValueEqualResult
  }

  it('marks an unsupported type (e.g. date) as not indexable', () => {
    const nodeDef = { type: nodeDefType.date }
    expect(NodeValues.getFastEqualityKeyWithoutRecordContext({ survey, nodeDef, value: '2021-01-01' })).toEqual({
      supported: false,
      key: null,
    })
  })

  describe.each([
    ['boolean', nodeDefType.boolean, 'true', 'true', 'false'],
    ['text', nodeDefType.text, 'abc', 'abc', 'xyz'],
    ['integer', nodeDefType.integer, 5, 5, 6],
    ['decimal', nodeDefType.decimal, 5.5, 5.5, 6.1],
  ])('%s', (_label, type, value, sameValue, differentValue) => {
    const nodeDef = { type }

    it('agrees with isValueEqual for equal values', () => {
      expect(keysAgreeWithIsValueEqual({ nodeDef, value, valueSearch: sameValue })).toBe(true)
    })

    it('agrees with isValueEqual for different values', () => {
      expect(keysAgreeWithIsValueEqual({ nodeDef, value, valueSearch: differentValue })).toBe(true)
    })
  })

  describe('code', () => {
    const nodeDef = { type: nodeDefType.code }

    it('agrees with isValueEqual for equal plain codes (e.g. 2 raw record summary values)', () => {
      expect(keysAgreeWithIsValueEqual({ nodeDef, value: 'A01', valueSearch: 'A01' })).toBe(true)
    })

    it('agrees with isValueEqual for different plain codes', () => {
      expect(keysAgreeWithIsValueEqual({ nodeDef, value: 'A01', valueSearch: 'A02' })).toBe(true)
    })

    it('resolves an item indexed in the survey by itemUuid to its current code', () => {
      const itemUuid = 'item-1-uuid'
      const surveyWithIndex = { refData: { categoryItemIndex: { [itemUuid]: { props: { code: 'A01' } } } } }
      const { key } = NodeValues.getFastEqualityKeyWithoutRecordContext({
        survey: surveyWithIndex,
        nodeDef,
        value: { itemUuid, code: 'A01' },
      })
      expect(key).toBe('A01')
    })

    it('falls back to the raw code when the item is not indexed (e.g. a "big", DB-backed category)', () => {
      // itemUuid present but not found in survey.refData.categoryItemIndex
      const value = { itemUuid: 'missing-item-uuid', code: 'A01' }
      const { key } = NodeValues.getFastEqualityKeyWithoutRecordContext({ survey, nodeDef, value })
      expect(key).toBe('A01')
    })

    it('agrees with isValueEqual when comparing a resolved-itemUuid row value against a raw record value from a big category', () => {
      // simulates the actual recordProvider.js call site: row-side value resolved via the category
      // item provider (has itemUuid), record-side value is the raw stored code string (no itemUuid,
      // as read from the RDB view) - big category, item not indexed in survey.refData
      const rowValue = { itemUuid: 'some-item-uuid', code: 'A01' }
      const recordValue = 'A01'
      expect(keysAgreeWithIsValueEqual({ nodeDef, value: recordValue, valueSearch: rowValue })).toBe(true)
    })
  })

  it('returns a null key for an empty value, for every supported type', () => {
    indexableTypes.forEach((type) => {
      const nodeDef = { type }
      expect(NodeValues.getFastEqualityKeyWithoutRecordContext({ survey, nodeDef, value: null })).toEqual({
        supported: true,
        key: null,
      })
    })
  })
})
