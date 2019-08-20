const R = require('ramda')

const Survey = require('../../../../../common/survey/survey')
const Record = require('../../../../../common/record/record')
const RecordValidation = require('../../../../../common/record/recordValidation')
const Node = require('../../../../../common/record/node')
const Validator = require('../../../../../common/validation/validator')

const SurveyRdbManager = require('../../../surveyRdb/manager/surveyRdbManager')
const recordRepository = require('../../repository/recordRepository')

const validateRecordKeysUniqueness = async (survey, record, tx) => {

  // 1. check if record is unique
  const recordsCount = await SurveyRdbManager.countDuplicateRecords(survey, record, tx)
  const isUnique = recordsCount === 0

  // 3. fetch key nodes
  const rootNode = Record.getRootNode(record)

  const keyNodes = Record.getEntityKeyNodes(survey, rootNode)(record)

  // 4. associate validation error to each key node
  return R.pipe(
    R.map(keyNode => newValidationRecordDuplicate(isUnique)(Node.getUuid(keyNode))),
    R.flatten,
    R.mergeAll
  )(keyNodes)
}

const validateRecordsKeysUniqueness = async (survey, recordUuidExcluded, keyNodes, tx) => {
  const recordsCountRows = await SurveyRdbManager.fetchRecordsCountByKeys(survey, recordUuidExcluded, keyNodes, tx)

  if (!R.isEmpty(recordsCountRows)) {
    const surveyId = Survey.getId(survey)
    const recordUuidAndValidationValues = []

    for (const { recordUuid, count, nodesKeyUuids } of recordsCountRows) {
      const record = await recordRepository.fetchRecordByUuid(surveyId, recordUuid, tx)
      const unique = count === 1
      const validationNodesKey = {
        [Validator.keys.fields]: R.map(newValidationRecordDuplicate(unique))(nodesKeyUuids)
      }
      const validationUpdated = Validator.mergeValidation(validationNodesKey)(Validator.getValidation(record))
      recordUuidAndValidationValues.push([recordUuid, validationUpdated])
    }

    await recordRepository.updateRecordValidationsFromValues(surveyId, recordUuidAndValidationValues, tx)
  }
}

const newValidationRecordDuplicate = isUnique => nodeKeyUuid => ({
  [nodeKeyUuid]: {
    [Validator.keys.fields]: {
      [RecordValidation.keys.recordKeys]: {
        [Validator.keys.errors]: isUnique ? [] : [{ key: RecordValidation.keysError.duplicateRecord }],
        [Validator.keys.valid]: isUnique
      }
    }
  }
})

module.exports = {
  validateRecordKeysUniqueness,
  validateRecordsKeysUniqueness
}