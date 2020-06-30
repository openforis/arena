import * as StringUtils from '@core/stringUtils'

// Utility function used to get or fetch the dialog items
export const getItemsDialog = async ({ autocompleteMinChars, items, value, getItemKey, getItemLabel }) => {
  const searchValue = value.trim()

  if (autocompleteMinChars <= 0 && searchValue.length === 0) {
    return items.constructor === Array ? items : items(searchValue)
  }

  if (autocompleteMinChars > 0 && searchValue.length < autocompleteMinChars) {
    return []
  }

  return items.constructor === Array
    ? items.filter((item) =>
        item.constructor === String
          ? StringUtils.contains(searchValue, item)
          : StringUtils.contains(searchValue, getItemKey(item)) || StringUtils.contains(searchValue, getItemLabel(item))
      )
    : items(value)
}
