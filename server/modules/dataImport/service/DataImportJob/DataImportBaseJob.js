import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'

import Job from '@server/job/job'
import * as RecordManager from '@server/modules/record/manager/recordManager'

import { RecordsValidationBatchPersister } from '@server/modules/record/manager/RecordsValidationBatchPersister'
import { NodesDeleteBatchPersister } from '@server/modules/record/manager/NodesDeleteBatchPersister'
import { NodesInsertBatchPersister } from '@server/modules/record/manager/NodesInsertBatchPersister'
import { NodesUpdateBatchPersister } from '@server/modules/record/manager/NodesUpdateBatchPersister'
import { Dates } from '@openforis/arena-core'

export default class DataImportBaseJob extends Job {
  constructor(type, params) {
    super(type, params)

    this.insertedRecordsUuids = new Set()
    this.skippedRecordsUuids = new Set()
    this.updatedRecordsUuids = new Set()
    this.updatedValues = 0

    this.currentRecord = null
    this.nodesDeleteBatchPersister = null
    this.nodesInsertBatchPersister = null
    this.nodesUpdateBatchPersister = null
    this.recordsValidationBatchPersister = null
  }

  async onStart() {
    await super.onStart()

    const { user, surveyId, tx } = this

    this.nodesDeleteBatchPersister = new NodesDeleteBatchPersister({ user, surveyId, tx })
    this.nodesInsertBatchPersister = new NodesInsertBatchPersister({ user, surveyId, tx })
    this.nodesUpdateBatchPersister = new NodesUpdateBatchPersister({ user, surveyId, tx })
    this.recordsValidationBatchPersister = new RecordsValidationBatchPersister({ surveyId, tx })
  }

  async persistUpdatedNodes({ nodesUpdated, dateModified = new Date() }) {
    const { context, currentRecord: record, tx } = this
    const { dryRun, survey, surveyId } = context

    const nodesArray = Object.values(nodesUpdated)

    record.dateModified = dateModified

    if (dryRun) return

    await this.recordsValidationBatchPersister.addItem([Record.getUuid(record), Record.getValidation(record)])
    const recordUuid = Record.getUuid(record)
    await RecordManager.updateRecordDateModified({ surveyId, recordUuid, dateModified }, tx)

    if (nodesArray.length === 0) return

    await this.nodesDeleteBatchPersister.addItems(nodesArray.filter(Node.isDeleted))
    await this.nodesInsertBatchPersister.addItems(nodesArray.filter(Node.isCreated))
    await this.nodesUpdateBatchPersister.addItems(nodesArray.filter(Node.isUpdated))

    this.currentRecord = await RecordManager.persistNodesToRDB({ survey, record, nodesArray }, tx)
  }

  async beforeSuccess() {
    await this.nodesDeleteBatchPersister.flush()
    await this.nodesInsertBatchPersister.flush()
    await this.nodesUpdateBatchPersister.flush()
    await this.recordsValidationBatchPersister.flush()

    await super.beforeSuccess()
  }

  generateResult() {
    const { errors, insertedRecordsUuids, processed, skippedRecordsUuids, updatedRecordsUuids, updatedValues } = this

    return {
      errorsCount: Object.keys(errors).length,
      insertedRecords: insertedRecordsUuids.size,
      processed,
      skippedRecords: skippedRecordsUuids.size,
      updatedRecords: updatedRecordsUuids.size,
      updatedValues,
    }
  }

  _addError(key, params = {}) {
    this.addError({
      error: Validation.newInstance(false, {}, [{ key, params }]),
    })
  }

  /**
   * Updates the record modified date using the max modified date of the nodes.
   *
   * @param {!object} record - The record object.
   * @returns {object} - The modified record.
   */
  prepareRecordSummaryToStore(record) {
    const nodes = Record.getNodesArray(record)
    const maxNodeModifiedDate = new Date(
      Math.max.apply(
        null,
        nodes.map((node) => {
          const dateModified = Node.getDateModified(node)
          return dateModified instanceof Date ? dateModified : Dates.parseISO(dateModified)
        })
      )
    )
    return Record.assocDateModified(maxNodeModifiedDate)(record)
  }
}
