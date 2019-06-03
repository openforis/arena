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

class EntitiesUniquenessValidationJob extends Job {

  constructor (params) {
    super(EntitiesUniquenessValidationJob.type, params)

    this.recordValidationBatchPersister = new BatchPersister(this.persistRecordsValidation.bind(this))
  }

  async onStart () {
    await super.onStart()
    await RecordManager.disableTriggers(this.getSurveyId(), this.tx)

    this.survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(this.getSurveyId(), true, true, false, this.tx)
  }

  async execute (tx) {
    const { root, length } = Survey.getHierarchy()(this.survey)

    this.total = length - 1 //do not consider root entity

    await Survey.traverseHierarchyItem(root, async nodeDefEntity => {
      //ignore root entity uniqueness check (it will be performed by record key uniqueness check job)
      if (this.isCanceled() || NodeDef.isRoot(nodeDefEntity))
        return

      await this.validateEntityUniqueness(nodeDefEntity)
      this.incrementProcessedItems()
    })
  }

  async validateEntityUniqueness (nodeDefEntity) {
    const nodeDefKeys = Survey.getNodeDefKeys(nodeDefEntity)(this.survey)
    if (!R.isEmpty(nodeDefKeys)) {
      const rowsRecordsWithDuplicateEntities = await SurveyRdbManager.fetchRecordsWithDuplicateEntities(this.survey, nodeDefEntity, nodeDefKeys, this.tx)

      if (!R.isEmpty(rowsRecordsWithDuplicateEntities)) {
        for (const rowRecordWithDuplicateEntities of rowsRecordsWithDuplicateEntities) {
          const { uuid, validation, node_key_uuid_by_node_def_uuid } = rowRecordWithDuplicateEntities

          const nodeKeyUuids = R.pipe(
            R.values,
            R.flatten
          )(node_key_uuid_by_node_def_uuid)

          let validationUpdated = nodeKeyUuids.reduce((validationRecord, nodeKeyUuid) => {
              const nodeValidation = Validator.getFieldValidation(nodeKeyUuid)(validationRecord)

              //assoc new validation to node validation
              const nodeValidationUpdated = R.mergeDeepRight(nodeValidation, {
                [Validator.keys.fields]: {
                  [RecordValidation.keys.entityKeys]: {
                    [Validator.keys.valid]: false
                  }
                },
                [Validator.keys.valid]: false
              })

              return ObjectUtils.setInPath([Validator.keys.fields, nodeKeyUuid], nodeValidationUpdated)(validationRecord)
            },
            validation
          )

          //add record and validation to batch persister
          await this.recordValidationBatchPersister.addItem([
            uuid,
            validationUpdated
          ], this.tx)
        }
      }
    }
  }

  async onEnd () {
    await super.onEnd()

    await this.recordValidationBatchPersister.flush(this.tx)
  }

  async persistRecordsValidation (recordAndValidationValues) {
    await RecordManager.updateRecordValidationsFromValues(this.getSurveyId(), recordAndValidationValues, this.tx)
  }
}

EntitiesUniquenessValidationJob.type = 'EntitiesUniquenessValidationJob'

module.exports = EntitiesUniquenessValidationJob