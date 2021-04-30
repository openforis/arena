import * as R from 'ramda'

import * as Record from '@core/record/record'
import * as RecordValidation from '@core/record/recordValidation'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'

import * as DataViewRepository from '@server/modules/surveyRdb/repository/dataView'

export const validateRecordKeysUniqueness = async (survey, record, tx) => {
  // 1. check if record is unique
  const recordsCount = await DataViewRepository.countDuplicateRecords(survey, record, tx)
  const isUnique = recordsCount === 0

  // 3. fetch key nodes
  const rootNode = Record.getRootNode(record)
  const keyNodes = Record.getEntityKeyNodes(survey, rootNode)(record)

  // 4. associate validation error to each key node
  const validationNodesKey = {}
  keyNodes.forEach((keyNode) => {
    validationNodesKey[Node.getUuid(keyNode)] = RecordValidation.newValidationRecordDuplicate(isUnique)
  })

  return validationNodesKey
}

// Returns an indexed object with recordUuid as key and validation as value
export const validateRecordsUniqueness = async (
  { survey, cycle, nodesUnique, recordUuidExcluded, excludeRecordFromCount },
  tx
) => {
  const recordsCountRows = await DataViewRepository.fetchRecordsCountByRootNodesValue(
    survey,
    cycle,
    nodesUnique,
    recordUuidExcluded,
    excludeRecordFromCount,
    tx
  )

  if (R.isEmpty(recordsCountRows)) return {}

  return recordsCountRows.reduce((result, { recordUuid, count, nodesKeyUuids }) => {
    const isUnique = count === '1'
    const validationNodesKeyFields = nodesKeyUuids.reduce(
      (validationFieldsAcc, nodeKeyUuid) => ({
        ...validationFieldsAcc,
        [nodeKeyUuid]: RecordValidation.newValidationRecordDuplicate(isUnique),
      }),
      {}
    )
    return {
      ...result,
      [recordUuid]: Validation.newInstance(isUnique, validationNodesKeyFields),
    }
  }, {})
}
