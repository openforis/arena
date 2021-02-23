import path from 'path'
import fs from 'fs'

import PromiseUtils from '../PromiseUtils'
import { getSurvey, checkFileAndGetContent } from './utils'

import { getLabel as getCategoryLabel } from './categories'
import { getNodeDefChildren, getNodeDefRoot } from './nodeDefs'

import { records as recordsMockData } from '../../resources/records/recordsData'

const includeAnalysis = true

const getNodesByDefUuid = (nodeDefUuid) => (record) => {
  const nodesUuidByNodeDefUuid = record._nodesByDef[nodeDefUuid]
  return nodesUuidByNodeDefUuid.map((nodeUuid) => record.nodes[nodeUuid])
}

const getSurveyNodeDefsToTest = ({ surveyExtractedPath }) => {
  const contentSurvey = fs.readFileSync(path.join(surveyExtractedPath, 'survey.json'), 'utf8')
  const survey = JSON.parse(contentSurvey)
  const root = getNodeDefRoot(survey)
  const clusterNodeDefDefChildren = getNodeDefChildren(root, includeAnalysis)(survey)
  const plotNodeDef = clusterNodeDefDefChildren.find(
    (nodeDef) => nodeDef.props.multiple && nodeDef.props.name === 'plot'
  )
  const plotNodeDefChildren = getNodeDefChildren(plotNodeDef, includeAnalysis)(survey)
  const treeNodeDef = plotNodeDefChildren.find((node) => node.props.name === 'tree')
  const treeNodeDefChildren = getNodeDefChildren(treeNodeDef, includeAnalysis)(survey)

  return {
    clusterNodeDef: root,
    clusterNodeDefDefChildren,
    plotNodeDef,
    plotNodeDefChildren,
    treeNodeDef,
    treeNodeDefChildren,
  }
}

const nodeHasSameValueAsMockNode = ({ node, mockNode, survey }) => {
  if (
    mockNode.type === 'coordinate' &&
    node.value.x === String(mockNode.value.x) &&
    node.value.y === String(mockNode.value.y) &&
    `GCS WGS 1984 (EPSG:${node.value.srs})` === String(mockNode.value.srs)
  ) {
    return true
  }
  const categoyItem = survey._indexRefData.categoryItemUuidIndex[node.value.itemUuid]

  if (
    mockNode.type === 'code' &&
    getCategoryLabel({ labels: categoyItem.props.labels, lang: 'en', code: categoyItem.props.code }) === mockNode.value
  ) {
    return true
  }
  return node.value === String(mockNode.value)
}
const findNodeWithSameValueAsMockNode = ({ nodes, mockNode, parentUuid, survey }) =>
  nodes.find((_node) => {
    if (parentUuid && _node.parentUuid !== parentUuid) return false
    return nodeHasSameValueAsMockNode({ node: _node, mockNode, survey })
  })

const checkRecordFileAndContent = async ({
  recordUuid,
  mockRecords,
  surveyNodeDefsToTest,
  survey,
  surveyExtractedPath,
}) => {
  const record = await checkFileAndGetContent({
    filePath: path.join(surveyExtractedPath, 'records', `${recordUuid}.json`),
  })

  await expect(record.uuid).toBe(recordUuid)

  const { clusterNodeDef, clusterNodeDefDefChildren, plotNodeDef, plotNodeDefChildren } = surveyNodeDefsToTest

  const clusterIdNodeDef = clusterNodeDefDefChildren.find((nodeDef) => nodeDef.props.labels.en === 'Cluster id')

  const [clusterIdNode] = getNodesByDefUuid(clusterIdNodeDef.uuid)(record)

  const mockRecord = mockRecords.find(
    (_mockRecord) => String(_mockRecord.cluster[0].value) === String(clusterIdNode.value)
  )

  // check record
  // check record -> root[cluster]
  const { uuid: clusterNodeDefUuid } = clusterNodeDef
  const clusterNode = getNodesByDefUuid(clusterNodeDefUuid)(record)
  await expect(clusterNode).toBeTruthy()

  await Promise.all(
    mockRecord.cluster.map(async (mockNode) => {
      const nodeNodeDef = clusterNodeDefDefChildren.find((nodeDef) => nodeDef.props.labels.en === mockNode.label)
      const [node] = getNodesByDefUuid(nodeNodeDef.uuid)(record)

      if (nodeHasSameValueAsMockNode({ node, mockNode, survey })) {
        await expect(nodeHasSameValueAsMockNode({ node, mockNode, survey })).toBe(true)
      } else {
        await expect(mockNode).toBe(node)
      }
    })
  )

  // Check record -> plots
  const plotsNodes = getNodesByDefUuid(plotNodeDef.uuid)(record)
  await expect(plotsNodes.length).toBe(mockRecord.plots.length)

  await Promise.all(
    mockRecord.plots.map(async (mockPlot) => {
      const plotIdNodeDef = plotNodeDefChildren.find((nodeDef) => nodeDef.props.labels.en === 'Plot id')
      const plotIdNodes = getNodesByDefUuid(plotIdNodeDef.uuid)(record)
      const plotIdNode = plotIdNodes.find(
        (_plotIdNode) => mockPlot && mockPlot[0] && String(_plotIdNode.value) === String(mockPlot[0].value)
      )
      const plotUuid = plotIdNode?.parentUuid || false

      await Promise.all(
        mockPlot.map(async (mockNode) => {
          const nodeNodeDef = plotNodeDefChildren.find((nodeDef) => nodeDef.props.labels.en === mockNode.label)
          const nodes = getNodesByDefUuid(nodeNodeDef.uuid)(record)
          await expect(nodes.length).toBe(mockRecord.plots.length)

          const node = findNodeWithSameValueAsMockNode({ nodes, mockNode, parentUuid: plotUuid, survey })

          await expect(node).toBeTruthy()
        })
      )
    })
  )
}

export const checkRecordsEmpty = async ({ surveyExtractedPath }) => {
  const records = await checkFileAndGetContent({
    filePath: path.join(surveyExtractedPath, 'records', 'records.json'),
  })

  await expect(records.length).toBe(0)
}

export const checkRecords = async ({ surveyExtractedPath }) => {
  const records = await checkFileAndGetContent({
    filePath: path.join(surveyExtractedPath, 'records', 'records.json'),
  })

  await expect(records.length).toBe(5)

  const survey = getSurvey({ surveyExtractedPath })

  const recordsUuids = records.map((record) => record.uuid)

  const surveyNodeDefsToTest = getSurveyNodeDefsToTest({ surveyExtractedPath })

  await PromiseUtils.each(recordsUuids, async (recordUuid) =>
    checkRecordFileAndContent({
      recordUuid,
      mockRecords: recordsMockData,
      surveyNodeDefsToTest,
      survey,
      surveyExtractedPath,
    })
  )
}
