import { cluster, plot, tree } from '../../mock/nodeDefs'
import { verifyAttribute } from './verifyAttributes'
import { getTreeSelector } from './utils'

/* eslint-disable camelcase */
const {
  cluster_id,
  cluster_decimal,
  cluster_time,
  cluster_boolean,
  cluster_coordinate,
  cluster_region,
  cluster_province,
} = cluster.children
const { plot_id, plot_text } = plot.children
const { tree_id, tree_dec_1, tree_dec_2, tree_species } = tree.children

export const verifyCluster = (record) =>
  describe(`Verify ${cluster.name} values`, () => {
    verifyAttribute(cluster_id, record[cluster_id.name])
    verifyAttribute(cluster_boolean, record[cluster_boolean.name])
    verifyAttribute(cluster_decimal, record[cluster_decimal.name])
    verifyAttribute(cluster_region, record[cluster_region.name])
    verifyAttribute(cluster_province, record[cluster_province.name])
    verifyAttribute(cluster_coordinate, record[cluster_coordinate.name])
    verifyAttribute(cluster_time, record[cluster_time.name])
  })

export const verifyPlot = (record) =>
  describe(`Verify ${plot.name} values`, () => {
    verifyAttribute(plot_id, record[plot_id.name])
    verifyAttribute(plot_text, record[plot_text.name])
  })

export const verifyTrees = (record) => {
  const { trees } = record

  describe.each(Array.from(Array(trees.length).keys()))(`Verify tree %s`, (treeIdx) => {
    const treeEntry = trees[treeIdx]
    const treeSelector = getTreeSelector(treeIdx)

    verifyAttribute(tree_id, treeEntry[tree_id.name], treeSelector)
    verifyAttribute(tree_dec_1, treeEntry[tree_dec_1.name], treeSelector)
    verifyAttribute(tree_dec_2, treeEntry[tree_dec_2.name], treeSelector)
    verifyAttribute(tree_species, treeEntry[tree_species.name], treeSelector)
  })
}
