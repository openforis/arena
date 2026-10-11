import { useEffect, useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'

import { isEditableTarget, resolveMapShortcut } from './shortcuts/mapShortcuts'
import type { MapShortcutAction } from './shortcuts/mapShortcuts'

export type MapShortcutHandlers = Partial<Record<MapShortcutAction, () => void>>

// MUI menus and dialogs handle their own keys (type-ahead, Escape)
const POPUP_SELECTOR = '[role="menu"], [role="dialog"]'

/**
 * Tells whether an event target is inside a menu or dialog.
 * @param {EventTarget|null} target - The event target.
 * @returns {boolean} True when inside a popup.
 */
const isInPopup = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest(POPUP_SELECTOR) !== null

/**
 * Runs the workspace keyboard shortcuts for key presses inside the workspace root.
 * @param {object} params - Parameters.
 * @param {RefObject<HTMLElement|null>} params.rootRef - The workspace root element.
 * @param {MapShortcutHandlers} params.handlers - Handler of each action (missing actions are ignored).
 * @returns {void}
 */
export const useMapShortcuts = ({
  rootRef,
  handlers,
}: {
  rootRef: RefObject<HTMLElement | null>
  handlers: MapShortcutHandlers
}): void => {
  // the listener is added once; it always reads the latest handlers
  const handlersRef = useRef(handlers)
  useLayoutEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || event.repeat) return
      const ignoreKeys = isInPopup(event.target) || isEditableTarget(event.target)
      const action = resolveMapShortcut(event, ignoreKeys)
      const handler = action ? handlersRef.current[action] : undefined
      if (!handler) return
      event.preventDefault()
      handler()
    }
    root.addEventListener('keydown', onKeyDown)
    return () => root.removeEventListener('keydown', onKeyDown)
  }, [rootRef])
}
