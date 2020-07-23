import * as StringUtils from '@core/stringUtils'
import { State } from '../state'

// Utility function used to get or fetch the dialog items
export const getItemsDialog = async ({ state, value }) => {
  const autocompleteMinChars = State.getAutocompleteMinChars(state)
  const searchValue = value.trim()

  if (autocompleteMinChars > 0 && searchValue.length < autocompleteMinChars) {
    return []
  }

  const customItemsFilter = State.getCustomItemsFilter(state)
  const items = State.getItems(state)

  let itemsDialog = []
  if (items.constructor === Array) {
    itemsDialog =
      autocompleteMinChars <= 0 && searchValue.length === 0
        ? items
        : items.filter((item) =>
            item.constructor === String
              ? StringUtils.contains(searchValue, item)
              : StringUtils.contains(searchValue, State.getItemKey(state)(item)) ||
                StringUtils.contains(searchValue, State.getItemLabel(state)(item))
          )
  } else {
    itemsDialog = await items(searchValue)
  }

  return customItemsFilter ? itemsDialog.filter(customItemsFilter) : itemsDialog
}
