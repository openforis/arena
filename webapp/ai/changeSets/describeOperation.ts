/**
 * English descriptions of operations and results, for the note sent back to the model after Apply.
 */
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import type { ChangeOperation, ChangeSet, OperationResult } from './types'

const findName = (uuid: string, changeSet: ChangeSet, survey: any): string => {
  const existing = Survey.getNodeDefByUuid(uuid)(survey)
  if (existing) return NodeDef.getName(existing)
  const create = changeSet.operations.find(
    (op) => op.type === 'nodeDef.create' && NodeDef.getUuid(op.nodeDef) === uuid
  ) as { nodeDef: any } | undefined
  return create ? NodeDef.getName(create.nodeDef) : uuid
}

/**
 * Describes what an operation changes, e.g. "`tree_height` label (fr)" or "new text `notes`".
 * @param {ChangeOperation} op - Operation.
 * @param {object} context - Context.
 * @param {ChangeSet} context.changeSet - Its change set.
 * @param {object} context.survey - Survey.
 * @returns {string} The description.
 */
export const describeOperation = (
  op: ChangeOperation,
  { changeSet, survey }: { changeSet: ChangeSet; survey: any }
) => {
  if (op.type === 'nodeDef.create') return `new ${NodeDef.getType(op.nodeDef)} \`${NodeDef.getName(op.nodeDef)}\``
  const name = `\`${findName(op.nodeDefUuid, changeSet, survey)}\``
  if (op.type === 'label.set') return `${name} ${op.kind === 'labels' ? 'label' : 'description'} (${op.lang})`
  return `${name} ${op.prop}`
}

/**
 * Summarizes the results of an Apply for the model.
 * @param {object} params - Parameters.
 * @param {ChangeSet} params.changeSet - Change set.
 * @param {OperationResult[]} params.results - Results.
 * @param {object} params.survey - Survey after the Apply.
 * @returns {string} E.g. "Applied 3 of 4 operations; `tree_height` label (fr): conflict (valueChanged)."
 */
export const summarizeResults = ({
  changeSet,
  results,
  survey,
}: {
  changeSet: ChangeSet
  results: OperationResult[]
  survey: any
}): string => {
  const applied = results.filter((result) => result.status === 'applied').length
  const others = results
    .filter((result) => result.status !== 'applied')
    .map((result) => {
      const op = changeSet.operations.find((operation) => operation.id === result.id)
      const what = op ? describeOperation(op, { changeSet, survey }) : result.id
      return `${what}: ${result.status}${result.message ? ` (${result.message})` : ''}`
    })
  return `Applied ${applied} of ${results.length} operations${others.length > 0 ? `; ${others.join('; ')}` : ''}.`
}
