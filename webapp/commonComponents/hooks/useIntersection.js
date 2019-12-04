import React, { useEffect, useRef, useState } from 'react'

export default (onChange, {root = null, rootMargin, threshold = 0} = {}) => {
  const [target, setTarget] = useState(null)
  const observer = useRef(null)

  useEffect(() => {
    // stop listening to current node intersections
    observer.current && observer.current.disconnect()

    // create new IntersectionObserver
    observer.current = new IntersectionObserver(onChange, {root, rootMargin, threshold})

    const {current: observerCurrent } = observer
    
    // observe target intersections
    target && observerCurrent.observe(target)

    return () => observerCurrent.disconnect()
  }, [target, root, rootMargin, threshold])

  return [setTarget]
}