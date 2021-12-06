import { useEffect } from 'react'
import { useLocation } from 'react-router'

export const useOnLocationUpdate = (listener, inputs = []) => {
  const location = useLocation()

  useEffect(() => {
    // invoke listener on location change
    listener(location)
  }, [...inputs, location.pathname])
}
