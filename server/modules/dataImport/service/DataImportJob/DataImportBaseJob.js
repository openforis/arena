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

  async persistUpdatedNodes({ nodesUpdated }) {
    const { context, currentRecord: record, tx } = this
    const { dryRun, survey, surveyId } = context

    const nodesArray = Object.values(nodesUpdated)

    if (!dryRun && nodesArray.length > 0) {
      await this.recordsValidationBatchPersister.addItem([Record.getUuid(record), Record.getValidation(record)])

      await this.nodesDeleteBatchPersister.addItems(nodesArray.filter(Node.isDeleted))
      await this.nodesInsertBatchPersister.addItems(nodesArray.filter(Node.isCreated))
      await this.nodesUpdateBatchPersister.addItems(nodesArray.filter(Node.isUpdated))

      this.currentRecord = await RecordManager.persistNodesToRDB({ survey, record, nodesArray }, tx)
      const recordUuid = Record.getUuid(record)
      const recordUpdatedDb = await RecordManager.updateRecordDateModified({ surveyId, recordUuid }, tx)
      record.dateModified = recordUpdatedDb.dateModified
    }
  }

  async beforeSuccess() {
    await this.nodesDeleteBatchPersister.flush()
    await this.nodesInsertBatchPersister.flush()
    await this.nodesUpdateBatchPersister.flush()
    await this.recordsValidationBatchPersister.flush()

    await super.beforeSuccess()
  }

  generateResult() {
    const { errors, insertedRecordsUuids, updatedRecordsUuids, skippedRecordsUuids, processed } = this

    return {
      insertedRecords: insertedRecordsUuids.size,
      updatedRecords: updatedRecordsUuids.size,
      skippedRecords: skippedRecordsUuids.size,
      processed,
      errorsCount: Object.keys(errors).length,
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
