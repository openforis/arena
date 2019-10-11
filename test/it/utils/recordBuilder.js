const R = require('ramda')

const db = require('../../../server/db/db')

const Survey = require('../../../core/survey/survey')
const NodeDef = require('../../../core/survey/nodeDef')
const Record = require('../../../core/record/record')
const Node = require('../../../core/record/node')

const RecordManager = require('../../../server/modules/record/manager/recordManager')

const RecordUtils = require('../utils/recordUtils')

class NodeBuilder {

  constructor (nodeDefName) {
    this.nodeDefName = nodeDefName
  }

}

class EntityBuilder extends NodeBuilder {

  constructor (nodeDefName, ...childBuilders) {
    super(nodeDefName)
    this.childBuilders = childBuilders
  }

  build (survey, parentNodeDef, recordUuid, parentNode) {
    const nodeDef = parentNodeDef
      ? Survey.getNodeDefChildByName(parentNodeDef, this.nodeDefName)(survey)
      : Survey.getNodeDefRoot(survey)

    const entity = Node.newNode(NodeDef.getUuid(nodeDef), recordUuid, parentNode)

    return R.pipe(
      R.map(childBuilder => childBuilder.build(survey, nodeDef, recordUuid, entity)),
      R.mergeAll,
      R.assoc(Node.getUuid(entity), entity)
    )(this.childBuilders)
  }

  async buildAndStore (user, survey, record, parentNode, t) {
    const nodeDef = Survey.getNodeDefByName(this.nodeDefName)(survey)

    let node
    if (NodeDef.isRoot(nodeDef)) {
      node = Record.getRootNode(record)
    } else if (NodeDef.isSingle(nodeDef)) {
      node = R.head(Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(nodeDef))(record))
    } else {
      node = Node.newNode(NodeDef.getUuid(nodeDef), Record.getUuid(record), parentNode)
      record = await RecordManager.persistNode(user, survey, record, node, null, null, t)
    }

    for (const childBuilder of this.childBuilders) {
      record = await childBuilder.buildAndStore(user, survey, record, node, t)
    }

    return record
  }
}

class AttributeBuilder extends NodeBuilder {

  constructor (nodeDefName, value = null) {
    super(nodeDefName)
    this.value = value
  }

  build (survey, parentNodeDef, recordUuid, parentNode) {
    const nodeDef = Survey.getNodeDefByName(this.nodeDefName)(survey)
    const attribute = Node.newNode(NodeDef.getUuid(nodeDef), recordUuid, parentNode, this.value)

    return {
      [Node.getUuid(attribute)]: attribute
    }
  }

  async buildAndStore (user, survey, record, parentNode, t) {
    const nodeDef = Survey.getNodeDefByName(this.nodeDefName)(survey)

    if (NodeDef.isReadOnly(nodeDef))
      return record

    const nodeInRecord = NodeDef.isSingle(nodeDef)
      ? R.head(Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(nodeDef))(record))
      : null

    const nodeToPersist = nodeInRecord
      ? Node.assocValue(this.value)(nodeInRecord)
      : Node.newNode(NodeDef.getUuid(nodeDef), Record.getUuid(record), parentNode, this.value)

    return await RecordManager.persistNode(user, survey, record, nodeToPersist, null, null, t)
  }

}

class RecordBuilder {

  constructor (user, survey, rootEntityBuilder) {
    this.survey = survey
    this.user = user
    this.rootEntityBuilder = rootEntityBuilder
  }

  build () {
    const record = RecordUtils.newRecord(this.user)
    const nodes = this.rootEntityBuilder.build(this.survey, null, Record.getUuid(record), null)
    return Record.assocNodes(nodes)(record)
  }

  async buildAndStore (client = db) {
    return await client.tx(async t => {
      const record = await RecordUtils.insertAndInitRecord(this.user, this.survey, false, t)

      return await this.rootEntityBuilder.buildAndStore(this.user, this.survey, record, null, t)
    })
  }
}

module.exports = {
  record: (user, survey, rootEntityBuilder) => new RecordBuilder(user, survey, rootEntityBuilder),
  entity: (nodeDefName, ...childBuilders) => new EntityBuilder(nodeDefName, ...childBuilders),
  attribute: (nodeDefName, value = null) => new AttributeBuilder(nodeDefName, value)
}