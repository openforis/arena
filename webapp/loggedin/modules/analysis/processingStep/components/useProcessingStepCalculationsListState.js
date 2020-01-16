import { useState, useRef } from 'react'
import { useDispatch } from 'react-redux'

import { elementOffset } from '@webapp/utils/domUtils'

import { updateProcessingStepCalculationIndex } from '@webapp/loggedin/modules/analysis/processingStep/actions'

export default placeholderRef => {
  const dispatch = useDispatch()
  const [dragging, setDragging] = useState(false)

  // Current element being dragged
  const elementDragRef = useRef(null)

  const onDragStart = evt => {
    setDragging(true)

    const { currentTarget } = evt
    elementDragRef.current = currentTarget
    const placeholder = placeholderRef.current

    const { width, height } = elementOffset(currentTarget)
    placeholder.style.width = `${width}px`
    placeholder.style.height = `${height}px`

    evt.dataTransfer.effectAllowed = 'move'
    // Firefox requires dataTransfer data to be set
    evt.dataTransfer.setData('text/html', currentTarget)
  }

  const onDragOver = evt => {
    const { target } = evt
    const placeholder = placeholderRef.current
    const elementDrag = elementDragRef.current

    elementDrag.style.display = 'none'
    placeholder.style.display = 'flex'

    if (target !== placeholder) {
      const { top } = elementOffset(target)
      const relY = evt.clientY - top
      const height = target.offsetHeight / 2
      const parent = target.parentNode

      parent.insertBefore(placeholder, relY > height ? target.nextElementSibling : target)
    }
  }

  const onDragEnd = () => {
    const placeholder = placeholderRef.current
    const elementDrag = elementDragRef.current
    const parentNode = elementDrag.parentNode

    elementDrag.style.display = 'flex'
    placeholder.style.display = 'none'
    parentNode.insertBefore(elementDrag, placeholder)

    const elements = Array.prototype.slice.call(parentNode.children)
    const indexTo = elements.indexOf(elementDrag)
    const indexFrom = Number(elementDrag.dataset.index)
    if (indexFrom !== indexTo) {
      dispatch(updateProcessingStepCalculationIndex(indexFrom, indexTo))
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
