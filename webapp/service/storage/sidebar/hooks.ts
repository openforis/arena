import { useEffect, useState } from 'react'

import * as SidebarStorage from './storage'

// ====== sidebar
export const useIsSidebarOpened = () => {
  const [open, setOpen] = useState(SidebarStorage.isSidebarOpened)

  useEffect(() => {
    const listener = () => setOpen(SidebarStorage.isSidebarOpened())

    window.addEventListener(SidebarStorage.eventTypes.toggle, listener)

    return () => window.removeEventListener(SidebarStorage.eventTypes.toggle, listener)
  }, [])

  return open
}
