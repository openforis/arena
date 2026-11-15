import * as A from '@core/arena'

export const keys = {
  items: 'items',
  filePath: 'filePath',
  fileFormat: 'fileFormat',
  itemsCount: 'rowsCount',
} as const

export const keysItem = {
  columns: 'columns',
  dataType: 'dataType',
  dataTypeReadOnly: 'dataTypeReadOnly',
  lang: 'lang',
  levelIndex: 'levelIndex',
  levelName: 'levelName',
  key: 'key',
  type: 'type',
} as const

export const itemTypes = {
  code: 'code',
  description: 'description',
  extra: 'extra',
  label: 'label',
}

// ===== SUMMARY

export interface CategoryImportSummaryItem {
  key: string
  columns: string[]
  type: string
  levelName?: string | null
  levelIndex?: number
  lang?: string | null
  dataType?: string | null
  dataTypeReadOnly?: boolean
}

export interface CategoryImportSummary {
  items: CategoryImportSummaryItem[]
  filePath?: string | null
  fileFormat?: string
  rowsCount?: number
}

export const newSummary = ({
  items,
  itemsCount = 0,
  filePath = null,
}: {
  items: CategoryImportSummaryItem[]
  itemsCount?: number
  filePath?: string | null
}): CategoryImportSummary => ({
  [keys.items]: items,
  [keys.filePath]: filePath,
  [keys.itemsCount]: itemsCount,
})

export const getItems = (summary: CategoryImportSummary): CategoryImportSummaryItem[] =>
  A.propOr([], keys.items)(summary)

export const getItemColumns = (item: CategoryImportSummaryItem): string[] => A.propOr({}, keysItem.columns)(item)

export const getItemsCount = (summary: CategoryImportSummary): number => A.propOr(0, keys.itemsCount)(summary)

export const getFilePath = (summary: CategoryImportSummary): string | null | undefined => A.prop(keys.filePath)(summary)

export const getFileFormat = (summary: CategoryImportSummary): string | undefined => A.prop(keys.fileFormat)(summary)

// ===== ITEM

export const newItem = ({
  key,
  columns,
  type,
  levelName = null,
  levelIndex = -1,
  lang = null,
  dataType = null,
  dataTypeReadOnly = false,
}: CategoryImportSummaryItem): CategoryImportSummaryItem => ({
  [keysItem.key]: key,
  [keysItem.columns]: columns,
  [keysItem.type]: type,
  [keysItem.levelName]: levelName,
  [keysItem.levelIndex]: levelIndex,
  [keysItem.lang]: lang,
  [keysItem.dataType]: dataType,
  [keysItem.dataTypeReadOnly]: dataTypeReadOnly,
})

type ItemGetter<T> = (item: CategoryImportSummaryItem) => T

export const getItemKey: ItemGetter<string> = A.prop(keysItem.key)

export const getItemType: ItemGetter<string> = A.prop(keysItem.type)

export const getItemLevelName: ItemGetter<string | null> = A.prop(keysItem.levelName)

export const getItemLevelIndex: ItemGetter<number> = A.prop(keysItem.levelIndex)

export const getItemLang: ItemGetter<string | null> = A.prop(keysItem.lang)

export const getItemDataType: ItemGetter<string | null> = A.prop(keysItem.dataType)

export const isItemDataTypeReadOnly: ItemGetter<boolean> = A.propEq(keysItem.dataTypeReadOnly, true)

const isItemType =
  (type: string): ItemGetter<boolean> =>
  (item) =>
    getItemType(item) === type

export const isItemCode = isItemType(itemTypes.code)
export const isItemExtra = isItemType(itemTypes.extra)
export const isItemLabel = isItemType(itemTypes.label)
export const isItemDescription = isItemType(itemTypes.description)

export const hasItemLang = (column: CategoryImportSummaryItem): boolean =>
  isItemLabel(column) || isItemDescription(column)

// ===== UTILS

export const getLevelNames = (summary: CategoryImportSummary): string[] =>
  getItems(summary).filter(isItemCode).map(getItemLevelName)

export const getColumnName =
  (type: string, levelIndex: number) =>
  (summary: CategoryImportSummary): string | null => {
    const item = getItems(summary).find(
      (itemCurrent) => getItemType(itemCurrent) === type && getItemLevelIndex(itemCurrent) === levelIndex
    )
    return item ? getItemColumns(item)[0] : null
  }

// UPDATE
export const assocItemDataType = (key: string, dataType: string) => (summary: CategoryImportSummary) => {
  const items = getItems(summary)
  const itemIdx = items.findIndex((item) => getItemKey(item) === key)
  const item = items[itemIdx]
  const itemUpdated = A.assoc(keysItem.dataType, dataType)(item)
  return A.assocPath([keys.items, itemIdx], itemUpdated)(summary)
}

export const assocFileFormat =
  (fileFormat: string) =>
  (summary: CategoryImportSummary): CategoryImportSummary =>
    A.assoc(keys.fileFormat, fileFormat)(summary)
