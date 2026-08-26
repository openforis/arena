import { Dates } from '@openforis/arena-core'

import { RecordImportAction } from '@common/dataImport'

import * as Authorizer from '@core/auth/authorizer'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as User from '@core/user/user'
import SystemError from '@core/systemError'

import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'
import DataImportBaseJob from '@server/modules/dataImport/service/DataImportJob/DataImportBaseJob'
import { CategoryItemProviderDefault } from '@server/modules/category/manager/categoryItemProviderDefault'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import * as UserService from '@server/modules/user/service/userService'
import { TaxonProviderDefault } from '@server/modules/taxonomy/manager/taxonProviderDefault'

import { checkNodeIsValid } from './recordNodeChecks'
import { getRecordFormattedKeyValues, findExistingRecordSummary, determineRecordAction } from './recordImportMatcher'

const resultKeys = {
  mergedRecordsMap: 'mergedRecordsMap',
  mergedSameRecordUuids: 'mergedSameRecordUuids',
}

const categoryItemProvider = CategoryItemProviderDefault
const taxonProvider = TaxonProviderDefault

export default class RecordsImportJob extends DataImportBaseJob {
  constructor(params) {
    super(RecordsImportJob.type, params)

    this.recordsFileUuids = new Set() // used to check validity of file UUIDs in FilesImportJob
    this.mergedRecordsMap = {} // maps the uuid of a record to the uuid of a *different* record it has been merged into (duplicate-key case)
    this.mergedSameRecordUuids = new Set() // uuids of records merged node-by-node with their own existing (same-uuid) server record
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

    if (this.total === 0) {
      throw new SystemError('dataImport.noRecordsFound')
    }

    const { selectedRecordsUuids } = context

    // import records sequentially
    for (const recordSummary of recordSummaries) {
      const recordUuid = Record.getUuid(recordSummary)

      if (selectedRecordsUuids && !selectedRecordsUuids.includes(recordUuid)) {
        // record excluded by the user in the import preview: skip it entirely
        this.skippedRecordsUuids.add(recordUuid)
        this.incrementProcessedItems()
        continue
      }

      const record = await ArenaSurveyFileZip.getRecord(arenaSurveyFileZip, recordUuid)
      this.currentRecord = record
      await this.cleanupCurrentRecord()

      await this.insertOrSkipRecord()

      this.incrementProcessedItems()
    }
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
    for (const node of Object.values(nodes)) {
      const nodeDefUuid = Node.getNodeDefUuid(node)
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      if (NodeDef.isFile(nodeDef)) {
        this.trackFileUuid({ node })
      }
    }
  }

  async cleanupCurrentRecord() {
    const { context, currentRecord: record, user, tx } = this
    const { survey } = context

    const recordUuid = Record.getUuid(record)
    // check owner uuid: if user not defined, use the job user as owner
    const ownerUuidSource = Record.getOwnerUuid(record)
    const ownerSource = await UserService.fetchUserByUuid(ownerUuidSource, tx)
    record[Record.keys.ownerUuid] = ownerSource ? ownerUuidSource : User.getUuid(user)

    // remove invalid nodes and build index from scratch
    delete record['_nodesIndex']
    const nodes = Record.getNodes(record)

    for (const [nodeUuid, node] of Object.entries(nodes)) {
      const nodeDefUuid = Node.getNodeDefUuid(node)
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      const { valid, error, warn } = await checkNodeIsValid({ survey, nodes, node, nodeDef })
      if (valid) {
        // ensure recordUuid is set in node
        node[Node.keys.recordUuid] = recordUuid
        Node.removeFlags({ sideEffect: true })(node)
      } else {
        const nodeDefName = nodeDef ? NodeDef.getName(nodeDef) : '<missing>'
        if (warn) {
          const messagePrefix = `record ${recordUuid}: node with uuid ${nodeUuid} and node def ${nodeDefName} (uuid ${nodeDefUuid})`
          this.logWarn(`${messagePrefix} ${warn}: skipping it`)
          delete nodes[nodeUuid]
        } else {
          throw new SystemError('dataImport.invalidNodeInRecord', {
            recordUuid,
            nodeUuid,
            nodeDefName,
            nodeDefUuid,
            details: error,
          })
        }
      }
    }
    // assoc nodes and build index from scratch
    this.currentRecord = Record.assocNodes({ nodes, sideEffect: true })(record)
  }

  async insertOrSkipRecord() {
    const { context, currentRecord: record } = this
    const { survey, existingRecordsSummary, conflictResolutionStrategy } = context

    const recordUuid = Record.getUuid(record)

    const existingRecordSummary = findExistingRecordSummary({
      survey,
      record,
      existingRecordsSummary,
      conflictResolutionStrategy,
    })
    const { action, existingRecordUuid } = determineRecordAction({
      record,
      existingRecordSummary,
      conflictResolutionStrategy,
    })

    switch (action) {
      case RecordImportAction.skip:
        this.skippedRecordsUuids.add(recordUuid)
        this.logDebug(`record ${recordUuid} skipped; it already exists`)
        break
      case RecordImportAction.overwrite:
        await this.mergeWithExistingRecord({ merge: false })
        break
      case RecordImportAction.merge:
        await this.mergeWithExistingRecord({ targetRecordUuid: existingRecordUuid, merge: true })
        break
      case RecordImportAction.insert:
      default:
        await this.insertNewRecord()
    }
  }

  async mergeWithExistingRecord({ targetRecordUuid: targetRecordUuidParam = null, merge = false } = {}) {
    const { context, currentRecord: record, tx, user } = this
    const { survey, surveyId } = context

    const recordUuid = Record.getUuid(record)
    const targetRecordUuid = targetRecordUuidParam ?? recordUuid

    this.logDebug(
      merge ? `merging record ${recordUuid} into existing record ${targetRecordUuid}` : `updating record ${recordUuid}`
    )

    const recordTarget = await RecordManager.fetchRecordAndNodesByUuid(
      { surveyId, recordUuid: targetRecordUuid, fetchForUpdate: true, user },
      tx
    )
    // check can update record
    if (!Authorizer.canEditRecord(user, recordTarget)) {
      const recordKeyValues = getRecordFormattedKeyValues({ survey, record: recordTarget })
      throw new SystemError('dataImport.recordOwnedByAnotherUser', { recordUuid, recordKeyValues })
    }

    const recordUpdateParams = { survey, categoryItemProvider, taxonProvider, recordSource: record, sideEffect: true }
    const { record: recordTargetUpdated, nodes: nodesUpdated } = merge
      ? await Record.mergeRecords(recordUpdateParams)(recordTarget)
      : await Record.replaceUpdatedNodes(recordUpdateParams)(recordTarget)
    this.currentRecord = recordTargetUpdated

    this.trackFileUuids({ nodes: nodesUpdated })

    const recordSourceDateModified = Record.getDateModified(record)
    const recordTargetDateModified = Record.getDateModified(recordTarget)
    const dateModified =
      merge && Dates.isAfter(recordTargetDateModified, recordSourceDateModified)
        ? recordTargetDateModified
        : recordSourceDateModified
    await this.persistUpdatedNodes({ nodesUpdated, dateModified })

    this.updatedRecordsUuids.add(targetRecordUuid)
    if (merge) {
      if (targetRecordUuid !== recordUuid) {
        // duplicate-key merge into a *different* existing record: track the uuid mapping (used by clients to
        // reconcile their local copy of the now-superseded record)
        this.mergedRecordsMap[recordUuid] = targetRecordUuid
      } else {
        // same-uuid merge: the record was reconciled with its own newer server copy, not superseded by another
        // record, so it must not be flagged via mergedRecordsMap (clients treat that as "hide this record")
        this.mergedSameRecordUuids.add(recordUuid)
      }
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
    result[resultKeys.mergedRecordsMap] = this.mergedRecordsMap
    result[resultKeys.mergedSameRecordUuids] = Array.from(this.mergedSameRecordUuids)
    return result
  }
}

RecordsImportJob.type = 'RecordsImportJob'
