const R = require('ramda')

const Record = require('@core/record/record')
const RecordValidation = require('@core/record/recordValidation')
const Node = require('@core/record/node')
const Validation = require('@core/validation/validation')

const DataViewReadRepository = require('../../../surveyRdb/repository/dataViewReadRepository')

const validateRecordKeysUniqueness = async (survey, record, tx) => {

  // 1. check if record is unique
  const recordsCount = await DataViewReadRepository.countDuplicateRecords(survey, record, tx)
  const isUnique = recordsCount === 0

  // 3. fetch key nodes
  const rootNode = Record.getRootNode(record)
  const keyNodes = Record.getEntityKeyNodes(survey, rootNode)(record)

  // 4. associate validation error to each key node
  const validationNodesKey = {}
  for (const keyNode of keyNodes) {
    validationNodesKey[Node.getUuid(keyNode)] = RecordValidation.newValidationRecordDuplicate(isUnique)
  }
  return validationNodesKey
}

/**
 * Returns an indexed object with recordUuid as key and validation as value
 */
const validateRecordsUniqueness = async (survey, cycle, keyNodes, recordUuidExcluded, excludeRecordFromCount, tx) => {
  const result = {}
  const recordsCountRows = await DataViewReadRepository.fetchRecordsCountByKeys(survey, cycle, keyNodes, recordUuidExcluded, excludeRecordFromCount, tx)

  if (!R.isEmpty(recordsCountRows)) {
    for (const { recordUuid, count, nodesKeyUuids } of recordsCountRows) {
      const isUnique = count === '1'
      const validationNodesKeyFields = {}
      for (const nodeKeyUuid of nodesKeyUuids) {
        validationNodesKeyFields[nodeKeyUuid] = RecordValidation.newValidationRecordDuplicate(isUnique)
      }
      result[recordUuid] = Validation.newInstance(
        isUnique,
        validationNodesKeyFields
      )
    }
  }
  return result
}

module.exports = {
  validateRecordKeysUniqueness,
  validateRecordsUniqueness
}