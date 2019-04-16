const R = require('ramda')

const db = require('../../../server/db/db')

const Survey = require('../../../common/survey/survey')
const NodeDef = require('../../../common/survey/nodeDef')
const Record = require('../../../common/record/record')
const Node = require('../../../common/record/node')

const RecordRepository = require('../../../server/modules/record/persistence/recordRepository')
const NodeRepository = require('../../../server/modules/record/persistence/nodeRepository')
const RecordManager = require('../../../server/modules/record/persistence/recordManager')

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
      : Survey.getRootNodeDef(survey)

    const entity = Node.newNode(NodeDef.getUuid(nodeDef), recordUuid, parentNode)

    return R.pipe(
      R.map(childBuilder => childBuilder.build(survey, nodeDef, recordUuid, entity)),
      R.mergeAll,
      R.assoc(Node.getUuid(entity), entity)
    )(this.childBuilders)
  }

}

class AttributeBuilder extends NodeBuilder {

  constructor (nodeDefName, value = null) {
    super(nodeDefName)
    this.value = value
  }

  build (survey, parentNodeDef, recordUuid, parentNode) {
    const nodeDef = Survey.getNodeDefChildByName(parentNodeDef, this.nodeDefName)(survey)
    const attribute = Node.newNode(NodeDef.getUuid(nodeDef), recordUuid, parentNode, this.value)

    return {
      [Node.getUuid(attribute)]: attribute
    }
  }
}

class RecordBuilder {

  constructor (user, survey, rootEntityBuilder) {
    this.survey = survey
    this.user = user
    this.rootEntityBuilder = rootEntityBuilder
  }

  build () {
    const record = Record.newRecord(this.user)
    const nodes = this.rootEntityBuilder.build(this.survey, null, Record.getUuid(record), null)
    return Record.assocNodes(nodes)(record)
  }

  async buildAndStore (client = db) {
    return await client.tx(async t => {
      const record = this.build()
      const surveyId = Survey.getId(this.survey)
      await RecordRepository.insertRecord(surveyId, record, t)

      await Record.traverse(
        async node => {
          await NodeRepository.insertNode(surveyId, node, t)
        }
      )(record)

      return RecordManager.fetchRecordAndNodesByUuid(surveyId, Record.getUuid(record), t)
    })
  }
}

module.exports = {
  record: (user, survey, rootEntityBuilder) => new RecordBuilder(user, survey, rootEntityBuilder),
  entity: (nodeDefName, ...childBuilders) => new EntityBuilder(nodeDefName, ...childBuilders),
  attribute: (nodeDefName, value = null) => new AttributeBuilder(nodeDefName, value)
}