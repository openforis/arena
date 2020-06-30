import * as StringUtils from '@core/stringUtils'

// Utility function used to get or fetch the dialog items
export const getItemsDialog = async ({ autocompleteMinChars, items, value, getItemKey, getItemLabel }) => {
  const searchValue = value.trim()

  if (autocompleteMinChars <= 0 && searchValue.length === 0) {
    return items
  }

  if (autocompleteMinChars > 0 && searchValue.length < autocompleteMinChars) {
    return []
  }
  // TODO lookup function

  return items.filter((item) =>
    item.constructor === String
      ? StringUtils.contains(searchValue, item)
      : StringUtils.contains(searchValue, getItemKey(item)) || StringUtils.contains(searchValue, getItemLabel(item))
  )
}
