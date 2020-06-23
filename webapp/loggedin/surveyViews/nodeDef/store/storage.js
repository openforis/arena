const keys = {
  nodeDef: 'nodeDef',
}

export const eventTypes = {
  setNodeDef: 'node-def/set-node-def',
}

// ====== READ
export const getNodeDef = () => {
  const nodeDef = window.localStorage.getItem(keys.nodeDef)
  return nodeDef ? JSON.parse(nodeDef) : null
}

// ====== UPDATE
export const setNodeDef = ({ nodeDef }) => window.localStorage.setItem(keys.nodeDef, JSON.stringify(nodeDef))

// ====== DELETE
export const clearNodeDef = () => window.localStorage.removeItem(keys.nodeDef)
