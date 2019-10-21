import * as R from 'ramda';
import Record from '../../../../../core/record/record';
import RecordValidation from '../../../../../core/record/recordValidation';
import Node from '../../../../../core/record/node';
import Validation from '../../../../../core/validation/validation';
import SurveyRdbManager from '../../../surveyRdb/manager/surveyRdbManager';

const validateRecordKeysUniqueness = async (survey, record, tx) => {

  // 1. check if record is unique
  const recordsCount = await SurveyRdbManager.countDuplicateRecords(survey, record, tx)
  const isUnique = recordsCount === 0

  // 3. fetch key nodes
  const rootNode = Record.getRootNode(record)
  const keyNodes = Record.getEntityKeyNodes(survey, rootNode)(record)

  // 4. associate validation error to each key node
  const validationNodesKey = {}
  for (const keyNode of keyNodes) {
    validationNodesKey[Node.getUuid(keyNode)] = _newValidationRecordDuplicate(isUnique)
  }
  return validationNodesKey
}

/**
 * Returns an indexed object with recordUuid as key and validation as value
 */
const validateRecordsUniqueness = async (survey, cycle, keyNodes, recordUuidExcluded, excludeRecordFromCount, tx) => {
  const result = {}
  const recordsCountRows = await SurveyRdbManager.fetchRecordsCountByKeys(survey, cycle, keyNodes, recordUuidExcluded, excludeRecordFromCount, tx)

  if (!R.isEmpty(recordsCountRows)) {
    for (const { recordUuid, count, nodesKeyUuids } of recordsCountRows) {
      const isUnique = count === '1'
      const validationNodesKeyFields = {}
      for (const nodeKeyUuid of nodesKeyUuids) {
        validationNodesKeyFields[nodeKeyUuid] = _newValidationRecordDuplicate(isUnique)
      }
      result[recordUuid] = Validation.newInstance(
        isUnique,
        validationNodesKeyFields
      )
    }
  }
  return result
}

const _newValidationRecordDuplicate = isUnique => Validation.newInstance(
  isUnique,
  {
    [RecordValidation.keys.recordKeys]: Validation.newInstance(
      isUnique,
      {},
      isUnique ? [] : [{ key: Validation.messageKeys.record.keyDuplicate }]
    )
  }
)

export default {
  validateRecordKeysUniqueness,
  validateRecordsUniqueness
};
