const R = require('ramda')

const Record = require('../../../../../common/record/record')
const RecordValidation = require('../../../../../common/record/recordValidation')
const Node = require('../../../../../common/record/node')
const Validator = require('../../../../../common/validation/validator')

const SurveyRdbManager = require('../../../surveyRdb/manager/surveyRdbManager')

const validateRecordKeysUniqueness = async (survey, record, tx) => {

  // 1. check if record is unique
  const recordsCount = await SurveyRdbManager.countDuplicateRecords(survey, record, tx)
  const isUnique = recordsCount === 0

  // 3. fetch key nodes
  const rootNode = Record.getRootNode(record)

  const keyNodes = Record.getEntityKeyNodes(survey, rootNode)(record)

  // 4. associate validation error to each key node
  return R.pipe(
    R.map(keyNode => ({
        [Node.getUuid(keyNode)]: {
          [Validator.keys.fields]: {
            [RecordValidation.keys.recordKeys]: {
              [Validator.keys.errors]: isUnique ? [] : [RecordValidation.keysError.duplicateRecord],
              [Validator.keys.valid]: isUnique
            }
          }
        }
      })
    ),
    R.flatten,
    R.mergeAll
  )(keyNodes)
}

module.exports = {
  validateRecordKeysUniqueness
}