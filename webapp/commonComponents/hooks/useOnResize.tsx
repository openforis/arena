import React, { useEffect } from 'react'
import ResizeObserver from '../../utils/polyfill/resizeObserver'

export default (callback, elementRef) => {
  useEffect(() => {
    const resizeObserver = new ResizeObserver(callback)
    resizeObserver.observe(elementRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])
}
