import { useEffect, useRef } from 'react'

export default (effect, duration) => {
  const savedCallback = useRef()

  useEffect(() => {
    savedCallback.current = effect
  }, [effect])

  useEffect(() => {
    function tick() {
      savedCallback.current()
    }
    if (duration !== null) {
      const id = setInterval(tick, duration)
      return () => clearInterval(id)
    }
    return null
  }, [duration])

  return []
}
