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
}

export const useHorizontalResize = ({
  containerRef,
  initialWidth,
  minLeftWidth = 0,
  minRightWidth = 0,
}: Params): Result => {
  const [width, setWidth] = useState(initialWidth)
  const widthRef = useRef(initialWidth)

  const onGutterMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = widthRef.current
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'

      const onMouseMove = (moveEvent: MouseEvent) => {
        const containerWidth = containerRef.current?.clientWidth ?? window.innerWidth
        const newWidth = Math.min(
          containerWidth - minRightWidth,
          Math.max(minLeftWidth, startWidth + moveEvent.clientX - startX)
        )
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
    [containerRef, minLeftWidth, minRightWidth]
  )

  return { width, onGutterMouseDown }
}
