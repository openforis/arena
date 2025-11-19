import * as R from 'ramda'

import { RecordValidator } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'

import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'

import { CategoryItemProviderDefault } from '@server/modules/category/manager/categoryItemProviderDefault'
import { TaxonProviderDefault } from '@server/modules/taxonomy/manager/taxonProviderDefault'

import * as RecordRepository from '../../repository/recordRepository'

import * as RecordUniquenessValidator from './recordUniquenessValidator'

const categoryItemProvider = CategoryItemProviderDefault
const taxonProvider = TaxonProviderDefault

export const persistValidation = async ({ survey, record }, tx) =>
  RecordRepository.updateValidation(Survey.getId(survey), Record.getUuid(record), Record.getValidation(record), tx)

const replaceAndPersistValidation = async ({ survey, record, nodesValidation }, tx) => {
  const validation = R.pipe(
    Validation.mergeValidation(nodesValidation, true),
    Validation.updateCounts
  )(Validation.newInstance())
  const recordValidated = Validation.assocValidation(validation)(record)
  await persistValidation({ survey, record: recordValidated }, tx)
}

export const mergeAndPersistValidation = async ({ survey, record, nodesValidation }, tx) => {
  const recordValidationUpdated = R.pipe(
    Record.getValidation,
    Validation.mergeValidation(nodesValidation, true),
    Validation.updateCounts
  )(record)

  const recordUpdated = Validation.assocValidation(recordValidationUpdated)(record)

  await persistValidation({ survey, record: recordUpdated }, tx)
}

const isRootUniqueNodesUpdated = ({ survey, nodesArray }) =>
  nodesArray.some((node) => {
    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
    const parentDef = Survey.getNodeDefParent(nodeDef)(survey)
    return (
      NodeDef.isRoot(parentDef) &&
      (NodeDef.isKey(nodeDef) || NodeDefValidations.isUnique(NodeDef.getValidations(nodeDef)))
    )
  })

export const validateSortedNodesAndPersistValidation = async (
  { user, survey, record, nodesArray, validateRecordUniqueness = false, mergeValidation = true },
  tx
) => {
  // 1. validate node values
  const nodesValueValidation = await RecordValidator.validateSortedNodes({
    user,
    survey,
    categoryItemProvider,
    taxonProvider,
    record,
    nodesArray,
  })
  const nodesValueValidationsByUuid = Validation.getFieldValidations(nodesValueValidation)
  // 1.a. workaround: always define value field validation even when validation is valid to allow cleaning up errors later
  for (const [nodeUuid, nodeValueValidation] of Object.entries(nodesValueValidationsByUuid)) {
    if (Validation.isValid(nodeValueValidation)) {
      const nodeValueValidationUpdated = Validation.setField('value', Validation.newInstance())(nodeValueValidation)
      nodesValueValidationsByUuid[nodeUuid] = nodeValueValidationUpdated
    }
  }

  // 2. validate record unique nodes
  const uniqueNodesValidationByNodeUuid =
    validateRecordUniqueness && !Record.isPreview(record) && isRootUniqueNodesUpdated({ survey, nodesArray })
      ? await RecordUniquenessValidator.validateRecordUniqueNodes({ survey, record }, tx)
      : {}

  // 3. get previous validation of unique nodes
  const uniqueNodesUuids = Object.keys(uniqueNodesValidationByNodeUuid)
  const oldUniqueNodesValidationByNodeUuid = Validation.getFieldValidationsByFields(uniqueNodesUuids)(
    Record.getValidation(record)
  )

  // 4. merge unique nodes previous validation with new one
  const uniqueNodesValidationMergedByUuid = Validation.mergeFieldValidations(
    uniqueNodesValidationByNodeUuid,
    oldUniqueNodesValidationByNodeUuid
  )

  // 5. merge unique nodes validation with nodes values validation
  const uniqueNodesValidationWithValueValidationByUuid = Validation.mergeFieldValidations(
    nodesValueValidationsByUuid,
    uniqueNodesValidationMergedByUuid
  )

  // 6. generate full validation object
  const fullNodesValidationByUuid = {
    ...nodesValueValidationsByUuid,
    ...uniqueNodesValidationWithValueValidationByUuid,
  }
  const nodesValidation = Validation.recalculateValidity(Validation.newInstance(true, fullNodesValidationByUuid))

  // 7. persist validation
  if (mergeValidation) {
    await mergeAndPersistValidation({ survey, record, nodesValidation }, tx)
  } else {
    await replaceAndPersistValidation({ record, survey, nodesValidation }, tx)
  }
  return nodesValidation
}

export const validateNodesAndPersistValidation = async (
  { user, survey, record, nodes, validateRecordUniqueness = false },
  tx
) =>
  validateSortedNodesAndPersistValidation(
    {
      user,
      survey,
      record,
      nodesArray: Object.values(nodes),
      validateRecordUniqueness,
    },
    tx
  )

export const validateRecordsUniquenessAndPersistValidation = async (
  { survey, cycle, nodeDefsUnique, nodesUnique, recordUuidsExcluded, excludeRecordsFromCount, errorKey },
  t
) => {
  const validationByRecord = await RecordUniquenessValidator.validateRecordsUniqueness(
    {
      survey,
      cycle,
      nodeDefsUnique,
      nodesUnique,
      recordUuidsExcluded,
      excludeRecordsFromCount,
      errorKey,
    },
    t
  )
  for (const [recordUuid, nodesValidation] of Object.entries(validationByRecord)) {
    const record = await RecordRepository.fetchRecordByUuid(Survey.getId(survey), recordUuid, t)
    await mergeAndPersistValidation({ survey, record, nodesValidation }, t)
  }
}

export const validateRecordKeysUniquenessAndPersistValidation = async (
  { survey, record, excludeRecordFromCount },
  t
) => {
  const nodesUnique = Record.getEntityKeyNodes(survey, Record.getRootNode(record))(record)
  if (nodesUnique.length === 0) {
    return null // empty record, consider its uniqueness as valid
  }
  const nodeDefsUnique = Survey.getNodeDefRootKeys(survey)

  return validateRecordsUniquenessAndPersistValidation(
    {
      survey,
      cycle: Record.getCycle(record),
      nodeDefsUnique,
      nodesUnique,
      recordUuidsExcluded: [Record.getUuid(record)],
      excludeRecordsFromCount: excludeRecordFromCount,
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
  const nodeDefUnique = Survey.getNodeDefByUuid(nodeDefUniqueUuid)(survey)

  return validateRecordsUniquenessAndPersistValidation(
    {
      survey,
      cycle: Record.getCycle(record),
      nodeDefsUnique: [nodeDefUnique],
      nodesUnique,
      recordUuidsExcluded: [Record.getUuid(record)],
      excludeRecordsFromCount: excludeRecordFromCount,
      errorKey: Validation.messageKeys.record.uniqueAttributeDuplicate,
    },
    t
  )
}

export const { updateRecordValidationsFromValues } = RecordRepository
