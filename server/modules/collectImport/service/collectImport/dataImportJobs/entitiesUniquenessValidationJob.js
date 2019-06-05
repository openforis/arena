const R = require('ramda')

const ObjectUtils = require('../../../../../../common/objectUtils')

const Survey = require('../../../../../../common/survey/survey')
const NodeDef = require('../../../../../../common/survey/nodeDef')

const RecordValidation = require('../../../../../../common/record/recordValidation')
const Validator = require('../../../../../../common/validation/validator')

const SurveyManager = require('../../../../survey/manager/surveyManager')
const RecordManager = require('../../../../record/manager/recordManager')
const SurveyRdbManager = require('../../../../surveyRdb/manager/surveyRdbManager')

const Job = require('../../../../../job/job')

const recordValidationUpdateBatchSize = 1000

class EntitiesUniquenessValidationJob extends Job {

  constructor (params) {
    super(EntitiesUniquenessValidationJob.type, params)

    //cache of record validations
    this.validationByRecordUuid = {}
  }

  async onStart () {
    await super.onStart()

    this.survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(this.getSurveyId(), true, true, false, this.tx)
  }

  async execute (tx) {
    //1. traverse survey hierarchy and find duplicate entities

    const { root, length } = Survey.getHierarchy()(this.survey)

    this.total = length - 1 //do not consider root entity

    await Survey.traverseHierarchyItem(root, async nodeDefEntity => {
      if (this.isCanceled())
        return

      //2. for each entity def, validate entities uniqueness
      await this.validateEntitiesUniqueness(nodeDefEntity)

      this.incrementProcessedItems()
    })
  }

  async validateEntitiesUniqueness (nodeDefEntity) {
    const nodeDefKeys = Survey.getNodeDefKeys(nodeDefEntity)(this.survey)
    if (R.isEmpty(nodeDefKeys)) {
      return
    }

    //1. find records with duplicate entities
    const rowsRecordsWithDuplicateEntities = await SurveyRdbManager.fetchRecordsWithDuplicateEntities(this.survey, nodeDefEntity, nodeDefKeys, this.tx)

    if (!R.isEmpty(rowsRecordsWithDuplicateEntities)) {
      const validationDuplicate = _createValidationRecordOrEntityDuplicate(nodeDefEntity)

      for (const rowRecordWithDuplicateEntities of rowsRecordsWithDuplicateEntities) {
        if (this.isCanceled())
          return

        //2. for each duplicate node entity, update record validation
        const { uuid, validation, node_duplicate_uuids } = rowRecordWithDuplicateEntities

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
      await RecordManager.updateRecordValidationsFromValues(this.getSurveyId(), recordAndValidationValues, this.tx)
      this.validationByRecordUuid = {}
    }
  }

  async beforeEnd () {
    await super.beforeEnd()

    await this.flushRecordValidationBatchUpdate()
  }

}

EntitiesUniquenessValidationJob.type = 'EntitiesUniquenessValidationJob'

const _createValidationRecordOrEntityDuplicate = nodeDefEntity => {
  const isRoot = NodeDef.isRoot(nodeDefEntity)
  return {
    [Validator.keys.valid]: false,
    [Validator.keys.fields]: {
      [isRoot
        ? RecordValidation.keys.recordKeys
        : RecordValidation.keys.entityKeys
        ]: {
        [Validator.keys.valid]: false,
        [Validator.keys.errors]: [
          isRoot
            ? RecordValidation.keysError.duplicateRecord
            : RecordValidation.keysError.duplicateEntity
        ]
      }
    }
  }
}

const _updateNodeValidation = (validationRecord, nodeUuid, validationNode) => {
  const nodeValidation = Validator.getFieldValidation(nodeUuid)(validationRecord)

  //merge new validation with node validation
  const nodeValidationUpdated = R.mergeDeepRight(nodeValidation, validationNode)

  //replace node validation in record validation
  ObjectUtils.setInPath([Validator.keys.fields, nodeUuid], nodeValidationUpdated)(validationRecord)

  return {
    ...validationRecord,
    [Validator.keys.valid]: false
  }
}

module.exports = EntitiesUniquenessValidationJob