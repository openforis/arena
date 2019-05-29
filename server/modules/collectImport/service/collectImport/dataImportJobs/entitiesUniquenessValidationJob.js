const R = require('ramda')

const BatchPersister = require('../../../../../db/batchPersister')

const FileXml = require('../../../../../../common/file/fileXml')
const Queue = require('../../../../../../common/queue')

const Survey = require('../../../../../../common/survey/survey')
const NodeDef = require('../../../../../../common/survey/nodeDef')
const NodeDefValidations = require('../../../../../../common/survey/nodeDefValidations')
const Record = require('../../../../../../common/record/record')
const Node = require('../../../../../../common/record/node')
const RecordValidation = require('../../../../../../common/record/recordValidation')
const RecordValidator = require('../../../../../../common/record/recordValidator')
const Validator = require('../../../../../../common/validation/validator')

const SurveyManager = require('../../../../survey/manager/surveyManager')
const RecordManager = require('../../../../record/manager/recordManager')

const Job = require('../../../../../job/job')

const CollectRecord = require('../model/collectRecord')
const CollectAttributeValueExtractor = require('./collectAttributeValueExtractor')

const CollectSurvey = require('../model/collectSurvey')

class EntitiesUniquenessValidationJob extends Job {

  constructor (params) {
    super(EntitiesUniquenessValidationJob.type, params)
  }

  async onStart () {
    await super.onStart()
    await RecordManager.disableTriggers(this.getSurveyId(), this.tx)
  }

  async execute (tx) {
    const surveyId = this.getSurveyId()
    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(surveyId, true, true, false, this.tx)
    const { root } = Survey.getHierarchy()(survey)
    await Survey.traverseHierarchyItem(root, async nodeDefEntity => {
      const nodeDefKeys = Survey.getNodeDefKeys(nodeDefEntity)(survey)
      if (!R.isEmpty(nodeDefKeys)) {
        const nodeDefKeyUuids = nodeDefKeys.map(NodeDef.getUuid)
        const recordNodeUuidsDuplicates = await RecordManager.fetchDuplicateEntityKeyNodeUuids(surveyId, NodeDef.getUuid(nodeDefEntity), nodeDefKeyUuids, this.tx)

        for (const recordNodeUuidsDuplicate  of recordNodeUuidsDuplicates) {
          const { record_uuid, node_uuids } = recordNodeUuidsDuplicate

          const record = await RecordManager.fetchRecordByUuid(surveyId, record_uuid, this.tx)
          const recordValidation = Record.getValidation(record)

          for (const nodeUuid of node_uuids) {
            let nodeValidation = Validator.getFieldValidation(nodeUuid)(recordValidation)

            //assoc new validation to node validation
            nodeValidation = R.mergeDeepRight(nodeValidation, {
              [Validator.keys.fields]: {
                [RecordValidation.keys.entityKeys]: {
                  [Validator.keys.valid]: false
                }
              },
              [Validator.keys.valid]: false
            })

            recordValidation[Validator.keys.fields][nodeUuid] = nodeValidation
          }

          await RecordManager.persistValidation(survey, record, recordValidation, this.tx)
        }
      }
    })
  }
}

EntitiesUniquenessValidationJob.type = 'EntitiesUniquenessValidationJob'

module.exports = EntitiesUniquenessValidationJob