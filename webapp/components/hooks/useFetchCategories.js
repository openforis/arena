import { useFetchItems } from './useFetchItems'

export const useFetchCategories = () => {
  const { items, initItems, fetchItems } = useFetchItems({ type: 'categories' })

  return {
    categories: items,
    initCategories: initItems,
    fetchCategories: fetchItems,
  }
}
