export const MessageTypeFilterCategories: Record<string, { messageKeys: string[] }> = Object.freeze({
  valueRequired: { messageKeys: ['record.attribute.valueRequired'] },
  valueInvalid: { messageKeys: ['record.attribute.valueInvalid'] },
  uniqueDuplicate: {
    messageKeys: ['record.attribute.uniqueDuplicate', 'validationErrors:record.uniqueAttributeDuplicate'],
  },
  customValidation: { messageKeys: ['record.attribute.customValidation'] },
  entityKeyDuplicate: { messageKeys: ['record.entity.keyDuplicate'] },
  recordKeyDuplicate: { messageKeys: ['validationErrors:record.keyDuplicate'] },
  nodesCount: {
    messageKeys: ['record.nodes.count.invalid', 'record.nodes.count.minNotReached', 'record.nodes.count.maxExceeded'],
  },
})

export const MessageTypeFilterCategoryIds: readonly string[] = Object.freeze(Object.keys(MessageTypeFilterCategories))

export const expandMessageTypeFilterCategoriesToKeys = (categoryIds: readonly string[]): string[] =>
  categoryIds.flatMap((categoryId) => MessageTypeFilterCategories[categoryId]?.messageKeys ?? [])
