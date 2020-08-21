import { useEffect, useRef, useState } from 'react'

import * as API from '@webapp/service/api'

export const useItems = ({ categoryUuid, categoryLevelIndex, draft, edit, parentCategoryItemUuid, surveyId }) => {
  const [items, setItems] = useState([])
  const cancelRequestRef = useRef(null)

  // Fetch category items on categoryUuid or nodeParentCodeUuid update
  useEffect(() => {
    if (!edit) {
      const { request: fetchItems, cancel } =
        categoryUuid && (parentCategoryItemUuid || categoryLevelIndex === 0)
          ? API.fetchCategoryItems({ surveyId, categoryUuid, draft, parentUuid: parentCategoryItemUuid })
          : []
      cancelRequestRef.current = cancel

      fetchItems
        .then(({ data: { items: itemsLoaded = {} } }) => {
          setItems(itemsLoaded)
        })
        .catch(() => {
          // canceled
        })
    }
    return () => {
      if (cancelRequestRef.current) {
        cancelRequestRef.current()
      }
    }
  }, [edit, categoryUuid, parentCategoryItemUuid])

  return { items }
}
