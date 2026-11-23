import { useEffect } from 'react'

const useOnResize = (callback, elementRef) => {
  useEffect(() => {
    const resizeObserver = new ResizeObserver(callback)
    resizeObserver.observe(elementRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [callback, elementRef])
}

export default useOnResize
