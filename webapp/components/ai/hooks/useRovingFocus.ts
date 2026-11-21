import React, { useRef } from 'react'

const steps: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

/**
 * Returns the item an arrow key moves to; it stops at the first and last item.
 * @param {object} params - Parameters.
 * @param {string} params.key - Key pressed.
 * @param {number} params.current - Index of the current item.
 * @param {number} params.count - Number of items.
 * @returns {number|null} The new index, or null when the key is not an arrow key.
 */
export const getRovingTargetIndex = ({
  key,
  current,
  count,
}: {
  key: string
  current: number
  count: number
}): number | null => {
  const step = steps[key]
  return step ? Math.min(count - 1, Math.max(0, current + step)) : null
}

/**
 * Arrow-key navigation of a group of tabs or radios: one tab stop (the active item), arrows move the focus.
 * @param {object} params - Parameters.
 * @param {number} params.count - Number of items.
 * @param {number} params.activeIndex - Index of the item that holds the tab stop (the selected one).
 * @param {Function} [params.onMove] - Called with the index of the item the focus moved to.
 * @returns {object} onKeyDown for the group, and getItemProps(index) for each item (ref and tabIndex).
 */
export const useRovingFocus = ({
  count,
  activeIndex,
  onMove,
}: {
  count: number
  activeIndex: number
  onMove?: (index: number) => void
}) => {
  const itemsRef = useRef<(HTMLElement | null)[]>([])
  return {
    onKeyDown: (event: React.KeyboardEvent) => {
      const focused = itemsRef.current.findIndex((item) => item !== null && item === document.activeElement)
      const next = getRovingTargetIndex({ key: event.key, current: focused < 0 ? activeIndex : focused, count })
      if (next === null) return
      event.preventDefault()
      onMove?.(next)
      itemsRef.current[next]?.focus()
    },
    getItemProps: (index: number) => ({
      ref: (element: HTMLElement | null) => {
        itemsRef.current[index] = element
      },
      tabIndex: index === activeIndex ? 0 : -1,
    }),
  }
}
