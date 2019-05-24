const R = require('ramda')

const Survey = require('../../../../../../common/survey/survey')
const NodeDef = require('../../../../../../common/survey/nodeDef')
const Record = require('../../../../../../common/record/record')
const Node = require('../../../../../../common/record/node')

const RecordManager = require('../../../../record/manager/recordManager')

const Job = require('../../../../../job/job')

class RecordsValidationJob extends Job {

  constructor (params) {
    super(RecordsValidationJob.type, params)
  }

  async execute (tx) {
    const surveyId = this.getSurveyId()

    const recordUuids = await RecordManager.fetchRecordUuids(surveyId, this.tx)

    this.total = R.length(recordUuids)

    for (const recordUuid of recordUuids) {
      if (this.isCanceled())
        break

      const record = await RecordManager.fetchRecordAndNodesByUuid(surveyId, recordUuid, this.tx)
      await this.validateRecord(record)

      this.incrementProcessedItems()
    }
  }

  async validateRecord (record) {
    this.logDebug(`validate record ${Record.getUuid(record)}`)

    const survey = this.contextSurvey

    // 1. insert missing nodes
    this.logDebug(`insert missing nodes start`)
    const missingNodes = await this.insertMissingSingleNodes(record)
    record = Record.assocNodes(missingNodes)(record)
    this.logDebug(`insert missing nodes end`)

    // 2. apply default values
    this.logDebug(`apply default values start`)
    const defaultValuesUpdated = await RecordManager.updateNodesDependents(survey, record, Record.getNodes(record), this.tx)
    record = Record.assocNodes(defaultValuesUpdated)(record)
    this.logDebug(`apply default values end`)

    // 3. validate nodes
    this.logDebug(`validate nodes start`)
    await RecordManager.validateRecordAndPersistValidation(survey, record, this.tx)
    this.logDebug(`validate nodes end`)
  }

  /**
   * Inserts all the missing single nodes in the specified records having the node def in the specified  ones.
   *
   * Returns an indexed object with all the inserted nodes.
   */
  async insertMissingSingleNodes (record) {
    const survey = this.contextSurvey
    let allInsertedNodes = {}
    const { root } = Survey.getHierarchy()(survey)
    await Survey.traverseHierarchyItem(root, async nodeDefEntity => {
        const nodeDefChildren = Survey.getNodeDefChildren(nodeDefEntity)(survey)
        const nodesEntity = Record.getNodesByDefUuid(NodeDef.getUuid(nodeDefEntity))(record)
        for (const nodeEntity of nodesEntity) {
          for (const nodeDef of nodeDefChildren) {
            const insertedNodes = await this.insertMissingSingleNode(record, nodeEntity, nodeDef)
            allInsertedNodes = {
              ...allInsertedNodes,
              ...insertedNodes
            }
          }
        }
      }
    )
    return allInsertedNodes
  }

  /**
   * Inserts a missing single node in a specified parent node.
   *
   * Returns an indexed object with all the inserted nodes.
   */
  async insertMissingSingleNode (record, parentNode, childDef) {
    if (NodeDef.isSingle(childDef)) {
      const children = Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(childDef))(record)
      if (R.isEmpty(children)) {
        const childNode = Node.newNode(NodeDef.getUuid(childDef), Record.getUuid(record), parentNode)
        return await RecordManager.insertNode(this.contextSurvey, record, childNode, this.getUser(), this.tx)
      }
    }
    return {}
  }
}

RecordsValidationJob.type = 'RecordsValidationJob'

module.exports = RecordsValidationJob