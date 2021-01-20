import * as NodeDef from '@core/survey/nodeDef'

export const baseClusterNodeDefItems = [
  { type: 'integer', name: 'cluster_id', label: 'Cluster id', isKey: true },
  { type: 'decimal', name: 'cluster_decimal', label: 'Cluster decimal' }, // propsAdvanced.defaultValues, expression "0", apply if null
  { type: 'date', name: 'cluster_date', label: 'Cluster date' }, // "applyIf": "", "expression": "cluster_decimal > '0'\n"
  { type: 'time', name: 'cluster_time', label: 'Cluster time' },
  { type: 'boolean', name: 'cluster_boolean', label: 'Cluster boolean' }, // "applyIf": "cluster_decimal > '5'\n", "expression": "\"true\""
  { type: 'coordinate', name: 'cluster_coordinate', label: 'Cluster coordinate' },
]

export const plotNodeDef = { type: 'entity', name: 'plot', label: 'Plot', isMultiple: true }
export const ClusterNodeDefItems = [...baseClusterNodeDefItems, plotNodeDef]

export const basePlotNodeDefItems = [
  { type: NodeDef.nodeDefType.integer, name: 'plot_id', label: 'Plot id', isKey: true },
  { type: NodeDef.nodeDefType.text, name: 'plot_text', label: 'Plot text', isKey: false },
  { type: NodeDef.nodeDefType.file, name: 'plot_file', label: 'Plot file', isKey: false },
]
export const treeNodeDef = { type: NodeDef.nodeDefType.entity, name: 'tree', label: 'Tree', isKey: false } // "multiple":true,"renderType":"table"

export const countryNodeDef = { type: NodeDef.nodeDefType.code, name: 'country', label: 'Country', isKey: false }
export const regionNodeDef = { type: NodeDef.nodeDefType.code, name: 'region', label: 'Region', isKey: false }
export const provinceNodeDef = { type: NodeDef.nodeDefType.code, name: 'province', label: 'Province', isKey: false }

export const PlotNodeDefItems = [...basePlotNodeDefItems, treeNodeDef, countryNodeDef, regionNodeDef, provinceNodeDef]

export const baseTreeNodeDefItems = [
  { type: 'integer', name: 'tree_id', label: 'Tree id', isKey: true },
  { type: 'decimal', name: 'tree_dec_1', label: 'Tree decimal 1', isKey: false },
  { type: 'decimal', name: 'tree_dec_2', label: 'Tree decimal 2', isKey: false },
]
export const treeSpeciesNodeDef = {
  type: NodeDef.nodeDefType.taxon,
  name: 'tree_species',
  label: 'Tree Species',
  isKey: false,
}

export const treeVolumeAttributeNodeDef = {
  type: 'decimal',
  name: 'tree_volume',
  label: 'Tree volume label (C)',
  isKey: false,
  isAnalysis: true,
  descriptions: 'Tree volume description',
}
export const TreeNodeDefItems = [...baseTreeNodeDefItems, treeSpeciesNodeDef, treeVolumeAttributeNodeDef]
