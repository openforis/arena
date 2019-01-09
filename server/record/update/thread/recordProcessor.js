const R = require('ramda')
const Promise = require('bluebird')

const SurveyUtils = require('../../../../common/survey/surveyUtils')
const NodeDef = require('../../../../common/survey/nodeDef')
const Node = require('../../../../common/record/node')
const Record = require('../../../../common/record/record')

const RecordRepository = require('../../../record/recordRepository')
const NodeDefRepository = require('../../../nodeDef/nodeDefRepository')
const NodeRepository = require('../../../record/nodeRepository')
const inMemoryNodeRepository = require('./inMemoryNodeRepository')

const ActivityLog = require('../../../activityLog/activityLogger')

class RecordProcessor {

  constructor (preview) {
    this.preview = preview
    this.recordPreview = preview ? {uuid: 'preview'} : null
    this.nodeRepository = preview ? inMemoryNodeRepository : NodeRepository
  }

  isPreview () {
    return this.preview
  }

  async logActivity () {
    if (!this.isPreview())
      await R.apply(ActivityLog.log, arguments)
  }

  async createRecord (user, surveyId, recordToCreate, t) {
    const {uuid} = recordToCreate

    if (!this.isPreview()) {
      await RecordRepository.insertRecord(surveyId, recordToCreate, t)
      await this.logActivity(user, surveyId, ActivityLog.type.recordCreate, recordToCreate, t)
    }

    const rootNodeDef = await NodeDefRepository.fetchRootNodeDef(surveyId, false, t)
    const rootNode = Node.newNode(NodeDef.getUuid(rootNodeDef), uuid)

    return await this.persistNode(user, surveyId, rootNode, t)
  }

  async persistNode (user, surveyId, node, t) {
    const {uuid} = node

    const nodeDb = this.isPreview()
      ? Record.getNodeByUuid(uuid)(this.recordPreview)
      : await this.nodeRepository.fetchNodeByUuid(surveyId, uuid, t)

    if (nodeDb) {
      // update
      await this.logActivity(user, surveyId, ActivityLog.type.nodeValueUpdate, R.pick(['uuid', 'value'], node), t)
      return await this._updateNodeValue(surveyId, uuid, Node.getNodeValue(node), t)
    } else {
      // create
      return await this._insertNode(surveyId, node, user, t)
    }
  }

  async deleteNode (user, surveyId, nodeUuid, t) {
    const node = this.isPreview()
      ? {uuid: nodeUuid, deleted: true, value: {}}
      : await this.nodeRepository.deleteNode(surveyId, nodeUuid, t)

    await this.logActivity(user, surveyId, ActivityLog.type.nodeDelete, {nodeUuid}, t)

    return await this._onNodeUpdate(surveyId, node, t)
  }

  //==========
  // Internal methods
  //==========

  //always assoc parentNode, used in surveyRdbManager.updateTableNodes
  async _assocParentNode (surveyId, node, nodes, t) {
    const parentUuid = Node.getParentUuid(node)
    const parentNode = parentUuid && !nodes[parentUuid] ? await this.nodeRepository.fetchNodeByUuid(surveyId, parentUuid, t) : null
    return R.mergeRight({
        [node.uuid]: node,
        ...parentNode ? {[parentNode.uuid]: parentNode} : {}
      },
      nodes
    )
  }

  // ==== CREATE
  async _insertNode (surveyId, node, user, t) {
    const nodeDef = await NodeDefRepository.fetchNodeDefByUuid(surveyId, Node.getNodeDefUuid(node), t)
    const nodesToReturn = await this._insertNodeRecursively(surveyId, nodeDef, node, user, t)
    return await this._assocParentNode(surveyId, node, nodesToReturn, t)
  }

  async _insertNodeRecursively (surveyId, nodeDef, nodeToInsert, user, t) {
    await this.logActivity(user, surveyId, ActivityLog.type.nodeCreate, nodeToInsert, t)

    // insert node
    const node = await this.nodeRepository.insertNode(surveyId, nodeToInsert, t)

    // add children if entity
    const childDefs = NodeDef.isNodeDefEntity(nodeDef)
      ? await NodeDefRepository.fetchNodeDefsByParentUuid(surveyId, nodeDef.uuid)
      : []
    // insert only child single entities
    const childNodes = R.mergeAll(
      await Promise.all(
        childDefs
          .filter(NodeDef.isNodeDefSingle)
          .map(async childDef =>
            await this._insertNodeRecursively(surveyId, childDef, Node.newNode(childDef.uuid, node.recordUuid, node.uuid), user, t)
          )
      )
    )
    return R.mergeLeft({[node.uuid]: node}, childNodes)
  }

  // ==== UPDATE

  async _updateNodeValue (surveyId, nodeUuid, value, t) {
    const node = await this.nodeRepository.updateNode(surveyId, nodeUuid, value, t)
    return await this._onNodeUpdate(surveyId, node, t)
  }

  async _onNodeUpdate (surveyId, node, t) {
    // delete dependent code nodes
    const descendantCodes = await this.nodeRepository.fetchDescendantNodesByCodeUuid(surveyId, node.recordUuid, node.uuid)
    const nodesToReturn = await Promise.all(
      descendantCodes.map(async nodeCode => await this.nodeRepository.deleteNode(surveyId, nodeCode.uuid, t))
    )
    return await this._assocParentNode(surveyId, node, SurveyUtils.toUuidIndexedObj(nodesToReturn), t)
  }
}

module.exports = RecordProcessor