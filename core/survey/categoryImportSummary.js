import * as A from '@core/arena'

export const keys = {
  items: 'items',
  filePath: 'filePath',
  fileFormat: 'fileFormat',
  itemsCount: 'rowsCount',
}

export const keysItem = {
  columns: 'columns',
  dataType: 'dataType',
  dataTypeReadOnly: 'dataTypeReadOnly',
  lang: 'lang',
  levelIndex: 'levelIndex',
  levelName: 'levelName',
  key: 'key',
  type: 'type',
}

export const itemTypes = {
  code: 'code',
  description: 'description',
  extra: 'extra',
  label: 'label',
}

// ===== SUMMARY

export const newSummary = ({ items, itemsCount = 0, filePath = null }) => ({
  [keys.items]: items,
  [keys.filePath]: filePath,
  [keys.itemsCount]: itemsCount,
})

export const getItems = A.propOr([], keys.items)

export const getItemColumns = A.propOr({}, keysItem.columns)

export const getItemsCount = A.propOr(0, keys.itemsCount)

export const getFilePath = A.prop(keys.filePath)

export const getFileFormat = A.prop(keys.fileFormat)

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
}) => ({
  [keysItem.key]: key,
  [keysItem.columns]: columns,
  [keysItem.type]: type,
  [keysItem.levelName]: levelName,
  [keysItem.levelIndex]: levelIndex,
  [keysItem.lang]: lang,
  [keysItem.dataType]: dataType,
  [keysItem.dataTypeReadOnly]: dataTypeReadOnly,
})

export const getItemKey = A.prop(keysItem.key)

export const getItemType = A.prop(keysItem.type)

export const getItemLevelName = A.prop(keysItem.levelName)

export const getItemLevelIndex = A.prop(keysItem.levelIndex)

export const getItemLang = A.prop(keysItem.lang)

export const getItemDataType = A.prop(keysItem.dataType)

export const isItemDataTypeReadOnly = A.propEq(keysItem.dataTypeReadOnly, true)

const isItemType = (type) => A.pipe(getItemType, A.equals(type))

export const isItemCode = isItemType(itemTypes.code)
export const isItemExtra = isItemType(itemTypes.extra)
export const isItemLabel = isItemType(itemTypes.label)
export const isItemDescription = isItemType(itemTypes.description)

export const hasItemLang = (column) => isItemLabel(column) || isItemDescription(column)

// ===== UTILS

export const getLevelNames = A.pipe(getItems, A.filter(isItemCode), A.map(getItemLevelName))

export const getColumnName = (type, levelIndex) =>
  A.pipe(
    getItems,
    A.find((item) => getItemType(item) === type && getItemLevelIndex(item) === levelIndex),
    (item) => (item ? getItemColumns(item)[0] : null)
  )

// UPDATE
export const assocItemDataType = (key, dataType) => (summary) => {
  const items = getItems(summary)
  const itemIdx = items.findIndex((item) => getItemKey(item) === key)
  const item = items[itemIdx]
  const itemUpdated = A.assoc(keysItem.dataType, dataType)(item)
  return A.assocPath([keys.items, itemIdx], itemUpdated)(summary)
}

export const assocFileFormat = A.assoc(keys.fileFormat)
