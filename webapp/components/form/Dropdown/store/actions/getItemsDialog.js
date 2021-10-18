import * as StringUtils from '@core/stringUtils'
import { State } from '../state'

// Utility function used to get or fetch the dialog items
export const getItemsDialog = async ({ state, value }) => {
  const autocompleteMinChars = State.getAutocompleteMinChars(state)
  const items = State.getItems(state)
  const searchValue = value.trim()

  if (autocompleteMinChars <= 0 && searchValue.length === 0) {
    return Array.isArray(items) ? items : items(searchValue)
  }

  if (autocompleteMinChars > 0 && searchValue.length < autocompleteMinChars) {
    return []
  }

  return Array.isArray(items)
    ? items.filter(
        (item) =>
          StringUtils.contains(searchValue, String(State.getItemKey(state)(item))) ||
          StringUtils.contains(searchValue, String(State.getItemLabelFunction(state)(item)))
      )
    : items(value)
}
