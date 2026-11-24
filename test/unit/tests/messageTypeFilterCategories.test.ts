import {
  MessageTypeFilterCategories,
  MessageTypeFilterCategoryIds,
  expandMessageTypeFilterCategoriesToKeys,
} from '@core/validation/messageTypeFilterCategories'

describe('messageTypeFilterCategories', () => {
  test('MessageTypeFilterCategoryIds lists every category key exactly once, in declaration order', () => {
    expect(MessageTypeFilterCategoryIds).toEqual([
      'valueRequired',
      'valueInvalid',
      'uniqueDuplicate',
      'customValidation',
      'entityKeyDuplicate',
      'recordKeyDuplicate',
      'nodesCount',
    ])
  })

  test('expandMessageTypeFilterCategoriesToKeys expands a single category to its underlying message keys', () => {
    expect(expandMessageTypeFilterCategoriesToKeys(['valueRequired'])).toEqual(['record.attribute.valueRequired'])
  })

  test('expandMessageTypeFilterCategoriesToKeys expands the grouped nodesCount category to all 3 underlying keys', () => {
    expect(expandMessageTypeFilterCategoriesToKeys(['nodesCount'])).toEqual([
      'record.nodes.count.invalid',
      'record.nodes.count.minNotReached',
      'record.nodes.count.maxExceeded',
    ])
  })

  test('expandMessageTypeFilterCategoriesToKeys expands uniqueDuplicate to both the attribute-level and record-level duplicate-value keys', () => {
    expect(expandMessageTypeFilterCategoriesToKeys(['uniqueDuplicate'])).toEqual([
      'record.attribute.uniqueDuplicate',
      'validationErrors:record.uniqueAttributeDuplicate',
    ])
  })

  test('expandMessageTypeFilterCategoriesToKeys concatenates keys across multiple selected categories, preserving input order', () => {
    expect(expandMessageTypeFilterCategoriesToKeys(['valueInvalid', 'entityKeyDuplicate'])).toEqual([
      'record.attribute.valueInvalid',
      'record.entity.keyDuplicate',
    ])
  })

  test('expandMessageTypeFilterCategoriesToKeys returns an empty array for an empty selection', () => {
    expect(expandMessageTypeFilterCategoriesToKeys([])).toEqual([])
  })

  test('every category maps to at least one message key', () => {
    Object.values(MessageTypeFilterCategories).forEach((category) => {
      expect(category.messageKeys.length).toBeGreaterThan(0)
    })
  })
})
