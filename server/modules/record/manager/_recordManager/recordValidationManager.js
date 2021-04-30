import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as Record from '@core/record/record'
import * as RecordValidator from '@core/record/recordValidator'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'

import * as RecordRepository from '../../repository/recordRepository'

import * as RecordUniquenessValidator from './recordUniquenessValidator'

export const validateNodesAndPersistValidation = async (survey, record, nodes, validateRecordKeysUniqueness, tx) => {
  // 1. validate nodes
  const nodesValidation = await RecordValidator.validateNodes(survey, record, nodes)

  // 2. validate record keys uniqueness
  const recordKeysValidation =
    validateRecordKeysUniqueness && !Record.isPreview(record) && isRootNodeKeysUpdated(survey, nodes)
      ? await RecordUniquenessValidator.validateRecordKeysUniqueness(survey, record, tx)
      : {}

  // 3. merge validations
  const validation = Validation.recalculateValidity(
    Validation.newInstance(true, R.mergeDeepLeft(recordKeysValidation, Validation.getFieldValidations(nodesValidation)))
  )

  // 4. persist validation
  await persistValidation(survey, record, validation, tx)

  return validation
}

const isRootNodeKeysUpdated = (survey, nodes) =>
  R.pipe(
    R.values,
    R.any((n) => {
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(n))(survey)
      const parentDef = Survey.getNodeDefParent(nodeDef)(survey)
      return NodeDef.isKey(nodeDef) && NodeDef.isRoot(parentDef)
    })
  )(nodes)

export const persistValidation = async (survey, record, nodesValidation, tx) => {
  const surveyId = Survey.getId(survey)

  const recordValidationUpdated = R.pipe(
    Record.getValidation,
    Validation.mergeValidation(nodesValidation),
    Validation.updateCounts
  )(record)

  await RecordRepository.updateValidation(surveyId, Record.getUuid(record), recordValidationUpdated, tx)
}

const _validateRecordUniquenessAndPersistValidation = async (
  { survey, record, nodesUnique, excludeRecordFromCount },
  t
) => {
  const validationByRecord = await RecordUniquenessValidator.validateRecordsUniqueness(
    {
      survey,
      cycle: Record.getCycle(record),
      nodesUnique,
      recordUuidExcluded: Record.getUuid(record),
      excludeRecordFromCount,
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

export const validateRecordKeysUniquenessAndPersistValidation = async (survey, record, excludeRecordFromCount, t) => {
  const nodesUnique = Record.getEntityKeyNodes(survey, Record.getRootNode(record))(record)
  return _validateRecordUniquenessAndPersistValidation({ survey, record, nodesUnique, excludeRecordFromCount }, t)
}

export const validateRecordUniqeNodesUniquenessAndPersistValidation = async (
  { survey, record, nodeDefUniqueUuid, excludeRecordFromCount },
  t
) => {
  const rootNode = Record.getRootNode(record)
  const nodesUnique = Record.getNodeChildrenByDefUuid(rootNode, nodeDefUniqueUuid)(record)
  return _validateRecordUniquenessAndPersistValidation({ survey, record, nodesUnique, excludeRecordFromCount }, t)
}

export const { updateRecordValidationsFromValues } = RecordRepository

export const { validateRecordKeysUniqueness } = RecordUniquenessValidator
