import * as R from 'ramda'

const record = 'record'
const current = 'current'

/**
 * ======================
 * Record State
 * ======================
 */
export const getRecordState = R.prop(record)

export const getCurrentRecord = R.prop(current)

export const getCurrentRecordId = R.pipe(getCurrentRecord, R.prop('id'))

export const getGlobalCurrentRecord = R.pipe(getRecordState, getCurrentRecord)

export const getGlobalCurrentRecordId = R.pipe(getGlobalCurrentRecord, R.prop('id'))

export const assocCurrentRecord = record => R.assoc(current, record)

export const deleteNodeAndChildren = (node, state) => {
  const record = getCurrentRecord(state)
  record.nodes = record.nodes.filter(n => n.id !== node.id && n.parentId !== node.id)
  return state
}

export const updateNodes = (nodes, state) => {
  const record = getCurrentRecord(state)
  nodes.forEach(updatedNode => {
    const index = R.findIndex(existingNode => existingNode.id === updatedNode.id)(record.nodes)
    if (index >= 0) {
      record.nodes[index] = updatedNode
    } else {
      record.nodes.push(updatedNode)
    }
  })
  return state
}
