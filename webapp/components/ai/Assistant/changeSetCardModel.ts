/**
 * What a change set card shows: one row per operation (name, what changes, before → after, result), whether the
 * survey changed since the proposal, and where a name links to in the form designer.
 */
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { isRecordEditOperation, type RecordAttributeUpdateOperation } from '@webapp/ai/changeSets/recordEdits/types'
import { findConflicts } from '@webapp/ai/changeSets/findConflicts'
import type {
  ChangeOperation,
  ChangeSet,
  ChangeSetCardState,
  NodeDefExpressionProp,
  OperationResult,
} from '@webapp/ai/changeSets/types'
import { TreeSelectViewMode } from '@webapp/model'

export type CardExpressionItem = { expression: string; applyIf: string | null }

export type CardValue =
  | { kind: 'text'; text: string | null }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'expressions'; items: CardExpressionItem[] }

export type CardRow = {
  id: string
  nodeDefUuid: string
  nodeDefName: string
  // i18n key (common namespace) of what changes
  titleKey: string
  titleParams: Record<string, string>
  // null for a new node definition
  from: CardValue | null
  to: CardValue
  result: OperationResult | null
}

export type NodeDefNavigation =
  { type: 'select'; nodeDefUuid: string } | { type: 'page'; pageNodeDefUuid: string; nodeDefUuid: string }

const expressionPropTitleKeys: Record<NodeDefExpressionProp, string> = {
  defaultValues: 'defaultValues',
  applicable: 'applicable',
  'validations.expressions': 'validations',
  visibleIf: 'visibleIf',
  editableIf: 'editableIf',
}

/**
 * Returns the name of a node definition, existing or created by the change set.
 * @param {string} uuid - Node definition uuid.
 * @param {ChangeSet} changeSet - Change set.
 * @param {object} survey - Survey.
 * @returns {string} The name (the uuid when unknown).
 */
const findNodeDefName = (uuid: string, changeSet: ChangeSet, survey: any): string => {
  const existing = Survey.getNodeDefByUuid(uuid)(survey)
  if (existing) return NodeDef.getName(existing)
  const create = changeSet.operations.find(
    (op) => op.type === 'nodeDef.create' && NodeDef.getUuid(op.nodeDef) === uuid
  ) as { nodeDef: any } | undefined
  return create ? NodeDef.getName(create.nodeDef) : uuid
}

/**
 * Converts a basic value to a card value.
 * @param {string|boolean|null} value - Value.
 * @returns {CardValue} The card value.
 */
const toBasicValue = (value: string | boolean | null): CardValue =>
  typeof value === 'boolean' ? { kind: 'boolean', value } : { kind: 'text', text: value }

/**
 * Converts expressions to a card value.
 * @param {object[]} expressions - Node definition expressions.
 * @returns {CardValue} The card value.
 */
const toExpressionsValue = (expressions: any[]): CardValue => ({
  kind: 'expressions',
  items: expressions.map((expression) => ({
    expression: NodeDefExpression.getExpression(expression),
    applyIf: NodeDefExpression.getApplyIf(expression) || null,
  })),
})

/**
 * Returns the row fields of a create operation.
 * @param {ChangeOperation} op - Create operation.
 * @param {string} lang - Language of the label shown.
 * @returns {object} The row fields.
 */
const toCreateRow = (op: Extract<ChangeOperation, { type: 'nodeDef.create' }>, lang: string) => {
  const labels: Record<string, string> = NodeDef.getLabels(op.nodeDef)
  return {
    nodeDefUuid: NodeDef.getUuid(op.nodeDef),
    nodeDefName: NodeDef.getName(op.nodeDef),
    titleKey: 'aiAssistant.card.newItem',
    titleParams: { type: NodeDef.getType(op.nodeDef) },
    from: null,
    to: { kind: 'text', text: labels[lang] ?? Object.values(labels)[0] ?? null } as CardValue,
  }
}

/**
 * Returns the row fields of a change operation.
 * @param {ChangeOperation} op - Operation other than create.
 * @returns {object} The row fields.
 */
const toChangeRow = (op: Exclude<ChangeOperation, { type: 'nodeDef.create' } | RecordAttributeUpdateOperation>) => {
  if (op.type === 'label.set') {
    return {
      titleKey: op.kind === 'labels' ? 'aiAssistant.card.label' : 'aiAssistant.card.description',
      titleParams: { lang: op.lang },
      from: toBasicValue(op.from),
      to: toBasicValue(op.to),
    }
  }
  if (op.type === 'nodeDef.update') {
    return {
      titleKey: `aiAssistant.card.props.${op.prop}`,
      titleParams: {},
      from: toBasicValue(op.from),
      to: toBasicValue(op.to),
    }
  }
  return {
    titleKey: `aiAssistant.card.expressionProps.${expressionPropTitleKeys[op.prop]}`,
    titleParams: {},
    from: toExpressionsValue(op.from),
    to: toExpressionsValue(op.to),
  }
}

/**
 * Returns the rows of a card.
 * @param {object} params - Parameters.
 * @param {ChangeSetCardState} params.cardState - Card state.
 * @param {object} params.survey - Current survey (names of existing node definitions).
 * @param {string} params.lang - Survey preferred language (label of a new node definition).
 * @returns {CardRow[]} One row per operation, in order.
 */
export const buildCardRows = ({
  cardState,
  survey,
  lang,
}: {
  cardState: ChangeSetCardState
  survey: any
  lang: string
}): CardRow[] => {
  const { changeSet, results = [] } = cardState
  // record edits have their own card
  return changeSet.operations
    .filter((op) => !isRecordEditOperation(op))
    .map((op) => {
      const result = results.find((item) => item.id === op.id) ?? null
      if (op.type === 'nodeDef.create') return { id: op.id, result, ...toCreateRow(op, lang) }
      return {
        id: op.id,
        result,
        nodeDefUuid: op.nodeDefUuid,
        nodeDefName: findNodeDefName(op.nodeDefUuid, changeSet, survey),
        ...toChangeRow(op),
      }
    })
}

/**
 * Returns the operations that can still be applied (not applied yet, card not discarded).
 * @param {ChangeSetCardState} cardState - Card state.
 * @returns {string[]} Operation ids.
 */
export const getPendingOperationIds = (cardState: ChangeSetCardState): string[] => {
  if (cardState.discarded) return []
  const applied = new Set((cardState.results ?? []).filter((r) => r.status === 'applied').map((r) => r.id))
  return cardState.changeSet.operations
    .filter((op) => !isRecordEditOperation(op) && !applied.has(op.id))
    .map((op) => op.id)
}

/**
 * Returns true when the survey changed since the proposal for a pending operation (the card shows a warning;
 * Apply reports these operations as conflicts).
 * @param {object} params - Parameters.
 * @param {ChangeSetCardState} params.cardState - Card state.
 * @param {object} params.survey - Current survey.
 * @returns {boolean} True when stale.
 */
export const isCardStale = ({ cardState, survey }: { cardState: ChangeSetCardState; survey: any }): boolean => {
  return getConflictingOperationIds({ cardState, survey }).length > 0
}

/**
 * Returns the pending operations that conflict with the current survey (they stay unchecked and cannot be selected).
 * @param {object} params - Parameters.
 * @param {ChangeSetCardState} params.cardState - Card state.
 * @param {object} params.survey - Current survey.
 * @returns {string[]} Operation ids.
 */
export const getConflictingOperationIds = ({
  cardState,
  survey,
}: {
  cardState: ChangeSetCardState
  survey: any
}): string[] => {
  const operationIds = getPendingOperationIds(cardState)
  if (operationIds.length === 0) return []
  return findConflicts(cardState.changeSet, survey, { operationIds }).map((conflict) => conflict.id)
}

/**
 * Returns the nearest page node definition containing a node definition.
 * @param {object} nodeDef - Node definition.
 * @param {object} survey - Survey.
 * @param {string} cycle - Cycle.
 * @returns {object} The page node definition.
 */
const findPageNodeDef = (nodeDef: any, survey: any, cycle: string): any => {
  let current = NodeDef.isEntity(nodeDef) ? nodeDef : Survey.getNodeDefParent(nodeDef)(survey)
  while (current && !NodeDef.isRoot(current) && !NodeDefLayout.hasPage(cycle)(current)) {
    current = Survey.getNodeDefParent(current)(survey)
  }
  return current ?? Survey.getNodeDefRoot(survey)
}

/**
 * Returns how to show a node definition in the form designer: select it ("all node definitions" tree mode) or
 * open the nearest page that contains it.
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey.
 * @param {string} params.nodeDefUuid - Node definition.
 * @param {string} params.cycle - Current cycle.
 * @param {string} params.viewMode - Tree select view mode of the designer.
 * @returns {NodeDefNavigation|null} The navigation; null when the node definition doesn't exist (yet).
 */
export const getNodeDefNavigation = ({
  survey,
  nodeDefUuid,
  cycle,
  viewMode,
}: {
  survey: any
  nodeDefUuid: string
  cycle: string
  viewMode: string
}): NodeDefNavigation | null => {
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  if (!nodeDef) return null
  if (viewMode === TreeSelectViewMode.allNodeDefs) return { type: 'select', nodeDefUuid }
  return { type: 'page', pageNodeDefUuid: NodeDef.getUuid(findPageNodeDef(nodeDef, survey, cycle)), nodeDefUuid }
}
