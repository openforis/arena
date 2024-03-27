import { useEffect, useRef, useState } from 'react'

export default (effect, { root = null, rootMargin, threshold = 0 } = {}) => {
  const [target, setTarget] = useState(null)
  const observer = useRef(null)

  // Call the specified effect every time the IntersectionObserver detects an interception with the target element(s)
  const callback = (entries) => entries.forEach((entry) => entry.isIntersecting && effect(entry))

  useEffect(() => {
    // Stop listening to current node intersections
    if (observer.current) observer.current.disconnect()

    // Create new IntersectionObserver
    observer.current = new IntersectionObserver(callback, { root, rootMargin, threshold })

    const { current: observerCurrent } = observer

    // Observe target intersections
    if (target) observerCurrent.observe(target)

    return () => observerCurrent.disconnect()
  }, [target, root, rootMargin, threshold])

  return [setTarget]
}
