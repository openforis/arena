const R = require('ramda')

const Survey = require('../../../../../../common/survey/survey')

const RecordValidation = require('../../../../../../common/record/recordValidation')
const Validator = require('../../../../../../common/validation/validator')
const Validation = require('../../../../../../common/validation/validation')

const SurveyManager = require('../../../../survey/manager/surveyManager')
const RecordManager = require('../../../../record/manager/recordManager')
const SurveyRdbManager = require('../../../../surveyRdb/manager/surveyRdbManager')

const Job = require('../../../../../job/job')

const recordValidationUpdateBatchSize = 1000

class RecordsUniquenessValidationJob extends Job {

  constructor (params) {
    super(RecordsUniquenessValidationJob.type, params)

    //cache of record validations
    this.validationByRecordUuid = {}
  }

  async execute (tx) {
    this.total = 2

    // 1. fetch survey and node defs
    this.survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(this.surveyId, true, true, false, this.tx)
    this.incrementProcessedItems()

    const nodeDefRoot = Survey.getRootNodeDef(this.survey)
    const nodeDefKeys = Survey.getNodeDefKeys(nodeDefRoot)(this.survey)
    if (R.isEmpty(nodeDefKeys)) {
      return
    }

    // 2. find duplicate records
    const rowsRecordsDuplicate = await SurveyRdbManager.fetchRecordsWithDuplicateEntities(this.survey, nodeDefRoot, nodeDefKeys, this.tx)

    if (!R.isEmpty(rowsRecordsDuplicate)) {
      // 3. update records validation
      const validationDuplicate = _createValidationRecordDuplicate(nodeDefRoot)

      for (const rowRecordDuplicate of rowsRecordsDuplicate) {
        if (this.isCanceled())
          return

        //2. for each duplicate node entity, update record validation
        const { uuid, validation, node_duplicate_uuids } = rowRecordDuplicate

        const validationRecord = this.validationByRecordUuid[uuid] || validation

        const validationUpdated = node_duplicate_uuids.reduce(
          (validationRecord, nodeEntityDuplicateUuid) =>
            _updateNodeValidation(validationRecord, nodeEntityDuplicateUuid, validationDuplicate)
          , validationRecord
        )

        //3. add record validation to batch update
        await this.addRecordValidationToBatchUpdate(uuid, validationUpdated)
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
      [{ key: Validator.messageKeys.record.keyDuplicate }]
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