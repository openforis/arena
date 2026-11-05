export type DoubleClickTarget = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>

/**
 * Captures double-clicks on the map container while measuring, so the map's own double-click handlers (the location
 * picker moves its marker, data markers open their record) never see the double-click that finishes a shape.
 * @param {DoubleClickTarget} target - The map container.
 * @param {(event: Event) => void} onDoubleClick - Called with every captured double-click.
 * @returns {() => void} Removes the listener.
 */
export const interceptDoubleClick = (
  target: DoubleClickTarget,
  onDoubleClick: (event: Event) => void
): (() => void) => {
  /**
   * Stops the double-click in the capture phase and reports it.
   * @param {Event} event - The double-click event.
   * @returns {void}
   */
  const listener = (event: Event): void => {
    // immediate: also skips Leaflet's listener when the container itself is the target
    event.stopImmediatePropagation()
    event.preventDefault()
    onDoubleClick(event)
  }
  target.addEventListener('dblclick', listener, true)
  return () => target.removeEventListener('dblclick', listener, true)
}
