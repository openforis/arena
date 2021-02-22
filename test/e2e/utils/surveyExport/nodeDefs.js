import * as R from 'ramda'

import PromiseUtils from '../PromiseUtils'

import { getSurvey } from './utils'

import { ClusterNodeDefItems, PlotNodeDefItems, TreeNodeDefItems } from '../../resources/nodeDefs/nodeDefs'

const includeAnalysis = true

const getLabel = ({ nodeDef, lang }) => {
  const { props: nodeProps, type, analysis } = nodeDef
  const { name, labels, virtual = false } = nodeProps

  const label = labels[lang] || name

  if (virtual) {
    return `${label}${' (V)'}`
  }

  if (analysis && type !== 'entity') {
    return `${label}${' (C)'}`
  }

  return label
}

const isRoot = (nodeDef) => R.isNil(nodeDef.parentUuid)

export const getNodeDefsArray = (survey) => Object.values(survey.nodeDefs)

export const getNodeDefRoot = R.pipe(getNodeDefsArray, R.find(isRoot))

export const getNodeDefByUuid = (uuid) => R.pipe(R.propOr({}, 'nodeDefs'), R.propOr(null, uuid))

export const getNodeDefSource = (nodeDef) => (nodeDef.virtual ? getNodeDefByUuid(nodeDef.parentUuid) : null)

const getNodeDefChildren = (nodeDef, _includeAnalysis = false) => (survey) => {
  const children = []
  if (nodeDef.virtual) {
    // If nodeDef is virtual, get children from its source
    const entitySource = getNodeDefSource(nodeDef)(survey)
    children.push(...getNodeDefChildren(entitySource, _includeAnalysis)(survey))
  }

  const { uuid: nodeDefUuid } = nodeDef
  children.push(
    ...R.pipe(
      getNodeDefsArray,
      R.filter((nodeDefCurrent) => {
        if (nodeDefCurrent.analysis && !_includeAnalysis) {
          return false
        }
        if (nodeDefCurrent.virtual) {
          // Include virtual entities having their source as a child of the given entity
          const entitySource = getNodeDefSource(nodeDefCurrent)(survey)
          return entitySource.parentUuid === nodeDefUuid
        }
        // "natural" child
        return nodeDefCurrent.parentUuid === nodeDefUuid
      })
    )(survey)
  )
  return children
}

const checkNode = async ({ node, expectedNode }) => {
  const { props: nodeProps, type, analysis } = node
  const { name, key = false } = nodeProps
  await expect(name).toBe(expectedNode.name)
  await expect(getLabel({ nodeDef: node, lang: 'en' })).toBe(expectedNode.label)
  await expect(type).toBe(expectedNode.type)
  await expect(key).toBe(expectedNode.isKey || false)
  await expect(analysis).toBe(expectedNode.isAnalysis || false)
}

export const checkNodeDefs = async ({ surveyExtractedPath }) => {
  const survey = getSurvey({ surveyExtractedPath })

  const root = getNodeDefRoot(survey)

  // Check cluster
  await expect(R.isNil(root.parentUuid)).toBe(true)
  await expect(root.props.name).toBe('cluster')
  await expect(root.props.labels.en).toBe('Cluster')

  const clusterDefChildren = getNodeDefChildren(root, includeAnalysis)(survey)

  await PromiseUtils.each(clusterDefChildren, async (item, index) =>
    checkNode({ node: item, expectedNode: ClusterNodeDefItems[index] })
  )

  // Check plot
  const plotNodeDef = clusterDefChildren.find((nodeDef) => nodeDef.props.multiple && nodeDef.props.name === 'plot')

  await expect(plotNodeDef).toBeTruthy()

  const plotNodeDefChildren = getNodeDefChildren(plotNodeDef, includeAnalysis)(survey)

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
  const treeNodeDefChildren = getNodeDefChildren(treeNodeDef, includeAnalysis)(survey)

  await PromiseUtils.each(treeNodeDefChildren, async (item, index) =>
    checkNode({ node: item, expectedNode: TreeNodeDefItems[index] })
  )
}
