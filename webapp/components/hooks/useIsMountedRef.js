import { useRef, useEffect } from 'react'

export default ({ delay = 200 } = { delay: 200 }) => {
  const mountedRef = useRef(false)
  const mountedTimeoutRef = useRef(null) // avoid a render after unmount

  useEffect(() => {
    if (delay > 0) {
      // set mounted with a timeout
      mountedTimeoutRef.current = setTimeout(() => {
        mountedTimeoutRef.current = null
        mountedRef.current = true
      }, delay)
    } else {
      // delay = 0 : set mounted immediately
      mountedRef.current = true
    }
    return () => {
      // clear timeout to avoid rendering after unmount
      if (mountedTimeoutRef.current) {
        clearTimeout(mountedTimeoutRef.current)
      }
    }
  }, [delay])

  return mountedRef
}
