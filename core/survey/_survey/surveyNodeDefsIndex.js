import * as NodeDef from '@core/survey/nodeDef'

// ==== READ

const getNodeDefByUuid = (uuid) => (survey) => survey.nodeDefs[uuid] || null

const getNodeDefSource = (nodeDef) => (survey) =>
  NodeDef.isVirtual(nodeDef) ? getNodeDefByUuid(NodeDef.getUuid)(survey) : null

const calculateNodeDefChildren = (nodeDef) => (survey) => {
  const children = []
  if (NodeDef.isVirtual(nodeDef)) {
    // If nodeDef is virtual, get children from its source
    const entitySource = getNodeDefSource(nodeDef)(survey)
    children.push(...calculateNodeDefChildren(entitySource)(survey))
  }

  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  children.push(
    ...Object.values(survey.nodeDefs).filter((nodeDefCurrent) => {
      if (NodeDef.isAnalysis(nodeDefCurrent)) {
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

export const getNodeDefChildren = (nodeDef) => (survey) => {
  const { nodeDefsIndex } = survey
  if (!nodeDefsIndex) throw new Error('Node defs index not initialized')

  const childrenUuidsIndex = nodeDefsIndex.childDefUuidsByParentUuid

  let actualEntityUuid = nodeDef?.uuid
  if (NodeDef.isVirtual(nodeDef)) {
    const entitySource = getNodeDefSource(nodeDef)(survey)
    actualEntityUuid = entitySource?.uuid
  }
  const childDefUuids = childrenUuidsIndex[actualEntityUuid] || []

  return childDefUuids.map((uuid) => getNodeDefByUuid(uuid)(survey))
}

export const assocNodeDefsIndex = ({ survey, nodeDefsIndex }) => ({ ...survey, nodeDefsIndex })

// ==== UPDATE

export const addNodeDefToIndex = ({ nodeDefsIndex, nodeDef }) => {
  const nodeDefsIndexUpdated = { ...nodeDefsIndex }

  if (NodeDef.isVirtual(nodeDef)) {
    // no need to add items to the index
    return nodeDefsIndexUpdated
  }

  // add node def uuid to parent node def children references
  const { parentUuid } = nodeDef
  if (parentUuid) {
    const parentChildDefUuids = nodeDefsIndexUpdated.childDefUuidsByParentUuid[parentUuid] || []
    if (parentChildDefUuids.includes(nodeDef.uuid)) return nodeDefsIndexUpdated

    parentChildDefUuids.push(nodeDef.uuid)
    nodeDefsIndexUpdated.childDefUuidsByParentUuid[parentUuid] = parentChildDefUuids
  }
  return nodeDefsIndexUpdated
}

// ==== DELETE

export const deleteNodeDefIndex = ({ nodeDefsIndex, nodeDef }) => {
  const nodeDefsIndexUpdated = { ...nodeDefsIndex }

  delete nodeDefsIndexUpdated.childDefUuidsByParentUuid[nodeDef.uuid]

  // remove node def deleted uuid from parent children references
  const { parentUuid } = nodeDef

  const deleteItem = ({ array = [], uuid }) => array.filter((itemId) => itemId !== uuid)

  nodeDefsIndexUpdated.childDefUuidsByParentUuid[parentUuid] = deleteItem({
    array: nodeDefsIndexUpdated.childDefUuidsByParentUuid[parentUuid],
    uuid: nodeDef.uuid,
  })

  return nodeDefsIndexUpdated
}

// ==== CREATE

const initNodeDefIndex = ({ survey, nodeDef }) => {
  const { nodeDefsIndex } = survey
  const nodeDefsIndexUpdated = { ...nodeDefsIndex }
  if (NodeDef.isEntity(nodeDef)) {
    const children = calculateNodeDefChildren(nodeDef)(survey)
    nodeDefsIndexUpdated.childDefUuidsByParentUuid[nodeDef.uuid] = children.map(NodeDef.getUuid)
  }
  return addNodeDefToIndex({ nodeDefsIndex: nodeDefsIndexUpdated, nodeDef })
}

export const initNodeDefsIndex = (survey) => {
  let nodeDefsIndex = {
    childDefUuidsByParentUuid: {},
  }
  const nodeDefsSorted = Object.values(survey.nodeDefs).sort((nodeDef1, nodeDef2) => nodeDef1.id - nodeDef2.id)
  nodeDefsSorted.forEach((nodeDef) => {
    nodeDefsIndex = initNodeDefIndex({ survey: { ...survey, nodeDefsIndex }, nodeDef })
  })
  return nodeDefsIndex
}

export const initAndAssocNodeDefsIndex = (survey) => {
  const nodeDefsIndex = initNodeDefsIndex(survey)
  return { ...survey, nodeDefsIndex }
}
