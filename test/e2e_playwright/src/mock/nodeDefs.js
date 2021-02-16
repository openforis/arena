const createNodeDef = (name, label, type, children = null) => ({
  name,
  label,
  type,
  children,
})

export const cluster = createNodeDef('cluster', 'Cluster', 'entity', {})
