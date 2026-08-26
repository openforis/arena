export const MessageTypeFilterCategories: Record<string, { messageKeys: string[] }> = {
  valueRequired: { messageKeys: ['record.attribute.valueRequired'] },
  valueInvalid: { messageKeys: ['record.attribute.valueInvalid'] },
  uniqueDuplicate: { messageKeys: ['record.attribute.uniqueDuplicate'] },
  customValidation: { messageKeys: ['record.attribute.customValidation'] },
  entityKeyDuplicate: { messageKeys: ['record.entity.keyDuplicate'] },
  nodesCount: {
    messageKeys: ['record.nodes.count.invalid', 'record.nodes.count.minNotReached', 'record.nodes.count.maxExceeded'],
  },
}

export const MessageTypeFilterCategoryIds: string[] = Object.keys(MessageTypeFilterCategories)

export const expandMessageTypeFilterCategoriesToKeys = (categoryIds: string[]): string[] =>
  categoryIds.flatMap((categoryId) => MessageTypeFilterCategories[categoryId]?.messageKeys ?? [])
