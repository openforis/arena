/**
 * Pure helpers on change set operations: target, current value, and applying one operation to a node definition or
 * to a survey copy.
 */
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as Taxonomy from '@core/survey/taxonomy'

import { getExpressionProp, setExpressionProp } from './expressionProps'
import { isRecordEditOperation } from './recordEdits/types'
import {
  isNodeDefRefProp,
  type NodeDefOperation,
  type NodeDefOperationDraft,
  type LabelKind,
  type NodeDefBasicProp,
  type NodeDefRefProp,
  type NodeDefUpdateProp,
} from './types'

// category item label operations never reach these helpers (previewChangeSet, findConflicts and applyChangeSet route
// them apart)
type AnyOperation = NodeDefOperation | NodeDefOperationDraft

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
  if (op.type === 'nodeDef.create' || isRecordEditOperation(op)) return null
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
 * Returns the value of an update property.
 * @param {object} nodeDef - Node definition.
 * @param {NodeDefUpdateProp} prop - Property.
 * @returns {string|boolean|null} The value; null for a reference that is not set.
 */
export const getUpdatePropValue = (nodeDef: any, prop: NodeDefUpdateProp): string | boolean | null =>
  isNodeDefRefProp(prop)
    ? (NodeDef.getProp(prop, null)(nodeDef) as string | null) || null
    : getBasicPropValue(nodeDef, prop)

/**
 * Tells whether the designer lets the category or taxonomy of a node definition change.
 * @param {object} survey - Survey.
 * @param {object} nodeDef - Node definition.
 * @param {NodeDefRefProp} prop - Reference property.
 * @returns {boolean} True when it may change (CodeProps / TaxonProps rules).
 */
export const canUpdateNodeDefRef = (survey: any, nodeDef: any, prop: NodeDefRefProp): boolean =>
  prop === 'categoryUuid'
    ? // a child code attribute keeps its parent: the designer resets it on a category change, the assistant does not
      Survey.canUpdateCategory(nodeDef)(survey) && !NodeDef.getParentCodeDefUuid(nodeDef)
    : !NodeDef.isPublished(nodeDef) || Survey.isTemplate(Survey.getSurveyInfo(survey))

/**
 * Returns the category or taxonomy a reference points to.
 * @param {object} survey - Survey.
 * @param {NodeDefRefProp} prop - Reference property.
 * @param {string} uuid - Category or taxonomy uuid.
 * @returns {object|null} The category or taxonomy; null when it is not in the survey.
 */
export const findNodeDefRef = (survey: any, prop: NodeDefRefProp, uuid: string): any | null =>
  (prop === 'categoryUuid' ? Survey.getCategoryByUuid(uuid)(survey) : Survey.getTaxonomyByUuid(uuid)(survey)) ?? null

/**
 * Returns the name of the category or taxonomy a reference points to.
 * @param {object} survey - Survey.
 * @param {NodeDefRefProp} prop - Reference property.
 * @param {string|null} uuid - Category or taxonomy uuid.
 * @returns {string|null} The name; the uuid when it is not in the survey; null when not set.
 */
export const getNodeDefRefName = (survey: any, prop: NodeDefRefProp, uuid: string | null): string | null => {
  if (!uuid) return null
  const ref = findNodeDefRef(survey, prop, uuid)
  if (!ref) return uuid
  return prop === 'categoryUuid' ? Category.getName(ref) : Taxonomy.getName(ref)
}

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
  if (isRecordEditOperation(op)) return null
  if (op.type === 'nodeDef.update') return getUpdatePropValue(nodeDef, op.prop)
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
  if (isRecordEditOperation(op)) return nodeDef
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
  if (isRecordEditOperation(op)) return survey
  if (op.type === 'nodeDef.create') return Survey.assocNodeDef({ nodeDef: op.nodeDef })(survey)
  const nodeDef = Survey.getNodeDefByUuid(op.nodeDefUuid)(survey)
  return Survey.assocNodeDef({ nodeDef: applyOperationToNodeDef(nodeDef, op) })(survey)
}
