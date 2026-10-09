import * as A from '@core/arena'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'
import * as Record from '@core/record/record'
import * as RecordValidation from '@core/record/recordValidation'
import * as Validation from '@core/validation/validation'

import type { RecordEditBadge } from '@webapp/ai/changeSets/recordEdits/types'

import { getNodeValidationMessages } from './recordNodeDescriber'
import type { CleaningI18n } from './validationRows'

export type PreviewEdit = { node: any; value: any; refData: Record<string, unknown> | null }

/**
 * Returns true when a validation has errors (warnings don't count).
 * @param {object|null} validation - The validation.
 * @returns {boolean} Whether it has errors.
 */
const hasErrors = (validation: any): boolean => Boolean(validation) && Validation.isError(validation)

/**
 * Returns the badge of an edit from the attribute's validation before and after.
 * @param {object} params - Parameters.
 * @param {object} params.before - Validation before the edit.
 * @param {object} params.after - Validation after the edit.
 * @returns {RecordEditBadge} The badge.
 */
const toBadge = ({ before, after }: { before: any; after: any }): RecordEditBadge => {
  if (hasErrors(after)) return 'stillInvalid'
  return hasErrors(before) ? 'fixes' : 'noErrors'
}

/**
 * Counts the validation fields of the record that have errors after the edits and had none before,
 * excluding the edited nodes.
 * @param {object} params - Parameters.
 * @param {object} params.validationBefore - Record validation before.
 * @param {object} params.validationAfter - Record validation after.
 * @param {Set<string>} params.editedUuids - Uuids of the edited nodes.
 * @returns {number} The number of new errors.
 */
const countNewErrors = ({
  validationBefore,
  validationAfter,
  editedUuids,
}: {
  validationBefore: any
  validationAfter: any
  editedUuids: Set<string>
}): number => {
  let count = 0
  for (const [field, fieldValidation] of Object.entries(Validation.getFieldValidations(validationAfter))) {
    if (editedUuids.has(field) || !hasErrors(fieldValidation)) continue
    if (!hasErrors(Validation.getFieldValidation(field)(validationBefore))) count += 1
  }
  return count
}

/**
 * Applies edits to a copy of a record, updates its dependents and validation, and tells per edit whether it fixes
 * the attribute's errors. Cross-record uniqueness is not previewed (the server checks it at Apply).
 * @param {object} params - Parameters.
 * @param {object} params.user - The user.
 * @param {object} params.survey - The survey.
 * @param {object} params.record - The record (not modified).
 * @param {PreviewEdit[]} params.edits - Nodes with their new value and ref data.
 * @param {object} params.categoryItemProvider - Category item provider.
 * @param {object} params.taxonProvider - Taxon provider.
 * @param {number} params.timezoneOffset - Browser timezone offset (expressions with dates).
 * @param {string} params.lang - Survey language.
 * @param {CleaningI18n} params.i18n - Translator.
 * @returns {Promise<object>} { recordAfter, previewByNodeUuid, recordNewErrors }.
 */
export const computeRecordEditPreview = async ({
  user,
  survey,
  record,
  edits,
  categoryItemProvider,
  taxonProvider,
  timezoneOffset,
  lang,
  i18n,
}: {
  user: any
  survey: any
  record: any
  edits: PreviewEdit[]
  categoryItemProvider: any
  taxonProvider: any
  timezoneOffset: number
  lang: string
  i18n: CleaningI18n
}) => {
  let recordUpdated = record
  const nodesUpdated: Record<string, any> = {}
  for (const { node, value, refData } of edits) {
    const nodeUpdated = A.pipe(Node.assocValue(value), NodeRefData.assocRefData(refData), Node.assocUpdated(true))(node)
    recordUpdated = Record.assocNode(nodeUpdated)(recordUpdated)
    nodesUpdated[Node.getUuid(node)] = nodeUpdated
  }
  const { record: recordAfter } = await Record.afterNodesUpdate({
    user,
    survey,
    record: recordUpdated,
    nodes: nodesUpdated,
    categoryItemProvider,
    taxonProvider,
    timezoneOffset,
    lang,
  })

  const validationBefore = Validation.getValidation(record)
  const validationAfter = Validation.getValidation(recordAfter)
  const previewByNodeUuid: Record<string, { badge: RecordEditBadge; messages: string[] }> = {}
  for (const { node } of edits) {
    const before = RecordValidation.getNodeValidation(node)(validationBefore)
    const after = RecordValidation.getNodeValidation(node)(validationAfter)
    const badge = toBadge({ before, after })
    const messages =
      badge === 'stillInvalid' ? getNodeValidationMessages({ survey, record: recordAfter, node, i18n }) : []
    previewByNodeUuid[Node.getUuid(node)] = { badge, messages }
  }
  const recordNewErrors = countNewErrors({
    validationBefore,
    validationAfter,
    editedUuids: new Set(Object.keys(nodesUpdated)),
  })
  return { recordAfter, previewByNodeUuid, recordNewErrors }
}
