import * as NodeDef from '@core/survey/nodeDef'

// ==== READ

const getNodeDefByUuid = (uuid) => (survey) => survey.nodeDefs[uuid] || null

const getNodeDefSource = (nodeDef) => (survey) =>
  NodeDef.isVirtual(nodeDef) ? getNodeDefByUuid(NodeDef.getUuid)(survey) : null

const calculateNodeDefChildren = (nodeDef, includeAnalysis = false) => (survey) => {
  const children = []
  if (NodeDef.isVirtual(nodeDef)) {
    // If nodeDef is virtual, get children from its source
    const entitySource = getNodeDefSource(nodeDef)(survey)
    children.push(...calculateNodeDefChildren(entitySource, includeAnalysis)(survey))
  }

  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  children.push(
    ...Object.values(survey.nodeDefs).filter((nodeDefCurrent) => {
      if (!includeAnalysis && NodeDef.isAnalysis(nodeDefCurrent)) {
        return false
      }
      if (NodeDef.isVirtual(nodeDefCurrent)) {
        // Include virtual entities having their source as a child of the given entity
        const entitySource = getNodeDefSource(nodeDefCurrent)(survey)
        return NodeDef.getParentUuid(entitySource) === nodeDefUuid
      }
      // "natural" child
      return NodeDef.getParentUuid(nodeDefCurrent) === nodeDefUuid
    })
  )
  return children
}

export const getNodeDefsIndex = (survey) => {
  const { nodeDefsIndex } = survey
  return nodeDefsIndex || {}
}

export const getNodeDefChildren = (nodeDef, includeAnalysis = false) => (survey) => {
  const { nodeDefsIndex } = survey
  if (!nodeDefsIndex) throw new Error('Node defs index not initialized')

  const childrenUuidsIndex = includeAnalysis
    ? nodeDefsIndex.childDefUuidsByParentUuidAnalysis
    : nodeDefsIndex.childDefUuidsByParentUuid
  const childDefUuids = childrenUuidsIndex[nodeDef.uuid] || []

  return childDefUuids.map((uuid) => getNodeDefByUuid(uuid)(survey))
}

export const assocNodeDefsIndex = ({ survey, nodeDefsIndex }) => ({ ...survey, nodeDefsIndex })

// ==== UPDATE

export const addNodeDefToIndex = ({ nodeDefsIndex, nodeDef }) => {
  const nodeDefsIndexUpdated = { ...nodeDefsIndex }
  // add node def uuid to parent node def children references
  const { parentUuid } = nodeDef
  if (parentUuid && !nodeDefsIndexUpdated.childDefUuidsByParentUuid[parentUuid].includes(nodeDef.uuid)) {
    nodeDefsIndexUpdated.childDefUuidsByParentUuid[parentUuid].push(nodeDef.uuid)
    nodeDefsIndexUpdated.childDefUuidsByParentUuidAnalysis[parentUuid].push(nodeDef.uuid)
  }
  return nodeDefsIndexUpdated
}

// ==== DELETE

export const deleteNodeDefIndex = ({ nodeDefsIndex, nodeDefDeleted }) => {
  const nodeDefsIndexUpdated = { ...nodeDefsIndex }
  delete nodeDefsIndexUpdated.childDefUuidsByParentUuid[nodeDefDeleted.uuid]
  delete nodeDefsIndexUpdated.childDefUuidsByParentUuidAnalysis[nodeDefDeleted.uuid]

  // remove node def deleted uuid from parent children references
  const { parentUuid } = nodeDefDeleted

  const deleteItem = ({ array, uuid }) => {
    const itemIdx = array.indexOf(uuid)
    const arrayUpdated = [...array]
    arrayUpdated.splice(itemIdx)
    return arrayUpdated
  }

  nodeDefsIndexUpdated.childDefUuidsByParentUuid[parentUuid] = deleteItem({
    array: nodeDefsIndexUpdated.childDefUuidsByParentUuid[parentUuid],
    uuid: nodeDefDeleted.uuid,
  })
  nodeDefsIndexUpdated.childDefUuidsByParentUuidAnalysis[parentUuid] = deleteItem({
    array: nodeDefsIndexUpdated.childDefUuidsByParentUuidAnalysis[parentUuid],
    uuid: nodeDefDeleted.uuid,
  })

  return nodeDefsIndexUpdated
}

// ==== CREATE

const initNodeDefIndex = ({ survey, nodeDef }) => {
  const { nodeDefsIndex } = survey
  const nodeDefsIndexUpdated = { ...nodeDefsIndex }
  if (NodeDef.isEntity(nodeDef)) {
    const children = calculateNodeDefChildren(nodeDef)(survey)
    const childrenAnalysis = calculateNodeDefChildren(nodeDef, true)(survey)
    nodeDefsIndexUpdated.childDefUuidsByParentUuid[nodeDef.uuid] = children.map(NodeDef.getUuid)
    nodeDefsIndexUpdated.childDefUuidsByParentUuidAnalysis[nodeDef.uuid] = childrenAnalysis.map(NodeDef.getUuid)
  }
  return addNodeDefToIndex({ nodeDefsIndex: nodeDefsIndexUpdated, nodeDef })
}

export const initNodeDefsIndex = (survey) => {
  let nodeDefsIndex = {
    childDefUuidsByParentUuidAnalysis: {},
    childDefUuidsByParentUuid: {},
  }
  const nodeDefsSorted = Object.values(survey.nodeDefs).sort((nodeDef1, nodeDef2) => nodeDef1.id - nodeDef2.id)
  nodeDefsSorted.forEach((nodeDef) => {
    nodeDefsIndex = initNodeDefIndex({ survey: { ...survey, nodeDefsIndex }, nodeDef })
  })
  return nodeDefsIndex
}
