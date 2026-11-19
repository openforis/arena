import type { DbClient } from '@server/db/db'
import * as A from '@core/arena'

import {
  RecordValidator,
  type ArenaRecordNode,
  type ArenaUser,
  type ArenaRecord,
  type ArenaSurvey,
  type ArenaNodeDef,
  type NodeDefType,
} from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'

import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'

import { createRecordEvaluationContext } from '@server/modules/record/manager/recordEvaluationContextDefault'

import * as RecordRepository from '../../repository/recordRepository'

import * as RecordUniquenessValidator from './recordUniquenessValidator'

type NodesByUuid = { [nodeUuid: string]: ArenaRecordNode }

export const persistValidation = ({ survey, record }: { survey: ArenaSurvey; record: ArenaRecord }, tx: DbClient) =>
  RecordRepository.updateValidation(Survey.getId(survey), Record.getUuid(record), Record.getValidation(record), tx)

const _processAndPersistValidation = async (
  {
    survey,
    record,
    nodesValidation,
    startValidation,
  }: { survey: ArenaSurvey; record: ArenaRecord; nodesValidation: any; startValidation: any },
  tx: DbClient
) => {
  const validationUpdated = A.pipe(
    Validation.mergeValidation(nodesValidation, true),
    Validation.updateCounts
  )(startValidation)
  const recordUpdated = Validation.assocValidation(validationUpdated)(record)
  await persistValidation({ survey, record: recordUpdated }, tx)
  return recordUpdated
}

export const replaceAndPersistValidation = (
  { survey, record, nodesValidation }: { survey: ArenaSurvey; record: ArenaRecord; nodesValidation: any },
  tx: DbClient
) => {
  const startValidation = Validation.newInstance()
  return _processAndPersistValidation({ survey, record, nodesValidation, startValidation }, tx)
}

export const mergeAndPersistValidation = (
  { survey, record, nodesValidation }: { survey: ArenaSurvey; record: ArenaRecord; nodesValidation: any },
  tx: DbClient
) => {
  const startValidation = Record.getValidation(record)
  return _processAndPersistValidation({ survey, record, nodesValidation, startValidation }, tx)
}

const isRootUniqueNodesUpdated = ({ survey, nodesArray }: { survey: ArenaSurvey; nodesArray: ArenaRecordNode[] }) =>
  nodesArray.some((node) => {
    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
    const parentDef = Survey.getNodeDefParent(nodeDef)(survey)
    return (
      NodeDef.isRoot(parentDef) &&
      (NodeDef.isKey(nodeDef) || NodeDefValidations.isUnique(NodeDef.getValidations(nodeDef)))
    )
  })

export const validateSortedNodesAndPersistValidation = async (
  {
    user,
    survey,
    record,
    nodesArray,
    validateRecordUniqueness = false,
    mergeValidation = true,
  }: {
    user: ArenaUser
    survey: ArenaSurvey
    record: ArenaRecord
    nodesArray: ArenaRecordNode[]
    validateRecordUniqueness?: boolean
    mergeValidation?: any
  },
  tx: DbClient
) => {
  // 1. validate node values
  const nodesValueValidation = await RecordValidator.validateSortedNodes({
    ...createRecordEvaluationContext({ user, survey }),
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
  const recordUpdated = mergeValidation
    ? await mergeAndPersistValidation({ survey, record, nodesValidation }, tx)
    : await replaceAndPersistValidation({ record, survey, nodesValidation }, tx)

  return { record: recordUpdated, nodesValidation }
}

export const validateNodesAndPersistValidation = (
  {
    user,
    survey,
    record,
    nodes,
    validateRecordUniqueness = false,
  }: {
    user: ArenaUser
    survey: ArenaSurvey
    record: ArenaRecord
    nodes: NodesByUuid
    validateRecordUniqueness?: boolean
  },
  tx: DbClient
) =>
  validateSortedNodesAndPersistValidation(
    { user, survey, record, nodesArray: Object.values(nodes), validateRecordUniqueness },
    tx
  )

export const validateRecordsUniquenessAndPersistValidation = async (
  {
    survey,
    cycle,
    nodeDefsUnique,
    nodesUnique,
    recordUuidsExcluded,
    errorKey,
  }: {
    survey: ArenaSurvey
    cycle: string
    nodeDefsUnique: ArenaNodeDef<NodeDefType>[]
    nodesUnique: ArenaRecordNode[]
    recordUuidsExcluded: any
    errorKey: any
  },
  t: DbClient
) => {
  const validationByRecord = await RecordUniquenessValidator.validateRecordsUniqueness(
    { survey, cycle, nodeDefsUnique, nodesUnique, recordUuidsExcluded, errorKey },
    t
  )
  for (const [recordUuid, nodesValidation] of Object.entries(validationByRecord)) {
    const record = await RecordRepository.fetchRecordByUuid(Survey.getId(survey), recordUuid, t) // NOSONAR
    await mergeAndPersistValidation({ survey, record, nodesValidation }, t) // NOSONAR
  }
  return validationByRecord
}

export const validateRecordKeysUniquenessAndPersistValidation = (
  {
    survey,
    record,
    excludeRecordFromCount = false,
  }: { survey: ArenaSurvey; record: ArenaRecord; excludeRecordFromCount?: boolean },
  t: DbClient
) => {
  const nodesUnique = Record.getEntityKeyNodes(survey, Record.getRootNode(record))(record)
  if (nodesUnique.length === 0) {
    return Promise.resolve({}) // empty record, consider its uniqueness as valid
  }
  const nodeDefsUnique = Survey.getNodeDefRootKeys(survey)

  return validateRecordsUniquenessAndPersistValidation(
    {
      survey,
      cycle: Record.getCycle(record),
      nodeDefsUnique,
      nodesUnique,
      recordUuidsExcluded: excludeRecordFromCount ? [Record.getUuid(record)] : [],
      errorKey: Validation.messageKeys.record.keyDuplicate,
    },
    t
  )
}

export const validateRecordUniqueNodesUniquenessAndPersistValidation = (
  {
    survey,
    record,
    nodeDefUniqueUuid,
    excludeRecordFromCount = false,
  }: { survey: ArenaSurvey; record: ArenaRecord; nodeDefUniqueUuid: string; excludeRecordFromCount?: boolean },
  t: DbClient
) => {
  const rootNode = Record.getRootNode(record)
  const nodesUnique = Record.getNodeChildrenByDefUuid(rootNode, nodeDefUniqueUuid)(record)
  if (nodesUnique.length === 0) {
    return Promise.resolve({}) // empty record, consider its uniqueness as valid
  }
  const nodeDefUnique = Survey.getNodeDefByUuid(nodeDefUniqueUuid)(survey)

  return validateRecordsUniquenessAndPersistValidation(
    {
      survey,
      cycle: Record.getCycle(record),
      nodeDefsUnique: [nodeDefUnique],
      nodesUnique,
      recordUuidsExcluded: excludeRecordFromCount ? [Record.getUuid(record)] : [],
      errorKey: Validation.messageKeys.record.uniqueAttributeDuplicate,
    },
    t
  )
}

export const { updateRecordValidationsFromValues } = RecordRepository
