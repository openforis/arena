const R = require('ramda')

const Survey = require('../../../../core/survey/survey')
const NodeDef = require('../../../../core/survey/nodeDef')

const Node = require('../../../../core/record/node')
const RecordValidation = require('../../../../core/record/recordValidation')
const Validation = require('../../../../core/validation/validation')

const SurveyManager = require('../../survey/manager/surveyManager')
const RecordManager = require('../manager/recordManager')
const SurveyRdbManager = require('../../surveyRdb/manager/surveyRdbManager')

const Job = require('../../../job/job')

const recordValidationUpdateBatchSize = 1000

class RecordsUniquenessValidationJob extends Job {

  constructor (params) {
    super(RecordsUniquenessValidationJob.type, params)

    //cache of record validations
    this.validationByRecordUuid = {}
  }

  async execute (tx) {
    const survey = await SurveyManager.fetchSurveyById(this.surveyId, false, false, this.tx)
    const cycleKeys = R.pipe(Survey.getSurveyInfo, Survey.getCycleKeys)(survey)

    this.total = R.length(cycleKeys) * 2

    for (const cycle of cycleKeys)
      await this.validateRecordsUniquenessByCycle(cycle)
  }

  async validateRecordsUniquenessByCycle (cycle) {
    // 1. fetch survey and node defs
    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(this.surveyId, cycle, true, true, false, false, this.tx)
    this.incrementProcessedItems()

    const nodeDefRoot = Survey.getNodeDefRoot(survey)
    const nodeDefKeys = Survey.getNodeDefKeys(nodeDefRoot)(survey)
    if (R.isEmpty(nodeDefKeys)) {
      return
    }

    // 2. find duplicate records
    const rowsRecordsDuplicate = await SurveyRdbManager.fetchRecordsWithDuplicateEntities(survey, cycle, nodeDefRoot, nodeDefKeys, this.tx)

    if (!R.isEmpty(rowsRecordsDuplicate)) {
      // 3. update records validation
      const validationDuplicate = _createValidationRecordDuplicate(nodeDefRoot)

      for (const rowRecordDuplicate of rowsRecordsDuplicate) {
        if (this.isCanceled())
          return

        //2. for each duplicate node entity, update record validation
        const { uuid: recordUuid, validation, node_duplicate_uuids } = rowRecordDuplicate
        const nodeRootUuid = node_duplicate_uuids[0]
        const nodesKeyDuplicate = await RecordManager.fetchChildNodesByNodeDefUuids(this.surveyId, recordUuid, nodeRootUuid, nodeDefKeys.map(NodeDef.getUuid), this.tx)
        const validationRecord = this.validationByRecordUuid[recordUuid] || validation

        const validationUpdated = nodesKeyDuplicate.reduce(
          (validationRecord, nodeKeyDuplicate) =>
            _updateNodeValidation(validationRecord, Node.getUuid(nodeKeyDuplicate), validationDuplicate)
          , validationRecord
        )

        //3. add record validation to batch update
        await this.addRecordValidationToBatchUpdate(recordUuid, validationUpdated)
      }
    }

    this.incrementProcessedItems()
  }

  async addRecordValidationToBatchUpdate (recordUuid, validation) {
    this.validationByRecordUuid[recordUuid] = validation

    if (Object.keys(this.validationByRecordUuid).length === recordValidationUpdateBatchSize) {
      await this.flushRecordValidationBatchUpdate()
    }
  }

  async flushRecordValidationBatchUpdate () {
    if (Object.keys(this.validationByRecordUuid).length > 0) {
      const recordAndValidationValues = Object.entries(this.validationByRecordUuid)
      await RecordManager.updateRecordValidationsFromValues(this.surveyId, recordAndValidationValues, this.tx)
      this.validationByRecordUuid = {}
    }
  }

  async beforeEnd () {
    await super.beforeEnd()

    await this.flushRecordValidationBatchUpdate()
  }

}

RecordsUniquenessValidationJob.type = 'RecordsUniquenessValidationJob'

const _createValidationRecordDuplicate = () => Validation.newInstance(
  false,
  {
    [RecordValidation.keys.recordKeys]: Validation.newInstance(
      false,
      {},
      [{ key: Validation.messageKeys.record.keyDuplicate }]
    )
  })

const _updateNodeValidation = (validationRecord, nodeUuid, validationNode) => {
  const nodeValidation = Validation.getFieldValidation(nodeUuid)(validationRecord)

  //merge new validation with node validation
  const nodeValidationUpdated = R.mergeDeepRight(nodeValidation, validationNode)

  //replace node validation in record validation
  return R.pipe(
    Validation.setValid(false),
    Validation.setField(nodeUuid, nodeValidationUpdated),
  )(validationRecord)
}

module.exports = RecordsUniquenessValidationJob