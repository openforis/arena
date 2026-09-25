import { Objects, RecordUpdateResult } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as SurveyFile from '@core/survey/surveyFile'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import { RecordsUpdateThreadService } from '@server/modules/record/service/update/surveyRecordsThreadService'
import { CategoryItemProviderDefault } from '@server/modules/category/manager/categoryItemProviderDefault'
import { TaxonProviderDefault } from '@server/modules/taxonomy/manager/taxonProviderDefault'
import * as FlatDataReader from '@server/utils/file/flatDataReader'

import { DataImportFlatDataFileReader } from './dataImportFlatDataFileReader'
import { DataImportJobRecordProvider } from './recordProvider'
import DataImportBaseJob from './DataImportBaseJob'
import { DataImportFileReader } from './dataImportFileReader'

const defaultErrorKey = 'error'

const categoryItemProvider = CategoryItemProviderDefault
const taxonProvider = TaxonProviderDefault

const determineAncestorMultipleEntityDefUuid = ({ survey, nodeDefUuid }) => {
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const ancestorMultipleEntityDef = NodeDef.isMultipleAttribute(nodeDef)
    ? Survey.getNodeDefAncestorMultipleEntity(nodeDef)(survey)
    : nodeDef
  return NodeDef.getUuid(ancestorMultipleEntityDef)
}

export default class FlatDataImportJob extends DataImportBaseJob {
  constructor(params, type = FlatDataImportJob.type) {
    super(type, params)

    this.dataImportFileReader = null
    this.flatDataReader = null
    this.entitiesWithMultipleAttributesClearedByUuid = {} // used to clear multiple attribute values only once
    this.updatedFilesByUuid = {}
    this.updatedFilesByName = {}
    this.filesToDeleteByUuid = {}
    this.entityUuidTouchedByRecordUuid = {}
    this.entitiesCreated = 0
    // nodes (by uuid) updated in the current record whose dependent nodes (and validation) have not been updated yet:
    // dependents are evaluated once per record (instead of once per updated attribute) to avoid quadratic processing time
    // when the survey has expressions depending on many nodes (e.g. aggregate functions on multiple entities);
    // the node objects are the same ones passed to the batch persisters (their ids are set when they are inserted)
    this.nodesPendingDependentsUpdateByUuid = new Map()
    // index of the entities by key values, used to find the entity of every row without comparing the keys of all its siblings
    // (valid only for the current record)
    this.entityKeysIndexCache = new Record.EntityKeysIndexCache()
  }

  async onStart() {
    await super.onStart()
    const survey = await this.fetchSurvey()
    this.setContext({ survey })

    const { includeFiles, filePath, nodeDefUuid } = this.context

    this.dataImportFileReader = new DataImportFileReader({ filePath, includeFiles })
    await this.dataImportFileReader.init()

    // determine ancestor multiple entity definition that will be considererd during data import
    this.ancestorMultipleEntityDefUuid = determineAncestorMultipleEntityDefUuid({ survey, nodeDefUuid })
  }

  async calculatTotalItems() {
    const { filePath, fileFormat } = this.context

    this.total = await FlatDataReader.calculateTotalRowsFromFile({ filePath, fileFormat })
  }

  shouldCalculatedTotalItems() {
    return true
  }

  async execute() {
    super.execute()

    const { context } = this
    const { abortOnErrors, dryRun } = context

    this.validateParameters()

    if (this.shouldCalculatedTotalItems()) {
      await this.calculatTotalItems()
    }

    await this.fetchRecordsSummary()

    this.flatDataReader = await this.createFlatDataReader()
    await this.startFlatDataReader()

    if (!this.isCanceled()) {
      await this.updatePendingDependentsSafe()
    }

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
        entityUuidTouchedByRecordUuid: this.entityUuidTouchedByRecordUuid,
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

  async createFlatDataReader() {
    const { cycle, nodeDefUuid, survey, fileFormat, includeFiles } = this.context

    const stream = await this.dataImportFileReader.getCsvFileStream()

    return DataImportFlatDataFileReader.createReaderFromStream({
      stream,
      fileFormat,
      survey,
      categoryItemProvider,
      taxonProvider,
      cycle,
      nodeDefUuid,
      includeFiles,
      onRowItem: async (item) => this.onRowItem(item),
    })
  }

  async startFlatDataReader() {
    try {
      await this.flatDataReader.start()
    } catch (e) {
      const errorKey = e.key || e.toString()
      const errorParams = e.params
      this._addError(errorKey, errorParams)
    }
  }

  async cancel() {
    await super.cancel()
    this.flatDataReader?.cancel()
  }

  async setStatusFailed() {
    await super.setStatusFailed()
    this.flatDataReader?.cancel()
  }

  async fetchOrCreateRecord({ valuesByDefUuid }) {
    const { currentRecord, context, tx } = this
    const flushCallback = async () => {
      // dependents must be updated (and persisted) before another record is fetched
      await this.updatePendingDependents()
      await this.flushBatchPersisters()
    }
    return DataImportJobRecordProvider.fetchOrCreateRecord({
      valuesByDefUuid,
      currentRecord,
      flushCallback,
      context,
      tx,
    })
  }

  async onRowItem({ valuesByDefUuid, refDataByDefUuid, errors }) {
    const { context } = this
    const { survey, includeFiles, insertMissingNodes, user } = context

    if (this.isCanceled()) {
      return
    }

    this.incrementProcessedItems()
    if (this.processed % 1000 === 0) {
      this.logDebug(`${this.processed} items processed`)
    }

    errors.forEach((error) => {
      this._addError(error.key || error.toString(), error.params)
    })

    try {
      const previousRecord = this.currentRecord
      const { record, newRecord } = await this.fetchOrCreateRecord({ valuesByDefUuid })
      if (previousRecord && Record.getUuid(previousRecord) !== Record.getUuid(record)) {
        // moving to another record: update dependents of the previous one (this.currentRecord is still the previous one)
        await this.updatePendingDependents()
      }
      if (Record.getUuid(previousRecord) !== Record.getUuid(record)) {
        this.entityKeysIndexCache = new Record.EntityKeysIndexCache()
      }
      this.currentRecord = record
      const recordUuid = Record.getUuid(this.currentRecord)

      // when importing files, do not do side effect on record: it's necessary to keep track of updated/deleted file uuids (see updateFilesSummary function)
      const sideEffect = !includeFiles

      const updateResult = new RecordUpdateResult({ record: this.currentRecord })
      if (newRecord) {
        Record.getNodesArray(record).forEach((node) => updateResult.addNode(node, { sideEffect: true }))
        this.currentRecord = updateResult.record
      }

      const { entity, updateResult: entityUpdateResult } = await Record.getOrCreateEntityByKeys({
        user,
        survey,
        entityDefUuid: this.ancestorMultipleEntityDefUuid,
        valuesByDefUuid,
        refDataByDefUuid,
        categoryItemProvider,
        taxonProvider,
        insertMissingNodes,
        sideEffect,
        updateDependents: false,
        entityKeysIndexCache: this.entityKeysIndexCache,
      })(this.currentRecord)

      const entityUuid = Node.getUuid(entity)

      Objects.setInPath({ obj: this.entityUuidTouchedByRecordUuid, path: [recordUuid, entityUuid], value: true })

      if (Node.isCreated(entity)) {
        this.entitiesCreated += 1
      }

      updateResult.merge(entityUpdateResult)
      this.currentRecord = updateResult.record

      await this.clearMultipleAttributeValues({ entity, valuesByDefUuid, sideEffect })

      const updateResultUpdateAttributes = await Record.updateAttributesInEntityWithValues({
        survey,
        entity,
        valuesByDefUuid,
        refDataByDefUuid,
        sideEffect,
        categoryItemProvider,
        taxonProvider,
        updateDependents: false,
      })(this.currentRecord)

      updateResult.merge(updateResultUpdateAttributes)
      this.currentRecord = updateResult.record

      const { nodes: nodesUpdated } = updateResult
      await this.persistUpdatedNodes({ nodesUpdated })

      Object.values(nodesUpdated).forEach((node) => {
        if (!Node.isDeleted(node)) {
          this.nodesPendingDependentsUpdateByUuid.set(Node.getUuid(node), node)
        }
      })

      // update counts
      const nodesUpdatedArray = Object.values(nodesUpdated)
      if (newRecord) {
        this.updatedValues += Record.getNodesArray(this.currentRecord).length
        this.insertedRecordsUuids.add(recordUuid)
      } else if (nodesUpdatedArray.length > 0) {
        this.updatedValues += nodesUpdatedArray.length
        this.updatedRecordsUuids.add(recordUuid)
      }
      this.updateFilesSummary({ originalRecord: record, nodesUpdatedArray })
    } catch (e) {
      const { key, params } = e
      const errorKey = key ?? Validation.messageKeys.dataImport.errorUpdatingValues
      const errorParams = params ?? { details: String(e) }
      this._addError(errorKey, errorParams)
    }
  }

  /**
   * Updates the dependent nodes and the validation of the nodes updated in the current record since the last call,
   * and persists the changes.
   * @returns {Promise<void>} - The promise that resolves when the update is completed.
   */
  async updatePendingDependents() {
    const { context, currentRecord } = this
    const pendingNodesByUuid = this.nodesPendingDependentsUpdateByUuid
    if (pendingNodesByUuid.size === 0) return

    const { survey, includeFiles, user } = context

    const nodesUpdated = {}
    pendingNodesByUuid.forEach((_node, nodeUuid) => {
      const node = Record.getNodeByUuid(nodeUuid)(currentRecord)
      if (node) {
        nodesUpdated[nodeUuid] = node
      }
    })
    this.nodesPendingDependentsUpdateByUuid = new Map()

    if (Object.keys(nodesUpdated).length === 0) return

    const { record: recordUpdated, nodes: nodesUpdatedWithDependents } = await Record.afterNodesUpdate({
      user,
      survey,
      record: currentRecord,
      nodes: nodesUpdated,
      categoryItemProvider,
      taxonProvider,
      sideEffect: !includeFiles,
    })
    this.currentRecord = recordUpdated

    // persist only the nodes changed by the dependents update (the original nodes have already been persisted)
    const nodesChanged = Object.values(nodesUpdatedWithDependents).filter(
      (node) => Node.isCreated(node) || Node.isUpdated(node) || Node.isDeleted(node)
    )

    // nodes inserted in this same batch have no id yet (it is set when they are inserted) and the updates use it:
    // insert them now and copy the id from the node object that has been inserted
    const nodesWithoutId = nodesChanged.filter((node) => !Node.getId(node))
    if (nodesWithoutId.length > 0) {
      await this.nodesInsertBatchPersister.flush()
      nodesWithoutId.forEach((node) => {
        const nodeId = Node.getId(pendingNodesByUuid.get(Node.getUuid(node)))
        if (nodeId) {
          node.id = nodeId
        }
      })
    }
    await this.persistUpdatedNodes({ nodesUpdated: nodesChanged })

    const recordUuid = Record.getUuid(recordUpdated)
    if (nodesChanged.length > 0 && !this.insertedRecordsUuids.has(recordUuid)) {
      this.updatedValues += nodesChanged.length
      this.updatedRecordsUuids.add(recordUuid)
    }
  }

  async updatePendingDependentsSafe() {
    try {
      await this.updatePendingDependents()
    } catch (e) {
      const { key, params } = e
      const errorKey = key ?? Validation.messageKeys.dataImport.errorUpdatingValues
      const errorParams = params ?? { details: String(e) }
      this._addError(errorKey, errorParams)
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
          filesToDeleteByUuid[fileToDeleteUuid] = SurveyFile.createFileFromNode({ node: oldNode })
        }
        if (!Node.isValueBlank(node)) {
          const fileSummary = SurveyFile.createFileFromNode({ node })
          const fileUuid = SurveyFile.getUuid(fileSummary)
          // check duplicates
          if (updatedFilesByUuid[fileUuid]) {
            throw new Error('File with same uuid already inserted: ' + fileUuid)
          }
          const fileName = SurveyFile.getName(fileSummary)
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
    const { context, entitiesCreated } = this
    const { dryRun } = context
    return { ...result, dryRun, entitiesCreated }
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

FlatDataImportJob.type = 'DataImportJob'
