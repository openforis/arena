const addOrRemoveItem =
  ({ item, compareFn = null }) =>
  (array) => {
    const result = [...array]
    const itemIndex = array.findIndex((_item) => (compareFn ? compareFn(_item) : _item === item))
    if (itemIndex >= 0) {
      result.splice(itemIndex, 1)
    } else {
      result.push(item)
    }
    return result
  }

export const ArrayUtils = {
  addOrRemoveItem,
}
