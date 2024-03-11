import { Dates } from '@openforis/arena-core'

import { ConflictResolutionStrategy } from '@common/dataImport'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as User from '@core/user/user'
import * as ObjectUtils from '@core/objectUtils'
import * as PromiseUtils from '@core/promiseUtils'

import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'
import DataImportBaseJob from '@server/modules/dataImport/service/DataImportJob/DataImportBaseJob'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import * as UserService from '@server/modules/user/service/userService'

export default class RecordsImportJob extends DataImportBaseJob {
  constructor(params) {
    super(RecordsImportJob.type, params)

    this.recordsFileUuids = new Set() // used to check validity of file UUIDs in FilesImportJob
  }

  async execute() {
    await super.execute()

    const { context } = this
    const { arenaSurveyFileZip } = context

    const recordSummaries = await ArenaSurveyFileZip.getRecords(arenaSurveyFileZip)
    this.total = recordSummaries.length

    if (this.total === 0) return

    // import records sequentially
    await PromiseUtils.each(recordSummaries, async (recordSummary) => {
      const recordUuid = Record.getUuid(recordSummary)

      const record = await ArenaSurveyFileZip.getRecord(arenaSurveyFileZip, recordUuid)
      this.currentRecord = record
      await this.cleanupCurrentRecord()

      await this.insertOrSkipRecord()

      this.incrementProcessedItems()
    })
  }

  trackFileUuid = ({ node }) => {
    const fileUuid = Node.getFileUuid(node)
    if (fileUuid && (Node.isCreated(node) || Node.isUpdated(node))) {
      this.recordsFileUuids.add(fileUuid)
    }
  }

  trackFileUuids({ nodes }) {
    // keep track of file uuids found in record attribute values
    const { survey } = this.context
    Object.values(nodes).forEach((node) => {
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
      if (NodeDef.isFile(nodeDef)) {
        this.trackFileUuid({ node })
      }
    })
  }

  async cleanupCurrentRecord() {
    const { context, currentRecord: record, user, tx } = this
    const { survey } = context

    // check owner uuid: if user not defined, use the job user as owner
    const ownerUuidSource = Record.getOwnerUuid(record)
    const ownerSource = await UserService.fetchUserByUuid(ownerUuidSource, tx)
    record[Record.keys.ownerUuid] = ownerSource ? ownerUuidSource : User.getUuid(user)

    // remove invalid nodes and build index from scratch
    delete record['_nodesIndex']
    const nodes = Record.getNodes(record)

    Object.entries(nodes).forEach(([nodeUuid, node]) => {
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
      const parentUuid = Node.getParentUuid(node)
      const missingParentUuid = (!parentUuid && !NodeDef.isRoot(nodeDef)) || (parentUuid && !nodes[parentUuid])
      const emptyMultipleAttribute = NodeDef.isMultipleAttribute(nodeDef) && Node.isValueBlank(node)

      if (missingParentUuid || emptyMultipleAttribute) {
        const messagePrefix = `node with uuid ${Node.getUuid(node)}`
        const messageContent = missingParentUuid
          ? `has missing or invalid parent_uuid`
          : `is multiple and has an empty value`
        const messageSuffix = `: skipping it`
        this.logWarn(`${messagePrefix} ${messageContent} ${messageSuffix}`)
        delete nodes[nodeUuid]
      }
    })
    // assoc nodes and build index from scratch
    this.currentRecord = Record.assocNodes({ nodes, sideEffect: true })(record)
  }

  async insertOrSkipRecord() {
    const { context, currentRecord: record, tx } = this
    const { surveyId, conflictResolutionStrategy } = context

    const recordUuid = Record.getUuid(record)

    const existingRecordSummary = await RecordManager.fetchRecordSummary({ surveyId, recordUuid }, tx)

    if (existingRecordSummary) {
      if (conflictResolutionStrategy === ConflictResolutionStrategy.skipExisting) {
        // skip record
        this.skippedRecordsUuids.add(recordUuid)
        this.logDebug(`record ${recordUuid} skipped; it already exists`)
      } else if (
        conflictResolutionStrategy === ConflictResolutionStrategy.overwriteIfUpdated &&
        Dates.isAfter(Record.getDateModified(record), Record.getDateModified(existingRecordSummary))
      ) {
        await this.updateExistingRecord()
      }
    } else {
      await this.insertNewRecord()
    }
  }

  async updateExistingRecord() {
    const { context, currentRecord: record, tx } = this
    const { survey, surveyId } = context

    const recordUuid = Record.getUuid(record)

    this.logDebug(`updating record ${recordUuid}`)

    const recordTarget = await RecordManager.fetchRecordAndNodesByUuid(
      {
        surveyId,
        recordUuid,
        draft: false,
        fetchForUpdate: true,
      },
      tx
    )
    const { record: recordTargetUpdated, nodes: nodesUpdated } = await Record.replaceUpdatedNodes({
      survey,
      recordSource: record,
      sideEffect: true,
    })(recordTarget)
    this.currentRecord = recordTargetUpdated

    this.trackFileUuids({ nodes: nodesUpdated })

    await this.persistUpdatedNodes({ nodesUpdated, dateModified: Record.getDateModified(record) })

    this.updatedRecordsUuids.add(recordUuid)
    this.logDebug(`record update complete (${Object.values(nodesUpdated).length} nodes modified)`)
  }

  async insertNewRecord() {
    const { context, user, currentRecord: record, tx } = this
    const { survey, surveyId } = context

    const recordUuid = Record.getUuid(record)
    this.logDebug(`inserting new record ${recordUuid}`)

    await RecordManager.insertRecord(user, surveyId, record, true, tx)

    // insert nodes (add them to batch persister)
    const nodesArray = []

    Record.getNodesArray(record).forEach((node) => {
      // check that the node definition associated to the node has not been deleted from the survey
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
      if (nodeDef) {
        node[Node.keys.created] = true // do side effect to avoid creating new objects
        nodesArray.push(node)
        if (NodeDef.isFile(nodeDef)) {
          this.trackFileUuid({ node })
        }
      }
    })
    nodesArray.sort((nodeA, nodeB) => nodeA.id - nodeB.id)
    const nodesIndexedByUuid = ObjectUtils.toUuidIndexedObj(nodesArray)

    await this.persistUpdatedNodes({ nodesUpdated: nodesIndexedByUuid, dateModified: Record.getDateModified(record) })

    this.insertedRecordsUuids.add(recordUuid)

    this.logDebug(`record insert complete (${nodesArray.length} nodes inserted)`)
  }

  async beforeSuccess() {
    await super.beforeSuccess()
    const recordsFileUuidsArray = Array.from(this.recordsFileUuids)
    const recordsFilesCount = recordsFileUuidsArray.length
    if (recordsFilesCount > 0) {
      this.logInfo(`found ${recordsFilesCount} files:`, recordsFileUuidsArray)
    }
    this.setContext({ recordsFileUuids: recordsFileUuidsArray })
  }

  generateResult() {
    const result = super.generateResult()
    result['updatedRecordsUuids'] = Array.from(this.updatedRecordsUuids) // it will be used to refresh records in update threads
    return result
  }
}

RecordsImportJob.type = 'RecordsImportJob'
