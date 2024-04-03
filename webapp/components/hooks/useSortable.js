import { useCallback, useLayoutEffect, useRef } from 'react'
import { Sortable } from '@shopify/draggable'

export const useSortable = ({ containerRef, draggableClassName, handleClassName, items, onItemsSort }) => {
  const sortableRef = useRef(null)

  const initSortable = useCallback(() => {
    const container = containerRef.current
    if (container && items.length > 0) {
      sortableRef.current = new Sortable(container, {
        draggable: draggableClassName,
        handle: handleClassName,
        mirror: {
          appendTo: 'body',
          constrainDimensions: true,
        },
      }).on('sortable:stop', (event) => {
        const { newIndex, oldIndex } = event.data
        const draggedItem = items[oldIndex]
        const newItems = [...items]
        newItems.splice(oldIndex, 1)
        newItems.splice(newIndex, 0, draggedItem)

        onItemsSort(newItems)
      })
    }
  }, [containerRef, items, draggableClassName, handleClassName, onItemsSort])

  const destroySortable = useCallback(() => {
    const sortable = sortableRef.current
    if (sortable) {
      sortable.destroy()
      sortableRef.current = null
    }
  }, [])

  useLayoutEffect(() => {
    initSortable()
    return destroySortable
  })
}
