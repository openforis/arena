const keys = {
  open: 'sidebar-open',
}

export const eventTypes = {
  toggle: 'sidebar-toggle',
}

// ====== READ
export const isSidebarOpened = () => window.localStorage.getItem(keys.open) === 'true'

// ====== UPDATE
export const setSidebarOpened = (value) => window.localStorage.setItem(keys.open, String(value))
