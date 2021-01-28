import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as PromiseUtils from '@core/promiseUtils'

import { getSurvey } from './utils'

import { ClusterNodeDefItems, PlotNodeDefItems, TreeNodeDefItems } from '../../resources/nodeDefs/nodeDefs'

const includeAnalysis = true

const checkNode = async ({ node, expectedNode }) => {
  await expect(NodeDef.getName(node)).toBe(expectedNode.name)
  await expect(NodeDef.getLabel(node, 'en')).toBe(expectedNode.label)
  await expect(NodeDef.getType(node)).toBe(expectedNode.type)
  await expect(NodeDef.isKey(node)).toBe(expectedNode.isKey || false)
  await expect(NodeDef.isAnalysis(node)).toBe(expectedNode.isAnalysis || false)
}

export const checkNodeDefs = async ({ surveyExtractedPath }) => {
  const survey = getSurvey({ surveyExtractedPath })

  const root = Survey.getNodeDefRoot(survey)

  // Check cluster
  await expect(NodeDef.isRoot(root)).toBe(true)
  await expect(NodeDef.getName(root)).toBe('cluster')
  await expect(NodeDef.getLabel(root, 'en')).toBe('Cluster')

  const clusterDefChildren = Survey.getNodeDefChildren(root, includeAnalysis)(survey)

  await PromiseUtils.each(clusterDefChildren, async (item, index) =>
    checkNode({ node: item, expectedNode: ClusterNodeDefItems[index] })
  )

  // Check plot
  const plotNodeDef = clusterDefChildren.find(
    (nodeDef) => NodeDef.isMultiple(nodeDef) && NodeDef.getName(nodeDef) === 'plot'
  )

  await expect(plotNodeDef).toBeTruthy()

  const plotNodeDefChildren = Survey.getNodeDefChildren(plotNodeDef, includeAnalysis)(survey)

  await PromiseUtils.each(plotNodeDefChildren, async (item, index) =>
    checkNode({ node: item, expectedNode: PlotNodeDefItems[index] })
  )

  // Check Country - Region - Province hierarchy
  const countryNode = plotNodeDefChildren.find((node) => NodeDef.getName(node) === 'country')
  const regionNode = plotNodeDefChildren.find((node) => NodeDef.getName(node) === 'region')
  const provinceNode = plotNodeDefChildren.find((node) => NodeDef.getName(node) === 'province')

  await expect(NodeDef.getParentCodeDefUuid(provinceNode)).toBe(NodeDef.getUuid(regionNode))
  await expect(NodeDef.getParentCodeDefUuid(regionNode)).toBe(NodeDef.getUuid(countryNode))
  await expect(NodeDef.getParentCodeDefUuid(countryNode)).toBe(null)

  await expect(NodeDef.getCategoryUuid(countryNode)).toBeTruthy()
  await expect(NodeDef.getCategoryUuid(countryNode)).toBe(NodeDef.getCategoryUuid(regionNode))
  await expect(NodeDef.getCategoryUuid(regionNode)).toBe(NodeDef.getCategoryUuid(provinceNode))

  // Check tree
  const treeNodeDef = plotNodeDefChildren.find((node) => NodeDef.getName(node) === 'tree')
  await expect(treeNodeDef).toBeTruthy()
  const treeNodeDefChildren = Survey.getNodeDefChildren(treeNodeDef, includeAnalysis)(survey)

  await PromiseUtils.each(treeNodeDefChildren, async (item, index) =>
    checkNode({ node: item, expectedNode: TreeNodeDefItems[index] })
  )
}
