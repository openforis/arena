import path from 'path'
import fs from 'fs'

import * as PromiseUtils from '@core/promiseUtils'

import * as Record from '@core/record/record'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Survey from '@core/survey/survey'

import { getSurvey, checkFileAndGetContent } from './utils'

import { records as recordsMockData } from '../../resources/records/recordsData'

const includeAnalysis = true

const getSurveyNodeDefsToTest = ({ surveyExtractedPath }) => {
  const contentSurvey = fs.readFileSync(path.join(surveyExtractedPath, 'survey.json'), 'utf8')
  const survey = JSON.parse(contentSurvey)
  const root = Survey.getNodeDefRoot(survey)
  const clusterNodeDefDefChildren = Survey.getNodeDefChildren(root, includeAnalysis)(survey)
  const plotNodeDef = clusterNodeDefDefChildren.find(
    (nodeDef) => NodeDef.isMultiple(nodeDef) && NodeDef.getName(nodeDef) === 'plot'
  )
  const plotNodeDefChildren = Survey.getNodeDefChildren(plotNodeDef, includeAnalysis)(survey)
  const treeNodeDef = plotNodeDefChildren.find((node) => NodeDef.getName(node) === 'tree')
  const treeNodeDefChildren = Survey.getNodeDefChildren(treeNodeDef, includeAnalysis)(survey)

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
    mockNode.type === NodeDef.nodeDefType.coordinate &&
    Node.getCoordinateX(node) === String(mockNode.value.x) &&
    Node.getCoordinateY(node) === String(mockNode.value.y) &&
    `GCS WGS 1984 (EPSG:${Node.getCoordinateSrs(node)})` === String(mockNode.value.srs)
  ) {
    return true
  }
  if (
    mockNode.type === NodeDef.nodeDefType.code &&
    CategoryItem.getLabel('en')(Survey.getCategoryItemByUuid(Node.getCategoryItemUuid(node))(survey)) === mockNode.value
  ) {
    return true
  }
  return Node.getValue(node) === String(mockNode.value)
}
const findNodeWithSameValueAsMockNode = ({ nodes, mockNode, parentUuid, survey }) =>
  nodes.find((_node) => {
    if (parentUuid && Node.getParentUuid(_node) !== parentUuid) return false
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

  await expect(Record.getUuid(record)).toBe(recordUuid)

  const { clusterNodeDef, clusterNodeDefDefChildren, plotNodeDef, plotNodeDefChildren } = surveyNodeDefsToTest

  const clusterIdNodeDef = clusterNodeDefDefChildren.find((nodeDef) => NodeDef.getLabel(nodeDef, 'en') === 'Cluster id')

  const [clusterIdNode] = Record.getNodesByDefUuid(NodeDef.getUuid(clusterIdNodeDef))(record)

  const mockRecord = mockRecords.find(
    (_mockRecord) => String(_mockRecord.cluster[0].value) === String(Node.getValue(clusterIdNode))
  )

  // check record
  // check record -> root[cluster]
  const clusterNodeDefUuid = NodeDef.getUuid(clusterNodeDef)
  const clusterNode = Record.getNodesByDefUuid(clusterNodeDefUuid)(record)
  await expect(clusterNode).toBeTruthy()

  await Promise.all(
    mockRecord.cluster.map(async (mockNode) => {
      const nodeNodeDef = clusterNodeDefDefChildren.find(
        (nodeDef) => NodeDef.getLabel(nodeDef, 'en') === mockNode.label
      )
      const [node] = Record.getNodesByDefUuid(NodeDef.getUuid(nodeNodeDef))(record)

      if (nodeHasSameValueAsMockNode({ node, mockNode, survey })) {
        await expect(nodeHasSameValueAsMockNode({ node, mockNode, survey })).toBe(true)
      } else {
        await expect(mockNode).toBe(node)
      }
    })
  )

  // Check record -> plots
  const plotsNodes = Record.getNodesByDefUuid(NodeDef.getUuid(plotNodeDef))(record)
  await expect(plotsNodes.length).toBe(mockRecord.plots.length)

  await Promise.all(
    mockRecord.plots.map(async (mockPlot) => {
      const plotIdNodeDef = plotNodeDefChildren.find((nodeDef) => NodeDef.getLabel(nodeDef, 'en') === 'Plot id')
      const plotIdNodes = Record.getNodesByDefUuid(NodeDef.getUuid(plotIdNodeDef))(record)
      const plotIdNode = plotIdNodes.find(
        (_plotIdNode) => String(Node.getValue(_plotIdNode)) === String(mockPlot[0].value)
      )
      const plotUuid = Node.getParentUuid(plotIdNode)

      await Promise.all(
        mockPlot.map(async (mockNode) => {
          const nodeNodeDef = plotNodeDefChildren.find((nodeDef) => NodeDef.getLabel(nodeDef, 'en') === mockNode.label)
          const nodes = Record.getNodesByDefUuid(NodeDef.getUuid(nodeNodeDef))(record)
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

  const recordsUuids = records.map((record) => Record.getUuid(record))

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
