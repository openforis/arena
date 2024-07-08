import { Dates, Objects, Records, Surveys } from '@openforis/arena-core'

import { ConflictResolutionStrategy } from '@common/dataImport'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as User from '@core/user/user'
import * as PromiseUtils from '@core/promiseUtils'

import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'
import DataImportBaseJob from '@server/modules/dataImport/service/DataImportJob/DataImportBaseJob'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import * as UserService from '@server/modules/user/service/userService'

const resultKeys = {
  updatedRecordsUuids: 'updatedRecordsUuids',
  mergedRecordsMap: 'mergedRecordsMap',
}

const getErrorMessageContent = ({ missingParentUuid, emptyMultipleAttribute, invalidHierarchy }) => {
  if (missingParentUuid) return `has missing or invalid parent_uuid`
  if (emptyMultipleAttribute) return `is multiple and has an empty value`
  if (invalidHierarchy) return `has an invalid meta hierarchy`
  return null
}

export default class RecordsImportJob extends DataImportBaseJob {
  constructor(params) {
    super(RecordsImportJob.type, params)

    this.recordsFileUuids = new Set() // used to check validity of file UUIDs in FilesImportJob
    this.mergedRecordsMap = {} // maps the uuid of a record to the uuid of the record in which it has been merged
  }

  async onStart() {
    await super.onStart()
    const { context, tx } = this
    const { surveyId } = context
    const recordsSummary = await RecordManager.fetchRecordsSummaryBySurveyId(
      {
        surveyId,
        offset: 0,
        limit: null,
      },
      tx
    )
    this.setContext({ existingRecordsSummary: recordsSummary.list })
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
      const nodeDefUuid = Node.getNodeDefUuid(node)
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      const parentUuid = Node.getParentUuid(node)
      const missingParentUuid = (!parentUuid && !NodeDef.isRoot(nodeDef)) || (parentUuid && !nodes[parentUuid])
      const emptyMultipleAttribute = NodeDef.isMultipleAttribute(nodeDef) && Node.isValueBlank(node)
      const invalidHierarchy = Node.getHierarchy(node).length !== NodeDef.getMetaHierarchy(nodeDef)?.length
      const errorMessageContent = getErrorMessageContent({
        missingParentUuid,
        emptyMultipleAttribute,
        invalidHierarchy,
      })
      if (errorMessageContent) {
        const messagePrefix = `record ${Record.getUuid(record)}: node with uuid ${Node.getUuid(node)} and node def uuid ${nodeDefUuid}`
        const messageSuffix = `: skipping it`
        this.logWarn(`${messagePrefix} ${errorMessageContent} ${messageSuffix}`)
        delete nodes[nodeUuid]
      } else {
        Node.removeFlags({ sideEffect: true })(node)
      }
    })
    // assoc nodes and build index from scratch
    this.currentRecord = Record.assocNodes({ nodes, sideEffect: true })(record)
  }

  findExistingRecordSummaryWithSameKeys() {
    const { context, currentRecord: record } = this
    const { survey, existingRecordsSummary } = context
    const recordUuid = Record.getUuid(record)
    const rootDef = Surveys.getNodeDefRoot({ survey })
    const keyDefs = Surveys.getNodeDefKeys({ survey, nodeDef: rootDef })
    const recordRootEntity = Records.getRoot(record)
    const recordKeyValues = Records.getEntityKeyValues({ survey, record, entity: recordRootEntity })
    const recordSummaryKeyProps = keyDefs.map((keyDef) => A.camelize(NodeDef.getName(keyDef)))

    const recordSummariesWithSameKeys = existingRecordsSummary.filter((recordSummary) => {
      const recordSummaryKeyValues = recordSummaryKeyProps.map((key) => recordSummary[key])
      return Objects.isEqual(recordKeyValues, recordSummaryKeyValues)
    })
    const recordSummarySameUuid = recordSummariesWithSameKeys.find(
      (recordSummary) => Record.getUuid(recordSummary) === recordUuid
    )

    return recordSummarySameUuid ?? recordSummariesWithSameKeys[0]
  }

  findExistingRecordSummary() {
    const { context, currentRecord: record } = this
    const { existingRecordsSummary, conflictResolutionStrategy } = context

    const recordUuid = Record.getUuid(record)
    const existingRecordWithSameUuid = existingRecordsSummary.find(
      (recordSummary) => Record.getUuid(recordSummary) === recordUuid
    )
    if (existingRecordWithSameUuid) {
      return existingRecordWithSameUuid
    }
    if (ConflictResolutionStrategy.merge === conflictResolutionStrategy) {
      return this.findExistingRecordSummaryWithSameKeys()
    }
    return null
  }

  async insertOrSkipRecord() {
    const { context, currentRecord: record } = this
    const { conflictResolutionStrategy } = context

    const recordUuid = Record.getUuid(record)

    const existingRecordSummary = this.findExistingRecordSummary()

    if (existingRecordSummary) {
      const existingRecordUuid = Record.getUuid(existingRecordSummary)
      if (conflictResolutionStrategy === ConflictResolutionStrategy.skipExisting) {
        // skip record
        this.skippedRecordsUuids.add(recordUuid)
        this.logDebug(`record ${recordUuid} skipped; it already exists`)
      } else if (
        (conflictResolutionStrategy === ConflictResolutionStrategy.overwriteIfUpdated ||
          (conflictResolutionStrategy === ConflictResolutionStrategy.merge && recordUuid === existingRecordUuid)) &&
        Dates.isAfter(Record.getDateModified(record), Record.getDateModified(existingRecordSummary))
      ) {
        await this.mergeWithExistingRecord()
      } else if (conflictResolutionStrategy === ConflictResolutionStrategy.merge) {
        await this.mergeWithExistingRecord({ targetRecordUuid: existingRecordUuid })
      }
    } else {
      await this.insertNewRecord()
    }
  }

  async mergeWithExistingRecord({ targetRecordUuid: targetRecordUuidParam = null } = {}) {
    const { context, currentRecord: record, tx } = this
    const { survey, surveyId } = context

    const recordUuid = Record.getUuid(record)
    const targetRecordUuid = targetRecordUuidParam ?? recordUuid

    const merge = targetRecordUuid !== recordUuid

    this.logDebug(
      merge ? `merging record ${recordUuid} into existing record ${targetRecordUuid}` : `updating record ${recordUuid}`
    )

    const recordTarget = await RecordManager.fetchRecordAndNodesByUuid(
      { surveyId, recordUuid: targetRecordUuid, fetchForUpdate: true },
      tx
    )
    const { record: recordTargetUpdated, nodes: nodesUpdated } = merge
      ? await Record.mergeRecords({
          survey,
          recordSource: record,
          sideEffect: true,
        })(recordTarget)
      : await Record.replaceUpdatedNodes({
          survey,
          recordSource: record,
          sideEffect: true,
        })(recordTarget)
    this.currentRecord = recordTargetUpdated

    this.trackFileUuids({ nodes: nodesUpdated })

    const dateModified = Record.getDateModified(record) // TODO get max between modified dates
    await this.persistUpdatedNodes({ nodesUpdated, dateModified })

    this.updatedRecordsUuids.add(targetRecordUuid)
    if (merge) {
      this.mergedRecordsMap[recordUuid] = targetRecordUuid
    }
    this.logDebug(`record update complete (${Object.values(nodesUpdated).length} nodes modified)`)
  }

  async insertNewRecord() {
    const { context, user, currentRecord: record, tx } = this
    const { survey, surveyId } = context

    const recordUuid = Record.getUuid(record)
    this.logDebug(`inserting new record ${recordUuid}`)

    await RecordManager.insertRecord(user, surveyId, record, true, tx)

    // insert nodes (add them to batch persister)
    const nodesIndexedByUuid = Record.getNodesArray(record)
      .sort((nodeA, nodeB) => Node.getHierarchy(nodeA).length - Node.getHierarchy(nodeB).length)
      .reduce((acc, node) => {
        const nodeUuid = Node.getUuid(node)
        const nodeDefUuid = Node.getNodeDefUuid(node)
        // check that the node definition associated to the node has not been deleted from the survey
        const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
        if (nodeDef) {
          node[Node.keys.created] = true // do side effect to avoid creating new objects
          acc[nodeUuid] = node
          if (NodeDef.isFile(nodeDef)) {
            this.trackFileUuid({ node })
          }
        } else {
          this.logDebug(
            `Record ${recordUuid}: missing node def with uuid ${nodeDefUuid} in node ${nodeUuid}; skipping it`
          )
        }
        return acc
      }, {})

    if (!Record.getDateModified(record)) {
      this.logDebug(`Empty date modified for record ${Record.getUuid(record)}`)
    }
    await this.persistUpdatedNodes({ nodesUpdated: nodesIndexedByUuid, dateModified: Record.getDateModified(record) })

    this.insertedRecordsUuids.add(recordUuid)

    this.logDebug(`record insert complete (${Object.values(nodesIndexedByUuid).length} nodes inserted)`)
  }

  async beforeSuccess() {
    await super.beforeSuccess()
    const recordsFileUuidsArray = Array.from(this.recordsFileUuids)
    const recordsFilesCount = recordsFileUuidsArray.length
    if (recordsFilesCount > 0) {
      this.logDebug(`found ${recordsFilesCount} files:`, recordsFileUuidsArray)
    }
    this.setContext({ recordsFileUuids: recordsFileUuidsArray })
  }

  generateResult() {
    const result = super.generateResult()
    result[resultKeys.updatedRecordsUuids] = Array.from(this.updatedRecordsUuids) // it will be used to refresh records in update threads
    result[resultKeys.mergedRecordsMap] = this.mergedRecordsMap
    return result
  }
}

RecordsImportJob.type = 'RecordsImportJob'
