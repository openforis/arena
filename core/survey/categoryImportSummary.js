import * as R from 'ramda'

export const keys = {
  items: 'items',
  filePath: 'filePath',
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

export const newSummary = ({ items, filePath = null }) => ({
  [keys.items]: items,
  [keys.filePath]: filePath,
})

export const getItems = R.propOr([], keys.items)

export const getItemColumns = R.propOr({}, keysItem.columns)

export const getFilePath = R.prop(keys.filePath)

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

export const getItemKey = R.prop(keysItem.key)

export const getItemType = R.prop(keysItem.type)

export const getItemLevelName = R.prop(keysItem.levelName)

export const getItemLevelIndex = R.prop(keysItem.levelIndex)

export const getItemLang = R.prop(keysItem.lang)

export const getItemDataType = R.prop(keysItem.dataType)

export const isItemDataTypeReadOnly = R.propEq(keysItem.dataTypeReadOnly, true)

const isItemType = (type) => R.pipe(getItemType, R.equals(type))

export const isItemCode = isItemType(itemTypes.code)
export const isItemExtra = isItemType(itemTypes.extra)
export const isItemLabel = isItemType(itemTypes.label)
export const isItemDescription = isItemType(itemTypes.description)

export const hasItemLang = (column) => isItemLabel(column) || isItemDescription(column)

// ===== UTILS

export const getLevelNames = R.pipe(getItems, R.filter(isItemCode), R.map(getItemLevelName))

export const getColumnName = (type, levelIndex) =>
  R.pipe(
    getItems,
    R.find((item) => getItemType(item) === type && getItemLevelIndex(item) === levelIndex),
    (item) => (item ? getItemColumns(item)[0] : null)
  )

// UPDATE
export const assocItemDataType = (key, dataType) => (summary) => {
  const items = getItems(summary)
  const itemIdx = items.findIndex((item) => getItemKey(item) === key)
  const item = items[itemIdx]
  const itemUpdated = R.assoc(keysItem.dataType, dataType)(item)
  return R.assocPath([keys.items, itemIdx], itemUpdated)(summary)
}
