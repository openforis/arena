import { useEffect } from 'react'

export const useGlobalOnMouseMove = ({ callback, dependencies = [] }) => {
  useEffect(() => {
    window.addEventListener('mousemove', callback)
    return () => {
      window.removeEventListener('mousemove', callback)
    }
  }, dependencies)
}
