import { Objects } from '@openforis/arena-core'

type CompareFn<T> = ((itemA: T, itemB: T) => boolean) | null

const findIndex =
  <T>({ item, compareFn = null }: { item: T; compareFn?: CompareFn<T> }) =>
  (array: T[]): number =>
    array.findIndex((_item) => (compareFn ? compareFn(_item, item) : _item === item))

const addOrRemoveItem =
  <T>({ item, compareFn = null }: { item: T; compareFn?: CompareFn<T> }) =>
  (array: T[]): T[] => {
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
  <T>(...items: T[]) =>
  (array: T[]): T[] => {
    items.forEach((item) => {
      if (!Objects.isEmpty(item)) {
        array.push(item)
      }
    })
    return array
  }

const addItems =
  <T>({
    items,
    compareFn = null,
    avoidDuplicates = true,
    sideEffect = false,
  }: {
    items: T[]
    compareFn?: CompareFn<T>
    avoidDuplicates?: boolean
    sideEffect?: boolean
  }) =>
  (array: T[]): T[] => {
    const result = sideEffect ? array : [...array]
    items.forEach((item) => {
      if (!avoidDuplicates || findIndex({ item, compareFn })(result) < 0) {
        result.push(item)
      }
    })
    return result
  }

const removeItemAtIndex =
  <T>({ index }: { index: number }) =>
  (array: T[]): T[] => [...array.slice(0, index), ...array.slice(index + 1)]

const removeItems =
  <T>({ items, compareFn = null }: { items: T[]; compareFn?: CompareFn<T> }) =>
  (array: T[]): T[] => {
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
  <T>({ item, compareFn = null }: { item: T; compareFn?: CompareFn<T> }) =>
  (array: T[]): T[] =>
    removeItems({ items: [item], compareFn })(array)

const fromNumberOfElements = (numOfElements: number): number[] => Array.from(new Array(numOfElements).keys())

const first = <T>(array?: T[] | null): T | undefined => array?.[0]

const last = <T>(array?: T[] | null): T | undefined => (array && array.length > 0 ? array[array.length - 1] : undefined)

const sortByProps =
  <T extends Record<string, any>>(props: string[]) =>
  (array: T[]): T[] =>
    array.sort((item1, item2) => {
      for (const prop of props) {
        const value1 = item1[prop]
        const value2 = item2[prop]
        if (value1 < value2) return -1
        if (value1 > value2) return 1
      }
      return 0
    })

const sortById = sortByProps(['id'])

const toArray = <T>(value: T | T[] | null | undefined): T | T[] | null | undefined => {
  if (Objects.isNil(value)) return value
  return Array.isArray(value) ? value : [value]
}

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
  sortById,
  toArray,
}
