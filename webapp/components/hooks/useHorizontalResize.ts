import { useCallback, useRef, useState } from 'react'

type Params = {
  containerRef: React.RefObject<HTMLElement | null>
  initialWidth: number
  minLeftWidth?: number
  minRightWidth?: number
}

type Result = {
  width: number
  onGutterMouseDown: (e: React.MouseEvent) => void
  onGutterKeyDown: (e: React.KeyboardEvent) => void
  onGutterTouchStart: (e: React.TouchEvent) => void
}

const KEYBOARD_STEP = 10

export const useHorizontalResize = ({
  containerRef,
  initialWidth,
  minLeftWidth = 0,
  minRightWidth = 0,
}: Params): Result => {
  const [width, setWidth] = useState(initialWidth)
  const widthRef = useRef(initialWidth)

  const clampWidth = useCallback(
    (newWidth: number): number => {
      const containerWidth = containerRef.current?.clientWidth ?? window.innerWidth
      return Math.min(containerWidth - minRightWidth, Math.max(minLeftWidth, newWidth))
    },
    [containerRef, minLeftWidth, minRightWidth]
  )

  const onGutterMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = widthRef.current
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'

      const onMouseMove = (moveEvent: MouseEvent) => {
        const newWidth = clampWidth(startWidth + moveEvent.clientX - startX)
        widthRef.current = newWidth
        setWidth(newWidth)
      }

      const onMouseUp = () => {
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [clampWidth]
  )

  const onGutterKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let delta = 0
      if (e.key === 'ArrowRight') {
        delta = KEYBOARD_STEP
      } else if (e.key === 'ArrowLeft') {
        delta = -KEYBOARD_STEP
      } else if (e.key === 'Home') {
        e.preventDefault()
        const newWidth = clampWidth(minLeftWidth)
        widthRef.current = newWidth
        setWidth(newWidth)
        return
      } else if (e.key === 'End') {
        e.preventDefault()
        const containerWidth = containerRef.current?.clientWidth ?? window.innerWidth
        const newWidth = clampWidth(containerWidth - minRightWidth)
        widthRef.current = newWidth
        setWidth(newWidth)
        return
      } else {
        return
      }
      e.preventDefault()
      const newWidth = clampWidth(widthRef.current + delta)
      widthRef.current = newWidth
      setWidth(newWidth)
    },
    [clampWidth, containerRef, minLeftWidth, minRightWidth]
  )

  const onGutterTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      const startX = touch.clientX
      const startWidth = widthRef.current

      const onTouchMove = (moveEvent: TouchEvent) => {
        moveEvent.preventDefault()
        const currentTouch = moveEvent.touches[0]
        const newWidth = clampWidth(startWidth + currentTouch.clientX - startX)
        widthRef.current = newWidth
        setWidth(newWidth)
      }

      const onTouchEnd = () => {
        document.removeEventListener('touchmove', onTouchMove)
        document.removeEventListener('touchend', onTouchEnd)
      }

      document.addEventListener('touchmove', onTouchMove, { passive: false })
      document.addEventListener('touchend', onTouchEnd)
    },
    [clampWidth]
  )

  return { width, onGutterMouseDown, onGutterKeyDown, onGutterTouchStart }
}
