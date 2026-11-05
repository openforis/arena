import { useLayoutEffect } from 'react'
import type { Control } from 'leaflet'

/**
 * Moves the DOM of a Leaflet control into another element (Leaflet keeps updating it there).
 * On cleanup the DOM goes back where Leaflet put it, or is removed when that place is gone.
 * @param {Control|null|undefined} control - The Leaflet control (null: nothing to move).
 * @param {HTMLElement|null} target - The element that receives the control.
 * @returns {void}
 */
export const useControlContainerMove = (control: Control | null | undefined, target: HTMLElement | null): void => {
  useLayoutEffect(() => {
    const container = control?.getContainer()
    if (!container || !target) return undefined
    const originalParent = container.parentElement
    target.appendChild(container)
    return () => {
      if (originalParent?.isConnected) {
        originalParent.appendChild(container)
      } else {
        container.remove()
      }
    }
  }, [control, target])
}
