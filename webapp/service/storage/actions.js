import * as storage from './storage'
import eventTypes from './eventTypes'

// ====== sidebar
export const toggleSidebar = () => {
  const opened = storage.isSidebarOpened()
  storage.setSidebarOpened(!opened)
  window.dispatchEvent(new CustomEvent(eventTypes.sidebar.toggle))
}
