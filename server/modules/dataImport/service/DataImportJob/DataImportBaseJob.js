import { Dates } from '@openforis/arena-core'

import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'

import Job from '@server/job/job'
import * as RecordManager from '@server/modules/record/manager/recordManager'

import { RecordsDateModifiedBatchPersister } from '@server/modules/record/manager/RecordsDateModifiedBatchPersister'
import { RecordsValidationBatchPersister } from '@server/modules/record/manager/RecordsValidationBatchPersister'
import { NodesDeleteBatchPersister } from '@server/modules/record/manager/NodesDeleteBatchPersister'
import { NodesInsertBatchPersister } from '@server/modules/record/manager/NodesInsertBatchPersister'
import { NodesUpdateBatchPersister } from '@server/modules/record/manager/NodesUpdateBatchPersister'
import { RdbUpdatesBatchPersister } from '@server/modules/record/manager/RdbUpdatesBatchPersister'

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
    this.recordsDateModifiedBatchPersister = null
    this.recordsValidationBatchPersister = null
    this.rdbUpdatesBatchPersister = null
  }

  async onStart() {
    await super.onStart()

    const { user, surveyId, tx } = this

    this.nodesDeleteBatchPersister = new NodesDeleteBatchPersister({ user, surveyId, tx })
    this.nodesInsertBatchPersister = new NodesInsertBatchPersister({ user, surveyId, tx })
    this.nodesUpdateBatchPersister = new NodesUpdateBatchPersister({ user, surveyId, tx })
    this.recordsDateModifiedBatchPersister = new RecordsDateModifiedBatchPersister({ surveyId, tx })
    this.recordsValidationBatchPersister = new RecordsValidationBatchPersister({ surveyId, tx })
    this.rdbUpdatesBatchPersister = new RdbUpdatesBatchPersister({ user, surveyId, tx })
  }

  async persistUpdatedNodes({ nodesUpdated, dateModified = new Date() }) {
    const { context, currentRecord: record, tx } = this
    const { dryRun, survey } = context

    const nodesArray = Object.values(nodesUpdated)

    record.dateModified = dateModified

    if (dryRun) return

    const recordUuid = Record.getUuid(record)
    await this.recordsValidationBatchPersister.addItem(recordUuid, Record.getValidation(record))
    if (dateModified) {
      await this.recordsDateModifiedBatchPersister.addItem(recordUuid, dateModified, tx)
    }

    if (nodesArray.length === 0) return

    for await (const node of nodesArray) {
      if (Node.isDeleted(node)) {
        await this.nodesDeleteBatchPersister.addItem(node)
      } else if (Node.isCreated(node)) {
        await this.nodesInsertBatchPersister.addItem(node)
      } else if (Node.isUpdated(node)) {
        await this.nodesUpdateBatchPersister.addItem(node)
      }
    }

    const { record: recordUpdated, rdbUpdates } = RecordManager.generateRdbUpates({ survey, record, nodesArray }, tx)
    await this.rdbUpdatesBatchPersister.addItem(rdbUpdates)

    this.currentRecord = recordUpdated
  }

  async beforeSuccess() {
    await this.nodesDeleteBatchPersister.flush()
    await this.nodesInsertBatchPersister.flush()
    await this.nodesUpdateBatchPersister.flush()
    await this.recordsDateModifiedBatchPersister.flush()
    await this.recordsValidationBatchPersister.flush()
    await this.rdbUpdatesBatchPersister.flush()

    await super.beforeSuccess()
  }

  generateResult() {
    const { errors, insertedRecordsUuids, processed, skippedRecordsUuids, updatedRecordsUuids, updatedValues } = this

    return {
      errorsCount: Object.keys(errors).length,
      insertedRecords: insertedRecordsUuids.size,
      insertedRecordsUuids: Array.from(insertedRecordsUuids),
      processed,
      skippedRecords: skippedRecordsUuids.size,
      skippedRecordsUuids: Array.from(skippedRecordsUuids),
      updatedRecords: updatedRecordsUuids.size,
      updatedRecordsUuids: Array.from(updatedRecordsUuids),
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
