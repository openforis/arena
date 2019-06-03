const R = require('ramda')

const ObjectUtils = require('../../../../../../common/objectUtils')
const BatchPersister = require('../../../../../db/batchPersister')

const Survey = require('../../../../../../common/survey/survey')
const NodeDef = require('../../../../../../common/survey/nodeDef')

const RecordValidation = require('../../../../../../common/record/recordValidation')
const Validator = require('../../../../../../common/validation/validator')

const SurveyManager = require('../../../../survey/manager/surveyManager')
const RecordManager = require('../../../../record/manager/recordManager')
const SurveyRdbManager = require('../../../../surveyRdb/manager/surveyRdbManager')

const Job = require('../../../../../job/job')

const entityDuplicateValidation = {
  [Validator.keys.valid]: false,
  [Validator.keys.fields]: {
    [RecordValidation.keys.entityKeys]: {
      [Validator.keys.valid]: false,
      [Validator.keys.errors]: [RecordValidation.keysError.duplicateEntity]
    }
  }
}

class EntitiesUniquenessValidationJob extends Job {

  constructor (params) {
    super(EntitiesUniquenessValidationJob.type, params)

    this.recordValidationBatchPersister = new BatchPersister(this.persistRecordsValidation.bind(this))
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
      //ignore root entity uniqueness check (it will be performed by record key uniqueness check job)
      if (this.isCanceled() || NodeDef.isRoot(nodeDefEntity))
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
      for (const rowRecordWithDuplicateEntities of rowsRecordsWithDuplicateEntities) {
        if (this.isCanceled())
          return

        //2. for each duplicate node entity, update record validation
        const { uuid, validation, node_duplicate_uuids } = rowRecordWithDuplicateEntities

        let validationUpdated = node_duplicate_uuids.reduce((validationRecord, nodeEntityDuplicateUuid) => {
            const nodeValidation = Validator.getFieldValidation(nodeEntityDuplicateUuid)(validationRecord)

            //assoc new validation to node validation
            const nodeValidationUpdated = R.mergeDeepRight(nodeValidation, entityDuplicateValidation)

            return ObjectUtils.setInPath([Validator.keys.fields, nodeEntityDuplicateUuid], nodeValidationUpdated)(validationRecord)
          },
          validation
        )

        //3. store updated record validation (using batch persister)
        await this.recordValidationBatchPersister.addItem([
          uuid,
          validationUpdated
        ])
      }
    }
  }

  async beforeEnd () {
    await super.beforeEnd()

    await this.recordValidationBatchPersister.flush(this.tx)
  }

  async persistRecordsValidation (recordAndValidationValues) {
    await RecordManager.updateRecordValidationsFromValues(this.getSurveyId(), recordAndValidationValues, this.tx)
  }
}

EntitiesUniquenessValidationJob.type = 'EntitiesUniquenessValidationJob'

module.exports = EntitiesUniquenessValidationJob