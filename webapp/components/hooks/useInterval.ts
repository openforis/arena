import { useEffect, useRef } from 'react'

const useInterval = (effect: () => void, duration: number | null) => {
  const savedCallback = useRef<(() => void) | null>(null)

  useEffect(() => {
    savedCallback.current = effect
  }, [effect])

  useEffect(() => {
    function tick() {
      savedCallback.current?.()
    }
    if (duration !== null) {
      const id = setInterval(tick, duration)
      return () => clearInterval(id)
    }
    return () => ({})
  }, [duration])

  return []
}

export default useInterval
