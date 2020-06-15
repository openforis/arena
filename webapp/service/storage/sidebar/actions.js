import * as SidebarStorage from './storage'

// ====== sidebar
export const toggleSidebar = () => {
  const opened = SidebarStorage.isSidebarOpened()
  SidebarStorage.setSidebarOpened(!opened)
  window.dispatchEvent(new CustomEvent(SidebarStorage.eventTypes.toggle))
}
