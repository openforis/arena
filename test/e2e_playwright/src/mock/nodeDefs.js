const createAttribute = (name, label, type, key = false) => ({
  name,
  label,
  type,
  key,
})

const createEntity = (name, label, type, children = null) => ({
  name,
  label,
  type,
  children,
})

export const cluster = createEntity('cluster', 'Cluster', 'entity', {
  cluster_id: createAttribute('cluster_id', 'Cluster id', 'integer', true),
  cluster_decimal: createAttribute('cluster_decimal', 'Cluster decimal', 'decimal'),
  cluster_date: createAttribute('cluster_date', 'Cluster date', 'date'),
  cluster_time: createAttribute('cluster_time', 'Cluster time', 'time'),
  cluster_boolean: createAttribute('cluster_boolean', 'Cluster boolean', 'boolean'),
  cluster_coordinate: createAttribute('cluster_coordinate', 'Cluster coordinate', 'coordinate'),
})
