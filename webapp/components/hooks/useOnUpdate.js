import { useRef, useEffect } from 'react'

const useOnUpdate = (effect, inputs = []) => {
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
    } else {
      effect()
    }
  }, inputs)
}

export default useOnUpdate
