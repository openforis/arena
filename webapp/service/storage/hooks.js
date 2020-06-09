import { useEffect, useState } from 'react'

import * as storage from './storage'
import eventTypes from './eventTypes'

// ====== sidebar
export const useIsSidebarOpened = () => {
  const [open, setOpen] = useState(storage.isSidebarOpened)

  useEffect(() => {
    const listener = () => setOpen(storage.isSidebarOpened())

    window.addEventListener(eventTypes.sidebar.toggle, listener)

    return () => window.removeEventListener(eventTypes.sidebar.toggle, listener)
  }, [])

  return open
}
