/**
 * Pure helpers on change set operations: target, current value, and applying one operation to a node definition or
 * to a survey copy.
 */
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { getExpressionProp, setExpressionProp } from './expressionProps'
import type { ChangeOperation, ChangeOperationDraft, LabelKind, NodeDefBasicProp } from './types'

type AnyOperation = ChangeOperation | ChangeOperationDraft

/**
 * Returns the uuid of the node definition the operation works on.
 * @param {ChangeOperation} op - Operation.
 * @returns {string} The uuid.
 */
export const getOperationNodeDefUuid = (op: AnyOperation): string =>
  op.type === 'nodeDef.create' ? NodeDef.getUuid(op.nodeDef) : op.nodeDefUuid

/**
 * Returns a key identifying the property the operation changes (two operations with the same key conflict).
 * @param {ChangeOperation} op - Operation.
 * @returns {string|null} The key, null for creates.
 */
export const getOperationTargetKey = (op: AnyOperation): string | null => {
  if (op.type === 'nodeDef.create') return null
  if (op.type === 'label.set') return `${op.nodeDefUuid}|${op.kind}|${op.lang}`
  return `${op.nodeDefUuid}|${op.prop}`
}

/**
 * Returns the value of a basic property.
 * @param {object} nodeDef - Node definition.
 * @param {NodeDefBasicProp} prop - Property.
 * @returns {string|boolean} The value (booleans default to false).
 */
export const getBasicPropValue = (nodeDef: any, prop: NodeDefBasicProp): string | boolean =>
  prop === 'name' ? NodeDef.getName(nodeDef) : Boolean(NodeDef.getProp(prop, false)(nodeDef))

/**
 * Returns a label or description in a language.
 * @param {object} nodeDef - Node definition.
 * @param {LabelKind} kind - Labels or descriptions.
 * @param {string} lang - Language.
 * @returns {string|null} The text, null when missing or empty.
 */
export const getLabelValue = (nodeDef: any, kind: LabelKind, lang: string): string | null => {
  const texts = kind === 'labels' ? NodeDef.getLabels(nodeDef) : NodeDef.getDescriptions(nodeDef)
  return texts[lang] || null
}

/**
 * Returns the current value of what an update operation changes (compared with its `from`).
 * @param {object} nodeDef - Node definition.
 * @param {ChangeOperation} op - A non-create operation.
 * @returns {unknown} The current value.
 */
export const getOperationCurrentValue = (nodeDef: any, op: AnyOperation): unknown => {
  if (op.type === 'nodeDef.update') return getBasicPropValue(nodeDef, op.prop)
  if (op.type === 'label.set') return getLabelValue(nodeDef, op.kind, op.lang)
  if (op.type === 'expression.set') return getExpressionProp(nodeDef, op.prop)
  return null
}

const assocText = (nodeDef: any, kind: LabelKind, lang: string, text: string): any =>
  kind === 'labels'
    ? NodeDef.assocLabels({ ...NodeDef.getLabels(nodeDef), [lang]: text })(nodeDef)
    : NodeDef.assocDescriptions({ ...NodeDef.getDescriptions(nodeDef), [lang]: text })(nodeDef)

/**
 * Applies a non-create operation to a node definition.
 * @param {object} nodeDef - Node definition.
 * @param {ChangeOperation} op - Operation.
 * @returns {object} The updated node definition.
 */
export const applyOperationToNodeDef = (nodeDef: any, op: AnyOperation): any => {
  if (op.type === 'nodeDef.update') return NodeDef.assocProp({ key: op.prop, value: op.to })(nodeDef)
  if (op.type === 'label.set') return assocText(nodeDef, op.kind, op.lang, op.to)
  if (op.type === 'expression.set') return setExpressionProp(nodeDef, op.prop, op.to)
  return nodeDef
}

/**
 * Applies an operation to a survey (a new survey object; the dependency graph is not rebuilt).
 * @param {object} survey - Survey.
 * @param {ChangeOperation} op - Operation.
 * @returns {object} The updated survey.
 */
export const applyOperationToSurvey = (survey: any, op: AnyOperation): any => {
  if (op.type === 'nodeDef.create') return Survey.assocNodeDef({ nodeDef: op.nodeDef })(survey)
  const nodeDef = Survey.getNodeDefByUuid(op.nodeDefUuid)(survey)
  return Survey.assocNodeDef({ nodeDef: applyOperationToNodeDef(nodeDef, op) })(survey)
}
