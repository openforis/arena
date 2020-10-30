import * as R from 'ramda'

import BatchPersister from '@server/db/batchPersister'

import * as FileXml from '@server/utils/file/fileXml'
import Queue from '@core/queue'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Record from '@core/record/record'
import * as RecordValidation from '@core/record/recordValidation'
import * as Node from '@core/record/node'
import * as RecordValidator from '@core/record/recordValidator'
import * as Validation from '@core/validation/validation'

import SystemError from '@core/systemError'

import Job from '@server/job/job'
import * as SurveyManager from '../../../../survey/manager/surveyManager'
import * as RecordManager from '../../../../record/manager/recordManager'

import * as CollectRecord from '../model/collectRecord'
import * as CollectSurvey from '../model/collectSurvey'
import * as CollectAttributeValueExtractor from './collectAttributeValueExtractor'

export default class RecordsImportJob extends Job {
  constructor(params) {
    super(RecordsImportJob.type, params)

    this.batchPersister = new BatchPersister(this.nodesBatchInsertHandler.bind(this), 2500)
  }

  async onStart() {
    await super.onStart()

    // Speed up processing a bit:
    await this.tx.query('SET CONSTRAINTS ALL DEFERRED')
  }

  async execute() {
    const { surveyId, user, tx } = this

    const cycle = Survey.cycleOneKey
    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      surveyId,
      cycle,
      true,
      true,
      false,
      false,
      tx
    )

    const entryNames = this.getEntryNames()

    this.total = entryNames.length

    for (const entryName of entryNames) {
      if (this.isCanceled()) {
        break
      }

      // This.logDebug(`-- start import record ${entryName}`)

      // this.logDebug(`${entryName} findCollectRecordData start`)
      const collectRecordData = this.findCollectRecordData(entryName)
      const { collectRecordXml, step } = collectRecordData
      // This.logDebug(`${entryName} findCollectRecordData done`)

      // this.logDebug(`${entryName} parseToJson start`)
      const collectRecordJson = FileXml.parseToJson(collectRecordXml)
      // This.logDebug(`${entryName} parseToJson done`)

      // this.logDebug(`${entryName} recordToCreate start`)
      const recordToCreate = Record.newRecord(user, cycle, false, CollectRecord.getDateCreated(collectRecordJson), step)
      const record = await RecordManager.insertRecord(user, surveyId, recordToCreate, true, tx)
      // This.logDebug(`${entryName} recordToCreate end`)

      // this.logDebug(`${entryName} traverseCollectRecordAndInsertNodes start`)
      const recordValidation = await this.traverseCollectRecordAndInsertNodes(survey, record, collectRecordJson)
      // This.logDebug(`${entryName} traverseCollectRecordAndInsertNodes end`)

      // persist validation
      // this.logDebug(`${entryName} persistValidation start`)
      await RecordManager.persistValidation(survey, record, recordValidation, tx)
      // This.logDebug(`${entryName} persistValidation end`)

      // this.logDebug(`-- end import record ${entryName}`)

      this.incrementProcessedItems()
    }
  }

  async beforeSuccess() {
    await this.batchPersister.flush(this.tx)
  }

  getEntryNames() {
    const { collectSurveyFileZip } = this.context

    const steps = [1, 2, 3]

    for (const step of steps) {
      const entryNames = collectSurveyFileZip.getEntryNames(`data/${step}/`)
      if (!R.isEmpty(entryNames)) {
        return entryNames
      }
    }

    return []
  }

  findCollectRecordData(entryName) {
    const { collectSurveyFileZip } = this.context

    const steps = [3, 2, 1]

    for (const step of steps) {
      const collectRecordXml = collectSurveyFileZip.getEntryAsText(`data/${step}/${entryName}`)
      if (collectRecordXml) {
        return { collectRecordXml, step }
      }
    }

    throw new SystemError('entryDataNotFound', { entryName })
  }

  async traverseCollectRecordAndInsertNodes(survey, record, collectRecordJson) {
    const { nodeDefsInfoByCollectPath, collectSurveyFileZip, collectSurvey } = this.context

    const recordUuid = Record.getUuid(record)
    const recordValidation = Record.getValidation(record)

    const collectRootEntityName = CollectRecord.getRootEntityName(collectRecordJson)
    const collectRootEntityDefPath = `/${collectRootEntityName}`
    const collectRootEntityDef = CollectSurvey.getNodeDefByPath(collectRootEntityDefPath)(collectSurvey)
    const collectRootEntity = CollectRecord.getRootEntity(collectRecordJson, collectRootEntityName)

    const queue = new Queue([
      {
        nodeParent: null,
        collectNodeDef: collectRootEntityDef,
        collectNodeDefPath: collectRootEntityDefPath,
        collectNode: collectRootEntity,
      },
    ])

    while (!queue.isEmpty()) {
      const item = queue.dequeue()
      const { nodeParent, collectNodeDef, collectNodeDefPath, collectNode } = item

      const nodeDefsInfo = nodeDefsInfoByCollectPath[collectNodeDefPath]

      for (const { uuid: nodeDefUuid, field } of nodeDefsInfo) {
        const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

        let nodeToInsert = Node.newNode(nodeDefUuid, recordUuid, nodeParent)

        const valueAndMeta = NodeDef.isAttribute(nodeDef)
          ? await CollectAttributeValueExtractor.extractAttributeValueAndMeta(
              survey,
              nodeDef,
              record,
              nodeToInsert,
              collectSurveyFileZip,
              collectNodeDef,
              collectNode,
              field,
              this.tx
            )
          : {}
        const { value = null, meta = {} } = valueAndMeta || {}

        nodeToInsert = R.pipe(Node.assocValue(value), Node.mergeMeta(meta))(nodeToInsert)

        await this._insertNode(nodeDef, nodeToInsert)

        if (NodeDef.isEntity(nodeDef)) {
          // Create child nodes to insert
          const { nodesToInsert } = this._createNodeChildrenToInsert(
            survey,
            collectNodeDef,
            collectNodeDefPath,
            collectNode,
            nodeToInsert,
            recordValidation
          )
          queue.enqueueItems(nodesToInsert)
        } else {
          const validationAttribute = await RecordValidator.validateAttribute(survey, record, nodeToInsert)
          if (!Validation.isValid(validationAttribute)) {
            Validation.setValid(false)(recordValidation)
            Validation.setField(Node.getUuid(nodeToInsert), validationAttribute)(recordValidation)
          }
        }
      }
    }

    return recordValidation
  }

  _createNodeChildrenToInsert(survey, collectNodeDef, collectNodeDefPath, collectNode, node, recordValidation) {
    const { nodeDefsInfoByCollectPath } = this.context

    // Output
    const nodesToInsert = []

    const nodeUuid = Node.getUuid(node)
    const collectNodeDefChildren = CollectSurvey.getNodeDefChildren(collectNodeDef)
    for (const collectNodeDefChild of collectNodeDefChildren) {
      if (this.isCanceled()) {
        break
      }

      const collectNodeDefChildName = CollectSurvey.getAttributeName(collectNodeDefChild)
      const collectNodeDefChildPath = collectNodeDefPath + '/' + collectNodeDefChildName
      const nodeDefsInfo = nodeDefsInfoByCollectPath[collectNodeDefChildPath]

      if (nodeDefsInfo) {
        const collectChildNodes = CollectRecord.getNodeChildren([collectNodeDefChildName])(collectNode)

        const childrenCount = collectChildNodes.length

        // If children count > 0
        for (const collectChildNode of collectChildNodes) {
          if (this.isCanceled()) {
            break
          }

          nodesToInsert.push({
            nodeParent: node,
            collectNodeDef: collectNodeDefChild,
            collectNodeDefPath: collectNodeDefChildPath,
            collectNode: collectChildNode,
          })
        }

        // Get nodeDefUuid from first nodeDef field
        const { uuid: nodeDefChildUuid } = nodeDefsInfo[0]
        const nodeDefChild = Survey.getNodeDefByUuid(nodeDefChildUuid)(survey)

        // Validate min/max count
        if (NodeDefValidations.hasMinOrMaxCount(NodeDef.getValidations(nodeDefChild))) {
          const validationCount = RecordValidator.validateChildrenCount(nodeDefChild, childrenCount)

          if (!Validation.isValid(validationCount)) {
            RecordValidation.setValidationCount(
              nodeUuid,
              NodeDef.getUuid(nodeDefChild),
              validationCount
            )(recordValidation)
            Validation.setValid(false)(recordValidation)
          }
        }

        if (NodeDef.isSingle(nodeDefChild) && childrenCount === 0) {
          nodesToInsert.push({
            nodeParent: node,
            collectNodeDef: collectNodeDefChild,
            collectNodeDefPath: collectNodeDefChildPath,
            collectNode: {},
          })
        }
      } else {
        this.logError(`==== NodeDef not found for ${collectNodeDefChildPath}`)
      }
    }

    return {
      nodesToInsert,
      recordValidation,
    }
  }

  async _insertNode(nodeDef, node) {
    node.dateCreated = new Date()
    const value = Node.getValue(node, null)

    const nodeValueInsert = [
      Node.getUuid(node),
      node.dateCreated,
      node.dateCreated,
      Node.getRecordUuid(node),
      Node.getParentUuid(node),
      NodeDef.getUuid(nodeDef),
      JSON.stringify(value),
      {
        ...Node.getMeta(node),
        [Node.metaKeys.childApplicability]: {}, // I think that is here were we should add the applicability but maybe we depend on other values that are not there and we need the id
      },
    ]

    await this.batchPersister.addItem(nodeValueInsert, this.tx)
  }

  async nodesBatchInsertHandler(nodeValues, tx) {
    await RecordManager.insertNodesFromValues(this.user, this.surveyId, nodeValues, tx)
  }
}

RecordsImportJob.type = 'RecordsImportJob'
