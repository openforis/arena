const R = require('ramda')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')

const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')

const RecordUpdater = require('../../../record/update/thread/helpers/recordUpdater')

const insertMissingSingleNodes = async (survey, record, user, tx) => {
  let allInsertedNodes = {}
  await traverseEntities(survey, record,
    async (entityDef, entity) => {
      const childDefs = Survey.getNodeDefChildren(entityDef)(survey)
      for (const childDef of childDefs) {
        const insertedNodes = await insertMissingSingleNode(survey, childDef, record, entity, user, tx)
        allInsertedNodes = R.mergeRight(allInsertedNodes, insertedNodes)
      }
    }
  )
  return Record.assocNodes(allInsertedNodes)(record)
}

const insertMissingSingleNode = async (survey, childDef, record, parentNode, user, tx) => {
  // insert single nodes (if not inserted already)
  if (NodeDef.isNodeDefSingle(childDef)) {
    const children = Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(childDef))(record)
    if (R.isEmpty(children)) {
      const childNode = Node.newNode(NodeDef.getUuid(childDef), Record.getUuid(record), Node.getUuid(parentNode))
      return await new RecordUpdater().insertNode(survey, record, childNode, user, tx)
    }
  } else {
    return {}
  }
}

const traverseEntities = async (survey, record, visitor) => {
  const traverseEntity = async (entityDef, entity) => {
    await visitor(entityDef, entity)

    const childDefs = Survey.getNodeDefChildren(entityDef)(survey)
    const entityDefs = R.filter(NodeDef.isNodeDefEntity)(childDefs)
    for (const childDef of entityDefs) {
      const children = Record.getNodeChildrenByDefUuid(entity, childDef)
      for (const child of children) {
        await traverseEntity(childDef, child)
      }
    }
  }

  await traverseEntity(Survey.getRootNodeDef(survey), Record.getRootNode(record))
}

module.exports = {
  insertMissingSingleNodes
}