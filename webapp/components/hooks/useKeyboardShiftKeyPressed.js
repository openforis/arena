import { useState, useEffect } from 'react'

const keyValue = 'Shift'

export const useKeyboardShiftKeyPressed = () => {
  const [isPressed, setPressed] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === keyValue) setPressed(true)
    }

    const handleKeyUp = (e) => {
      if (e.key === keyValue) setPressed(false)
    }

    globalThis.addEventListener('keydown', handleKeyDown)
    globalThis.addEventListener('keyup', handleKeyUp)

    return () => {
      globalThis.removeEventListener('keydown', handleKeyDown)
      globalThis.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return isPressed
}
