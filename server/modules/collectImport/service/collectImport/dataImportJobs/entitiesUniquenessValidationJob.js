const R = require('ramda')

const ObjectUtils = require('../../../../../../common/objectUtils')
const BatchPersister = require('../../../../../db/batchPersister')

const Survey = require('../../../../../../common/survey/survey')
const NodeDef = require('../../../../../../common/survey/nodeDef')
const Record = require('../../../../../../common/record/record')
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
      const duplicateEntitiesRows = await SurveyRdbManager.fetchDuplicateNodeEntities(this.survey, nodeDefEntity, nodeDefKeys, this.tx)

      if (!R.isEmpty(duplicateEntitiesRows)) {
        let record = null
        let recordValidation = null

        for (const duplicateEntityRow of duplicateEntitiesRows) {
          const { record_uuid: recordUuid, meta } = duplicateEntityRow
          const { nodeRowKeyUuidByNodeDefUuid } = meta

          if (record === null || Record.getUuid(record) !== recordUuid) {
            //record changed
            if (record !== null) {
              //add record and validation to batch persister
              await this.recordValidationBatchPersister.addItem([
                recordUuid,
                recordValidation
              ], this.tx)
            }

            record = await RecordManager.fetchRecordByUuid(this.getSurveyId(), recordUuid, this.tx)
            recordValidation = Record.getValidation(record)
            recordValidation[Validator.keys.valid] = false
          }

          for (const nodeDefKey of nodeDefKeys) {
            const nodeKeyUuid = nodeRowKeyUuidByNodeDefUuid[NodeDef.getUuid(nodeDefKey)]

            if (nodeKeyUuid) {
              let nodeValidation = Validator.getFieldValidation(nodeKeyUuid)(recordValidation)

              //assoc new validation to node validation
              nodeValidation = R.mergeDeepRight(nodeValidation, {
                [Validator.keys.fields]: {
                  [RecordValidation.keys.entityKeys]: {
                    [Validator.keys.valid]: false
                  }
                },
                [Validator.keys.valid]: false
              })

              recordValidation = ObjectUtils.setInPath([Validator.keys.fields, nodeKeyUuid], nodeValidation)(recordValidation)
            }
          }

        }
      }
    }
  }

  async onEnd () {
    await super.onEnd()

    await this.recordValidationBatchPersister.flush(this.tx)
  }

  async persistRecordsValidation (recordAndValidationValues, tx) {
    await RecordManager.updateRecordValidationsFromValues(this.getSurveyId(), recordAndValidationValues, this.tx)
  }
}

EntitiesUniquenessValidationJob.type = 'EntitiesUniquenessValidationJob'

module.exports = EntitiesUniquenessValidationJob