import { useEffect, useRef, useState } from 'react'

export default (effect, {root = null, rootMargin, threshold = 0} = {}) => {
  const [target, setTarget] = useState(null)
  const observer = useRef(null)

  // call the specified effect every time the IntersectionObserver detects an interception with the target element(s)
  const callback = entries => entries.forEach(entry => entry.isIntersecting && effect(entry))

  useEffect(() => {
    // stop listening to current node intersections
    observer.current && observer.current.disconnect()

    // create new IntersectionObserver
    observer.current = new IntersectionObserver(callback, {root, rootMargin, threshold})

    const {current: observerCurrent } = observer
    
    // observe target intersections
    target && observerCurrent.observe(target)

    return () => observerCurrent.disconnect()
  }, [target, root, rootMargin, threshold])

  return [setTarget]
}