import { useFetchItems } from './useFetchItems'

export const useFetchTaxonomies = () => {
  const { items, initItems, fetchItems } = useFetchItems({ type: 'taxonomies' })

  return {
    taxonomies: items,
    initTaxonomies: initItems,
    fetchTaxonomies: fetchItems,
  }
}
