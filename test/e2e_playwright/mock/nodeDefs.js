import { categories } from './categories'

const nodeDefCompositeTypes = ['entity', 'code', 'taxon']

const createAttribute = (name, label, type, key = false) => ({
  name,
  label,
  type,
  key,
})

const createCode = (name, label, category, parent = null, key = false) => ({
  ...createAttribute(name, label, 'code', key),
  category,
  parent,
})

const createEntity = (name, label, children = null) => ({
  name,
  label,
  type: 'entity',
  children,
})

export const cluster = createEntity('cluster', 'Cluster', {
  cluster_id: createAttribute('cluster_id', 'Cluster id', 'integer', true),
  cluster_decimal: createAttribute('cluster_decimal', 'Cluster decimal', 'decimal'),
  cluster_date: createAttribute('cluster_date', 'Cluster date', 'date'),
  cluster_time: createAttribute('cluster_time', 'Cluster time', 'time'),
  cluster_boolean: createAttribute('cluster_boolean', 'Cluster boolean', 'boolean'),
  cluster_coordinate: createAttribute('cluster_coordinate', 'Cluster coordinate', 'coordinate'),
  cluster_country: createCode('cluster_country', 'Cluster country', categories.administrative_unit.name),
  cluster_region: createCode(
    'cluster_region',
    'Cluster region',
    categories.administrative_unit.name,
    'cluster_country'
  ),
  cluster_province: createCode(
    'cluster_province',
    'Cluster province',
    categories.administrative_unit.name,
    'cluster_region'
  ),
  plot: createEntity('plot', 'Plot', {
    plot_id: createAttribute('plot_id', 'Plot id', 'integer', true),
    plot_text: createAttribute('plot_text', 'Plot text', 'text'),
    plot_file: createAttribute('plot_file', 'Plot file', 'file'),
    tree: createEntity('tree', 'Tree', {
      tree_id: createAttribute('tree_id', 'Tree id', 'integer', true),
      tree_dec_1: createAttribute('tree_dec_1', 'Tree decimal 1', 'decimal'),
      tree_dec_2: createAttribute('tree_dec_2', 'Tree decimal 2', 'decimal'),
      tree_species: createAttribute('tree_species', 'Tree Species', 'taxon'),
    }),
  }),
})

export const { plot } = cluster.children
export const { tree } = plot.children

export const getAtomicAttributeKeys = (nodeDef) =>
  Object.keys(nodeDef.children).filter((key) => !nodeDefCompositeTypes.includes(nodeDef.children[key].type))
