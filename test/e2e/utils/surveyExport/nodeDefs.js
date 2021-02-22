import * as R from 'ramda'

// TOFIX
import * as Survey from '@core/survey/survey'

import * as PromiseUtils from '../PromiseUtils'

import { getSurvey } from './utils'

import { ClusterNodeDefItems, PlotNodeDefItems, TreeNodeDefItems } from '../../resources/nodeDefs/nodeDefs'

const includeAnalysis = true

const checkNode = async ({ node, expectedNode }) => {
  const { props: nodeProps, type, analysis } = node
  const { name, labels, key } = nodeProps
  await expect(name).toBe(expectedNode.name)
  await expect(labels.en).toBe(expectedNode.label)
  await expect(type).toBe(expectedNode.type)
  await expect(key).toBe(expectedNode.isKey || false)
  await expect(analysis).toBe(expectedNode.isAnalysis || false)
}

export const checkNodeDefs = async ({ surveyExtractedPath }) => {
  const survey = getSurvey({ surveyExtractedPath })

  const root = Survey.getNodeDefRoot(survey)

  // Check cluster

  await expect(R.isNil(root.parentUuid)).toBe(true)
  await expect(root.props.name).toBe('cluster')
  await expect(root.props.labels.en).toBe('Cluster')

  const clusterDefChildren = Survey.getNodeDefChildren(root, includeAnalysis)(survey)

  await PromiseUtils.each(clusterDefChildren, async (item, index) =>
    checkNode({ node: item, expectedNode: ClusterNodeDefItems[index] })
  )

  // Check plot
  const plotNodeDef = clusterDefChildren.find((nodeDef) => nodeDef.props.multiple && nodeDef.props.name === 'plot')

  await expect(plotNodeDef).toBeTruthy()

  const plotNodeDefChildren = Survey.getNodeDefChildren(plotNodeDef, includeAnalysis)(survey)

  await PromiseUtils.each(plotNodeDefChildren, async (item, index) =>
    checkNode({ node: item, expectedNode: PlotNodeDefItems[index] })
  )

  // Check Country - Region - Province hierarchy
  const countryNode = plotNodeDefChildren.find((node) => node.props.name === 'country')
  const regionNode = plotNodeDefChildren.find((node) => node.props.name === 'region')
  const provinceNode = plotNodeDefChildren.find((node) => node.props.name === 'province')

  await expect(provinceNode.props.parentCodeDefUuid).toBe(regionNode.uuid)
  await expect(regionNode.props.parentCodeDefUuid).toBe(countryNode.uuid)
  await expect(countryNode.props.parentCodeDefUuid).toBe(null)

  await expect(countryNode.props.categoryUuid).toBeTruthy()
  await expect(countryNode.props.categoryUuid).toBe(regionNode.props.categoryUuid)
  await expect(regionNode.props.categoryUuid).toBe(provinceNode.props.categoryUuid)

  // Check tree
  const treeNodeDef = plotNodeDefChildren.find((node) => node.props.name === 'tree')
  await expect(treeNodeDef).toBeTruthy()
  const treeNodeDefChildren = Survey.getNodeDefChildren(treeNodeDef, includeAnalysis)(survey)

  await PromiseUtils.each(treeNodeDefChildren, async (item, index) =>
    checkNode({ node: item, expectedNode: TreeNodeDefItems[index] })
  )
}
