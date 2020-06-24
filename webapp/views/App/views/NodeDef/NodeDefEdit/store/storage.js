const keys = {
  nodeDefState: 'nodeDef',
}

export const eventTypes = {
  setNodeDefState: 'node-def/set-node-def-state',
}

// ====== READ
export const getNodeDefState = () => {
  const state = window.localStorage.getItem(keys.nodeDefState)
  return state ? JSON.parse(state) : null
}

// ====== UPDATE
export const setNodeDefState = (state) => window.localStorage.setItem(keys.nodeDefState, JSON.stringify(state))

// ====== DELETE
export const clearNodeDefState = () => window.localStorage.removeItem(keys.nodeDefState)
