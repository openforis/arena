import { useCallback, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'

export const RAIL_PANEL_MIN_WIDTH = 200
export const RAIL_PANEL_MAX_WIDTH = 720
const KEY_STEP = 16

/**
 * Keeps a width within the allowed range.
 * @param {number} width - The requested width in px.
 * @returns {number} The width between the min and the max.
 */
export const clampRailPanelWidth = (width: number): number =>
  Math.round(Math.min(Math.max(width, RAIL_PANEL_MIN_WIDTH), RAIL_PANEL_MAX_WIDTH))

type RailPanelResize = {
  getWidth: (tabKey: string, defaultWidth: number) => number
  onPointerDown: (tabKey: string, currentWidth: number) => (event: PointerEvent<HTMLElement>) => void
  onKeyDown: (tabKey: string, currentWidth: number) => (event: KeyboardEvent<HTMLElement>) => void
}

/**
 * Widths of the rail panels changed by the user, dragging their right edge or with the arrow keys.
 * @returns {RailPanelResize} The width getter and the handlers of the resize handle.
 */
export const useRailPanelResize = (): RailPanelResize => {
  const [widthByTab, setWidthByTab] = useState<Record<string, number>>({})
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)

  const setWidth = useCallback((tabKey: string, width: number): void => {
    setWidthByTab((prev) => ({ ...prev, [tabKey]: clampRailPanelWidth(width) }))
  }, [])

  const getWidth = useCallback(
    (tabKey: string, defaultWidth: number): number => widthByTab[tabKey] ?? defaultWidth,
    [widthByTab]
  )

  const onPointerDown = useCallback(
    (tabKey: string, currentWidth: number) =>
      (event: PointerEvent<HTMLElement>): void => {
        if (event.button !== 0) return
        event.preventDefault()
        const handle = event.currentTarget
        handle.setPointerCapture(event.pointerId)
        dragRef.current = { startX: event.clientX, startWidth: currentWidth }

        const onMove = (moveEvent: globalThis.PointerEvent): void => {
          const drag = dragRef.current
          if (drag) setWidth(tabKey, drag.startWidth + moveEvent.clientX - drag.startX)
        }
        const onEnd = (): void => {
          dragRef.current = null
          handle.removeEventListener('pointermove', onMove)
          handle.removeEventListener('pointerup', onEnd)
          handle.removeEventListener('pointercancel', onEnd)
        }
        handle.addEventListener('pointermove', onMove)
        handle.addEventListener('pointerup', onEnd)
        handle.addEventListener('pointercancel', onEnd)
      },
    [setWidth]
  )

  const onKeyDown = useCallback(
    (tabKey: string, currentWidth: number) =>
      (event: KeyboardEvent<HTMLElement>): void => {
        const delta = { ArrowLeft: -KEY_STEP, ArrowRight: KEY_STEP }[event.key]
        if (!delta) return
        event.preventDefault()
        setWidth(tabKey, currentWidth + delta)
      },
    [setWidth]
  )

  return { getWidth, onPointerDown, onKeyDown }
}
