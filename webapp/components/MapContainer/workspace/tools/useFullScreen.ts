import { useCallback, useEffect, useState } from 'react'
import type { RefObject } from 'react'

export type FullScreenState = { isFullScreen: boolean; toggle: () => void }

/**
 * Leaves full screen, if the page is in full screen (e.g. before opening a modal that lives outside the map).
 * @returns {void}
 */
export const exitFullScreen = (): void => {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => undefined) // already left (e.g. with the Esc key)
  }
}

/**
 * Puts an element in full screen and tracks whether it is.
 * @param {RefObject<HTMLElement|null>} ref - The element.
 * @returns {FullScreenState} Whether the element is in full screen, and a toggle.
 */
export const useFullScreen = (ref: RefObject<HTMLElement | null>): FullScreenState => {
  const [isFullScreen, setIsFullScreen] = useState(false)

  useEffect(() => {
    const onChange = (): void =>
      setIsFullScreen(document.fullscreenElement !== null && document.fullscreenElement === ref.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [ref])

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      exitFullScreen()
    } else {
      ref.current?.requestFullscreen().catch(() => setIsFullScreen(false)) // refused by the browser
    }
  }, [ref])

  return { isFullScreen, toggle }
}
