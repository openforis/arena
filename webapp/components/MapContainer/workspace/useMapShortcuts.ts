import { useCallback, useLayoutEffect, useRef } from 'react'
import type { KeyboardEvent, RefObject } from 'react'

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
 * Builds the keydown handler of the workspace keyboard shortcuts.
 * The handler is meant for the React onKeyDown of the workspace root, so it runs after the handlers of
 * its descendants (which can call preventDefault to keep a key) and only acts for targets inside the root.
 * @param {object} params - Parameters.
 * @param {RefObject<HTMLElement|null>} params.rootRef - The workspace root element.
 * @param {MapShortcutHandlers} params.handlers - Handler of each action (missing actions are ignored).
 * @returns {Function} The onKeyDown handler.
 */
export const useMapShortcuts = ({
  rootRef,
  handlers,
}: {
  rootRef: RefObject<HTMLElement | null>
  handlers: MapShortcutHandlers
}): ((event: KeyboardEvent<HTMLElement>) => void) => {
  // the callback is stable; it always reads the latest handlers
  const handlersRef = useRef(handlers)
  useLayoutEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  return useCallback(
    (event: KeyboardEvent<HTMLElement>): void => {
      if (event.defaultPrevented) return
      // React portals bubble through the React tree from outside the DOM subtree of the root
      const root = rootRef.current
      if (!root?.contains(event.target as Node)) return
      const ignoreKeys = isInPopup(event.target) || isEditableTarget(event.target)
      const action = resolveMapShortcut(event.nativeEvent, ignoreKeys)
      const handler = action ? handlersRef.current[action] : undefined
      if (!handler) return
      event.preventDefault()
      // a held key must not leak to the browser, but it does not repeat the action
      if (event.repeat) return
      handler()
    },
    [rootRef]
  )
}
