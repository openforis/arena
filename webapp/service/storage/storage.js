const keys = {
  sidebar: {
    open: 'sidebar-open',
  },
}

// ====== sidebar
export const isSidebarOpened = () => window.localStorage.getItem(keys.sidebar.open) === 'true'

export const setSidebarOpened = (value) => window.localStorage.setItem(keys.sidebar.open, String(value))
