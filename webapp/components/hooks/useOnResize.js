import { useEffect } from 'react'

export default (callback, elementRef) => {
  useEffect(() => {
    const resizeObserver = new ResizeObserver(callback)
    resizeObserver.observe(elementRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [callback, elementRef])
}
