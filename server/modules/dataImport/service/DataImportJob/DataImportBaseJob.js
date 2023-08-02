import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'

import Job from '@server/job/job'
import * as RecordManager from '@server/modules/record/manager/recordManager'

import { RecordsValidationBatchPersister } from '@server/modules/record/manager/RecordsValidationBatchPersister'
import { NodesDeleteBatchPersister } from '@server/modules/record/manager/NodesDeleteBatchPersister'
import { NodesInsertBatchPersister } from '@server/modules/record/manager/NodesInsertBatchPersister'
import { NodesUpdateBatchPersister } from '@server/modules/record/manager/NodesUpdateBatchPersister'

export default class DataImportBaseJob extends Job {
  constructor(type, params) {
    super(type, params)

    this.insertedRecordsUuids = new Set()
    this.updatedRecordsUuids = new Set()
    this.updatedValues = 0

    this.currentRecord = null
    this.nodesDeleteBatchPersister = null
    this.nodesInsertBatchPersister = null
    this.nodesUpdateBatchPersister = null
    this.recordsValidationBatchPersister = null
  }

  async execute() {
    const { user, surveyId, tx } = this

    this.nodesDeleteBatchPersister = new NodesDeleteBatchPersister({ user, surveyId, tx })
    this.nodesInsertBatchPersister = new NodesInsertBatchPersister({ user, surveyId, tx })
    this.nodesUpdateBatchPersister = new NodesUpdateBatchPersister({ user, surveyId, tx })
    this.recordsValidationBatchPersister = new RecordsValidationBatchPersister({ surveyId, tx })
  }

  async persistUpdatedNodes({ nodesUpdated }) {
    const { context, currentRecord: record, tx } = this
    const { dryRun, survey } = context

    const nodesArray = Object.values(nodesUpdated)

    if (!dryRun && nodesArray.length > 0) {
      await this.recordsValidationBatchPersister.addItem([Record.getUuid(record), Record.getValidation(record)])

      this.currentRecord = await RecordManager.persistNodesToRDB({ survey, record, nodesArray }, tx)

      await this.nodesDeleteBatchPersister.addItems(nodesArray.filter(Node.isDeleted))
      await this.nodesInsertBatchPersister.addItems(nodesArray.filter(Node.isCreated))
      await this.nodesUpdateBatchPersister.addItems(nodesArray.filter(Node.isUpdated))
    }
  }

  async beforeSuccess() {
    await this.nodesDeleteBatchPersister.flush()
    await this.nodesInsertBatchPersister.flush()
    await this.nodesUpdateBatchPersister.flush()
    await this.recordsValidationBatchPersister.flush()

    this.setResult(this.generateResult())
  }

  generateResult() {
    const {
      errors,
      insertedRecordsUuids,
      updatedRecordsUuids: updatedRecordsByUuid,
      processed: rowsProcessed,
      updatedValues,
    } = this

    return {
      insertedRecords: insertedRecordsUuids.size,
      updatedRecords: updatedRecordsByUuid.size,
      rowsProcessed,
      updatedValues,
      errorsCount: Object.keys(errors).length,
    }
  }

  _addError(key, params = {}) {
    this.addError({
      error: Validation.newInstance(false, {}, [{ key, params }]),
    })
  }
}
