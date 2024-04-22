import { RecordUpdateResult } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as RecordFile from '@core/record/recordFile'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import { RecordsUpdateThreadService } from '@server/modules/record/service/update/surveyRecordsThreadService'

import { DataImportCsvFileReader } from './dataImportCsvFileReader'
import { DataImportJobRecordProvider } from './recordProvider'
import DataImportBaseJob from './DataImportBaseJob'
import { DataImportFileReader } from './dataImportFileReader'

const defaultErrorKey = 'error'

export default class CsvDataImportJob extends DataImportBaseJob {
  constructor(params, type = CsvDataImportJob.type) {
    super(type, params)

    this.dataImportFileReader = null
    this.csvReader = null
    this.entitiesWithMultipleAttributesClearedByUuid = {} // used to clear multiple attribute values only once
    this.updatedFilesByUuid = {}
    this.updatedFilesByName = {}
    this.filesToDeleteByUuid = {}
  }

  async onStart() {
    await super.onStart()
    const survey = await this.fetchSurvey()
    this.setContext({ survey })

    const { includeFiles, filePath } = this.context

    this.dataImportFileReader = new DataImportFileReader({ filePath, includeFiles })
    await this.dataImportFileReader.init()
  }

  async execute() {
    super.execute()

    const { context } = this
    const { abortOnErrors, dryRun } = context

    this.validateParameters()

    await this.fetchRecordsSummary()

    this.csvReader = await this.createCsvReader()
    await this.startCsvReader()

    if (!this.hasErrors() && this.processed === 0) {
      // Error: empty file
      this._addError(Validation.messageKeys.dataImport.emptyFile)
    }
    if (this.isRunning() && this.hasErrors() && abortOnErrors && !dryRun) {
      this.logDebug('Errors found and abortOnErrors is true: aborting transaction')
      this.setStatusFailed()
      throw new Error('abort_transaction')
    } else {
      this.setContext({
        dataImportFileReader: this.dataImportFileReader,
        updatedFilesByUuid: this.updatedFilesByUuid,
        filesToDeleteByUuid: this.filesToDeleteByUuid,
      })
    }
  }

  validateParameters() {
    const { survey, nodeDefUuid, insertNewRecords } = this.context

    if (!nodeDefUuid || !Survey.getNodeDefByUuid(nodeDefUuid)(survey)) {
      throw new Error('Entity to import data into not specified')
    }

    if (insertNewRecords) {
      // when inserting new records, only root entity can be selected
      const rootEntityDef = Survey.getNodeDefRoot(survey)
      if (NodeDef.getUuid(rootEntityDef) !== nodeDefUuid) {
        throw new Error('New records can be inserted only selecting the root entity definition')
      }
    }
  }

  async fetchSurvey() {
    const { surveyId, tx } = this
    const { cycle } = this.context

    return SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      { surveyId, cycle, draft: false, advanced: true },
      tx
    )
  }

  async fetchRecordsSummary() {
    const { surveyId, tx } = this
    const { cycle } = this.context

    // fetch all records summary once to make the record fetch faster
    const recordsSummary = await RecordManager.fetchRecordsSummaryBySurveyId(
      {
        surveyId,
        cycle,
        offset: 0,
        limit: null,
      },
      tx
    )

    this.setContext({ recordsSummary: recordsSummary.list })
  }

  async createCsvReader() {
    const { cycle, nodeDefUuid, survey, includeFiles } = this.context

    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const nodeDefName = NodeDef.getName(nodeDef)

    const stream = await this.dataImportFileReader.getCsvFileStream({ nodeDefName })

    return DataImportCsvFileReader.createReaderFromStream({
      stream,
      survey,
      cycle,
      nodeDefUuid,
      includeFiles,
      onRowItem: async (item) => this.onRowItem(item),
      onTotalChange: (total) => (this.total = total),
    })
  }

  async startCsvReader() {
    try {
      await this.csvReader.start()
    } catch (e) {
      const errorKey = e.key || e.toString()
      const errorParams = e.params
      this._addError(errorKey, errorParams)
    }
  }

  async cancel() {
    await super.cancel()
    this.csvReader?.cancel()
  }

  async setStatusFailed() {
    await super.setStatusFailed()
    this.csvReader?.cancel()
  }

  async onRowItem({ valuesByDefUuid, errors }) {
    const { context, tx } = this
    const { survey, nodeDefUuid, includeFiles, insertMissingNodes } = context

    if (this.isCanceled()) {
      return
    }

    this.incrementProcessedItems()

    errors.forEach((error) => {
      this._addError(error.key || error.toString(), error.params)
    })

    try {
      const { record, newRecord } = await DataImportJobRecordProvider.fetchOrCreateRecord({
        valuesByDefUuid,
        currentRecord: this.currentRecord,
        context,
        tx,
      })
      this.currentRecord = record

      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      const ancestorMultipleEntityDef = NodeDef.isMultipleAttribute(nodeDef)
        ? Survey.getNodeDefAncestorMultipleEntity(nodeDef)(survey)
        : nodeDef
      const entityDefUuid = NodeDef.getUuid(ancestorMultipleEntityDef)

      // when importing files, do not do side effect on record: it's necessary to keep track of update/deleted file uuids (see updateFilesSummary function)
      const sideEffect = !includeFiles

      const updateResult = new RecordUpdateResult({ record: this.currentRecord })

      const { entity, updateResult: entityUpdateResult } = await Record.getOrCreateEntityByKeys({
        survey,
        entityDefUuid,
        valuesByDefUuid,
        insertMissingNodes,
        sideEffect,
      })(this.currentRecord)

      updateResult.merge(entityUpdateResult)
      this.currentRecord = updateResult.record

      await this.clearMultipleAttributeValues({ entity, valuesByDefUuid, sideEffect })

      const updateResultUpdateAttributes = await Record.updateAttributesInEntityWithValues({
        survey,
        entity,
        valuesByDefUuid,
        sideEffect,
      })(this.currentRecord)

      updateResult.merge(updateResultUpdateAttributes)
      this.currentRecord = updateResult.record

      const nodesUpdated = updateResult.nodes
      await this.persistUpdatedNodes({ nodesUpdated })

      // update counts
      const recordUuid = Record.getUuid(this.currentRecord)
      const nodesUpdatedArray = Object.values(nodesUpdated)
      if (newRecord) {
        this.updatedValues += Record.getNodesArray(this.currentRecord).length
        this.insertedRecordsUuids.add(recordUuid)
      } else {
        if (nodesUpdatedArray.length > 0) {
          this.updatedValues += nodesUpdatedArray.length
          this.updatedRecordsUuids.add(recordUuid)
        }
      }
      this.updateFilesSummary({ originalRecord: record, nodesUpdatedArray })
    } catch (e) {
      const { key, params } = e
      const errorKey = key ?? Validation.messageKeys.dataImport.errorUpdatingValues
      this._addError(errorKey, params)
    }
  }

  async clearMultipleAttributeValues({ entity, valuesByDefUuid, sideEffect }) {
    const { context } = this
    const { survey } = context

    const multipleAttributeDefsBeingUpdated = Object.keys(valuesByDefUuid)
      .map((nodeDefUuid) => Survey.getNodeDefByUuid(nodeDefUuid)(survey))
      .filter(NodeDef.isMultipleAttribute)
    const entityUuid = Node.getUuid(entity)
    if (multipleAttributeDefsBeingUpdated.length > 0 && !this.entitiesWithMultipleAttributesClearedByUuid[entityUuid]) {
      const nodeDefUuidsToClear = multipleAttributeDefsBeingUpdated.map(NodeDef.getUuid)
      const entityClearUpdateResult = await Record.deleteNodesInEntityByNodeDefUuid({
        survey,
        entity,
        nodeDefUuids: nodeDefUuidsToClear,
        sideEffect,
      })(this.currentRecord)

      this.currentRecord = entityClearUpdateResult.record
      this.entitiesWithMultipleAttributesClearedByUuid[entityUuid] = true

      await this.persistUpdatedNodes({ nodesUpdated: entityClearUpdateResult.nodes })
    }
  }

  updateFilesSummary({ originalRecord, nodesUpdatedArray }) {
    const { context, updatedFilesByUuid, updatedFilesByName, filesToDeleteByUuid } = this
    const { survey } = context
    nodesUpdatedArray.forEach((node) => {
      const nodeDefUuid = Node.getNodeDefUuid(node)
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      if (NodeDef.isFile(nodeDef)) {
        const oldNode = Record.getNodeByUuid(Node.getUuid(node))(originalRecord)
        if (!Node.isValueBlank(oldNode)) {
          const fileToDeleteUuid = Node.getFileUuid(oldNode)
          filesToDeleteByUuid[fileToDeleteUuid] = RecordFile.createFileFromNode({ node: oldNode })
        }
        if (!Node.isValueBlank(node)) {
          const fileSummary = RecordFile.createFileFromNode({ node })
          const fileUuid = RecordFile.getUuid(fileSummary)
          // check duplicates
          if (updatedFilesByUuid[fileUuid]) {
            throw new Error('File with same uuid already inserted: ' + fileUuid)
          }
          const fileName = RecordFile.getName(fileSummary)
          if (updatedFilesByName[fileName]) {
            throw new Error('File with same name already inserted: ' + fileName)
          }
          updatedFilesByUuid[fileUuid] = fileSummary
          updatedFilesByName[fileName] = fileSummary
        }
      }
    })
  }

  async onEnd() {
    await super.onEnd()
    const { keepReaderOpenOnEnd } = this.context
    if (!keepReaderOpenOnEnd) {
      this.dataImportFileReader?.close()
    }
  }

  generateResult() {
    const result = super.generateResult()
    const { dryRun } = this.context
    return { ...result, dryRun }
  }

  async beforeSuccess() {
    await super.beforeSuccess()
    const { surveyId } = this
    const { cycle } = this.context

    // clear records from update thread
    this.updatedRecordsUuids.forEach((recordUuid) =>
      RecordsUpdateThreadService.clearRecordDataFromThread({ surveyId, cycle, draft: false, recordUuid })
    )
  }

  _addError(key, params = {}) {
    this.addError({
      [defaultErrorKey]: Validation.newInstance(false, {}, [{ key, params }]),
    })
  }

  getError() {
    return Object.values(this.errors)[0]?.[defaultErrorKey]
  }
}

CsvDataImportJob.type = 'DataImportJob'
