import { Objects } from '@openforis/arena-core'

const findIndex =
  ({ item, compareFn = null }) =>
  (array) =>
    array.findIndex((_item) => (compareFn ? compareFn(_item) : _item === item))

const addOrRemoveItem =
  ({ item, compareFn = null }) =>
  (array) => {
    const result = [...array]
    const itemIndex = findIndex({ item, compareFn })(array)
    if (itemIndex >= 0) {
      result.splice(itemIndex, 1)
    } else {
      result.push(item)
    }
    return result
  }

const addIfNotEmpty =
  (...items) =>
  (array) => {
    items.forEach((item) => {
      if (!Objects.isEmpty(item)) {
        array.push(item)
      }
    })
    return array
  }

const addItems =
  ({ items, compareFn = null, avoidDuplicates = true }) =>
  (array) => {
    const result = [...array]
    items.forEach((item) => {
      if (!avoidDuplicates || findIndex({ item, compareFn })(result) < 0) {
        result.push(item)
      }
    })
    return result
  }

const removeItemAtIndex =
  ({ index }) =>
  (array) => [...array.slice(0, index), ...array.slice(index + 1)]

const removeItems =
  ({ items, compareFn = null }) =>
  (array) => {
    const result = [...array]
    items.forEach((item) => {
      const itemIndex = findIndex({ item, compareFn })(result)
      if (itemIndex >= 0) {
        result.splice(itemIndex, 1)
      }
    })
    return result
  }

const removeItem =
  ({ item, compareFn = null }) =>
  (array) =>
    removeItems({ items: [item], compareFn })(array)

const fromNumberOfElements = (numOfElements) => Array.from(Array(numOfElements).keys())

const first = (array) => array?.[0]

const last = (array) => (array?.length > 0 ? array[array.length - 1] : undefined)

const sortByProps = (props) => (array) =>
  array.sort((item1, item2) => {
    for (const prop of props) {
      const value1 = item1[prop]
      const value2 = item2[prop]
      if (value1 < value2) return -1
      if (value1 > value2) return 1
    }
    return 0
  })

export const ArrayUtils = {
  addOrRemoveItem,
  addIfNotEmpty,
  addItems,
  removeItemAtIndex,
  removeItem,
  removeItems,
  fromNumberOfElements,
  first,
  last,
  sortByProps,
}
