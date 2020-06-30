import * as StringUtils from '@core/stringUtils'

export const useUpdateInputValue = ({
  autocompleteMinChars,
  items,
  getItemKey,
  getItemLabel,
  setInputValue,
  setItemsDialog,
}) => ({ value = '' }) => {
  ;(async () => {
    const searchValue = value.trim()
    let itemsDialogUpdated = []

    if (autocompleteMinChars <= 0 && searchValue.length === 0) {
      itemsDialogUpdated = items
    } else if (autocompleteMinChars > 0 && searchValue.length < autocompleteMinChars) {
      itemsDialogUpdated = []
    }
    // TODO lookup function
    else {
      itemsDialogUpdated = items.filter((item) =>
        item.constructor === String
          ? StringUtils.contains(searchValue, item)
          : StringUtils.contains(searchValue, getItemKey(item)) || StringUtils.contains(searchValue, getItemLabel(item))
      )
    }

    setInputValue(searchValue)
    setItemsDialog(itemsDialogUpdated)
  })()
}
