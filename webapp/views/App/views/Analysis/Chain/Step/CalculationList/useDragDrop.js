import { useState, useRef } from 'react'

import { elementOffset } from '@webapp/utils/domUtils'

export default ({ placeholderRef, onDragEndFn }) => {
  const [dragging, setDragging] = useState(false)

  // Current element being dragged
  const elementDragRef = useRef(null)

  const onDragStart = (event) => {
    setDragging(true)

    const { currentTarget } = event
    elementDragRef.current = currentTarget
    const placeholder = placeholderRef.current

    const { width, height } = elementOffset(currentTarget)
    placeholder.style.width = `${width}px`
    placeholder.style.height = `${height}px`

    // eslint-disable-next-line no-param-reassign
    event.dataTransfer.effectAllowed = 'move'
    // Firefox requires dataTransfer data to be set
    event.dataTransfer.setData('text/html', currentTarget)
  }

  const onDragOver = (event) => {
    const { target } = event
    const placeholder = placeholderRef.current
    const elementDrag = elementDragRef.current

    elementDrag.style.display = 'none'
    placeholder.style.display = 'flex'

    if (target !== placeholder) {
      const { top } = elementOffset(target)
      const relY = event.clientY - top
      const height = target.offsetHeight / 2
      const parent = target.parentNode

      parent.insertBefore(placeholder, relY > height ? target.nextElementSibling : target)
    }
  }

  const onDragEnd = () => {
    const placeholder = placeholderRef.current
    const elementDrag = elementDragRef.current
    const { parentNode } = elementDrag

    elementDrag.style.display = 'flex'
    placeholder.style.display = 'none'
    parentNode.insertBefore(elementDrag, placeholder)

    const elements = Array.prototype.slice.call(parentNode.children)
    const indexTo = elements.indexOf(elementDrag)
    const indexFrom = Number(elementDrag.dataset.index)
    if (indexFrom !== indexTo) {
      onDragEndFn({ indexFrom, indexTo })
    }

    elementDragRef.current = null
    setDragging(false)
  }

  return {
    dragging,
    onDragStart,
    onDragOver,
    onDragEnd,
  }
}
