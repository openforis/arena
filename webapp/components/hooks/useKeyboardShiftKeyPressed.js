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

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return isPressed
}
