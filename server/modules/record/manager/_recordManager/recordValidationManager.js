import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'

import * as Record from '@core/record/record'
import * as RecordValidator from '@core/record/recordValidator'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'

import * as RecordRepository from '../../repository/recordRepository'

import * as RecordUniquenessValidator from './recordUniquenessValidator'

export const persistValidation = async (survey, record, nodesValidation, tx) => {
  const surveyId = Survey.getId(survey)

  const recordValidationUpdated = R.pipe(
    Record.getValidation,
    Validation.mergeValidation(nodesValidation),
    Validation.updateCounts
  )(record)

  await RecordRepository.updateValidation(surveyId, Record.getUuid(record), recordValidationUpdated, tx)
}

const isRootUniqueNodesUpdated = ({ survey, nodes }) =>
  R.pipe(
    R.values,
    R.any((node) => {
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
      const parentDef = Survey.getNodeDefParent(nodeDef)(survey)
      return (
        NodeDef.isRoot(parentDef) &&
        (NodeDef.isKey(nodeDef) || NodeDefValidations.isUnique(NodeDef.getValidations(nodeDef)))
      )
    })
  )(nodes)

export const validateNodesAndPersistValidation = async (survey, record, nodes, validateRecordUniqueness, tx) => {
  // 1. validate nodes
  const nodesValidation = await RecordValidator.validateNodes({ survey, record, nodes })

  // 2. validate record uniqueness
  const recordUniqueNodesValidation =
    validateRecordUniqueness && !Record.isPreview(record) && isRootUniqueNodesUpdated({ survey, nodes })
      ? await RecordUniquenessValidator.validateRecordUniqueNodes({ survey, record }, tx)
      : {}

  // 3. merge validations
  const validationFields = R.mergeDeepLeft(recordUniqueNodesValidation, Validation.getFieldValidations(nodesValidation))
  const validation = Validation.recalculateValidity(Validation.newInstance(true, validationFields))

  // 4. persist validation
  await persistValidation(survey, record, validation, tx)

  return validation
}

export const validateRecordsUniquenessAndPersistValidation = async (
  { survey, cycle, nodesUnique, recordUuidsExcluded, excludeRecordsFromCount, errorKey },
  t
) => {
  const validationByRecord = await RecordUniquenessValidator.validateRecordsUniqueness(
    {
      survey,
      cycle,
      nodesUnique,
      recordUuidsExcluded,
      excludeRecordsFromCount,
      errorKey,
    },
    t
  )

  await Promise.all(
    Object.entries(validationByRecord).map(async ([recordUuid, nodesValidation]) => {
      const recordToUpdate = await RecordRepository.fetchRecordByUuid(Survey.getId(survey), recordUuid, t)
      await persistValidation(survey, recordToUpdate, nodesValidation, t)
    })
  )
}

export const validateRecordKeysUniquenessAndPersistValidation = async (
  { survey, record, excludeRecordsFromCount },
  t
) => {
  const nodesUnique = Record.getEntityKeyNodes(survey, Record.getRootNode(record))(record)
  if (nodesUnique.length === 0) {
    return null // empty record, consider its uniqueness as valid
  }
  return validateRecordsUniquenessAndPersistValidation(
    {
      survey,
      cycle: Record.getCycle(record),
      nodesUnique,
      recordUuidsExcluded: [Record.getUuid(record)],
      excludeRecordsFromCount,
      errorKey: Validation.messageKeys.record.keyDuplicate,
    },
    t
  )
}

export const validateRecordUniqueNodesUniquenessAndPersistValidation = async (
  { survey, record, nodeDefUniqueUuid, excludeRecordFromCount },
  t
) => {
  const rootNode = Record.getRootNode(record)
  const nodesUnique = Record.getNodeChildrenByDefUuid(rootNode, nodeDefUniqueUuid)(record)
  if (nodesUnique.length === 0) {
    return null // empty record, consider its uniqueness as valid
  }
  return validateRecordsUniquenessAndPersistValidation(
    {
      survey,
      cycle: Record.getCycle(record),
      nodesUnique,
      recordUuidsExcluded: [Record.getUuid(record)],
      excludeRecordsFromCount: excludeRecordFromCount,
      errorKey: Validation.messageKeys.record.uniqueAttributeDuplicate,
    },
    t
  )
}

export const { updateRecordValidationsFromValues } = RecordRepository
