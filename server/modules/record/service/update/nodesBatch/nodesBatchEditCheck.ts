import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import { areNodeValuesEqual } from '@core/record/nodeValueEquality'
import { isNodeDefValueEditable } from '@core/record/nodeValueParser'

import {
  NodesBatchEditResult,
  NodesBatchMessageKeys,
  NodesBatchRecordEdit,
  conflictResult,
  failedResult,
} from './nodesBatchTypes'

const uniquenessErrorKeys = new Set<string>([
  Validation.messageKeys.record.keyDuplicate,
  Validation.messageKeys.record.uniqueAttributeDuplicate,
])

export type BatchEditCheck = { ok: true; node: any; nodeDef: any } | { ok: false; result: NodesBatchEditResult }

/**
 * Returns true when the attribute can be edited by a batch edit (editable, and not a file).
 * @param {object} nodeDef - The node definition.
 * @returns {boolean} Whether batch edits are allowed.
 */
export const isNodeDefBatchEditable = (nodeDef: any): boolean =>
  isNodeDefValueEditable(nodeDef) && !NodeDef.isFile(nodeDef)

/**
 * Checks an edit against the record reloaded inside the record lock.
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {object} params.record - The record.
 * @param {string} params.recordUuid - The uuid of the record being edited (authorised by the service).
 * @param {NodesBatchRecordEdit} params.edit - The edit.
 * @returns {BatchEditCheck} The node and its definition, or the result of a refused edit.
 */
export const checkBatchEdit = ({
  survey,
  record,
  recordUuid,
  edit,
}: {
  survey: any
  record: any
  recordUuid: string
  edit: NodesBatchRecordEdit
}): BatchEditCheck => {
  const { index, nodeUuid, from } = edit
  const node = Record.getNodeByUuid(nodeUuid)(record)
  // deleted since the proposal: the data changed
  if (!node) return { ok: false, result: conflictResult(index) }
  if (Node.getRecordUuid(node) !== recordUuid) {
    return { ok: false, result: failedResult(index, NodesBatchMessageKeys.nodeNotInRecord) }
  }
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  if (!isNodeDefBatchEditable(nodeDef)) {
    return {
      ok: false,
      result: failedResult(index, 'validationErrors:nodeValueParser.attributeNotEditable', {
        attributeName: NodeDef.getName(nodeDef),
      }),
    }
  }
  if (!areNodeValuesEqual(Node.getValue(node, null), from)) {
    return { ok: false, result: conflictResult(index) }
  }
  return { ok: true, node, nodeDef }
}

/**
 * Collects the error keys of a validation and of its nested field validations.
 * @param {object} validation - The validation.
 * @returns {string[]} The error keys.
 */
const collectErrorKeys = (validation: any): string[] => {
  if (!validation) return []
  const ownKeys = Validation.getErrors(validation).map((error: any) => ValidationResult.getKey(error))
  const nestedKeys = Object.values(Validation.getFieldValidations(validation) ?? {}).flatMap(collectErrorKeys)
  return [...ownKeys, ...nestedKeys]
}

/**
 * Finds a record key or unique attribute duplicate error on the validation of a node.
 * @param {object} params - The parameters.
 * @param {object|null} params.validation - Validations by node uuid (as passed to nodesValidationListener).
 * @param {string} params.nodeUuid - The edited node.
 * @returns {string|null} The validation message key, or null.
 */
export const findUniquenessErrorKey = ({
  validation,
  nodeUuid,
}: {
  validation: any
  nodeUuid: string
}): string | null => {
  if (!validation) return null
  const nodeValidation = Validation.getFieldValidations(validation)?.[nodeUuid]
  return collectErrorKeys(nodeValidation).find((key) => uniquenessErrorKeys.has(key)) ?? null
}
