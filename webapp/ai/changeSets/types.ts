/**
 * Change sets: what the Design assistant proposes. Built and validated in the browser, applied only by the user.
 */
import type { NodeDef as ArenaNodeDef, NodeDefExpression, NodeDefType } from '@openforis/arena-core'

import type { RecordAttributeUpdateOperation } from './recordEdits/types'
import type { CategoryItemLabelSetOperation } from './categoryItemLabels/types'

export type NodeDefBasicProp = 'name' | 'key' | 'multiple' | 'readOnly'

// tuples (as const), so zod's z.enum accepts them
export const nodeDefBasicProps = ['name', 'key', 'multiple', 'readOnly'] as const satisfies readonly NodeDefBasicProp[]

// category / taxonomy of a code / taxon attribute (uuids; the tool takes names)
export type NodeDefRefProp = 'categoryUuid' | 'taxonomyUuid'

export const nodeDefRefProps = ['categoryUuid', 'taxonomyUuid'] as const satisfies readonly NodeDefRefProp[]

export type NodeDefUpdateProp = NodeDefBasicProp | NodeDefRefProp

/**
 * Tells whether an update property is a category or taxonomy reference.
 * @param {string} prop - Property.
 * @returns {boolean} True for categoryUuid and taxonomyUuid.
 */
export const isNodeDefRefProp = (prop: string): prop is NodeDefRefProp =>
  (nodeDefRefProps as readonly string[]).includes(prop)

export type NodeDefExpressionProp =
  'defaultValues' | 'applicable' | 'validations.expressions' | 'visibleIf' | 'editableIf'

export const nodeDefExpressionProps = [
  'defaultValues',
  'applicable',
  'validations.expressions',
  'visibleIf',
  'editableIf',
] as const satisfies readonly NodeDefExpressionProp[]

export type LabelKind = 'labels' | 'descriptions'

export type NodeDefCreateOperation = {
  id: string
  type: 'nodeDef.create'
  nodeDef: ArenaNodeDef<NodeDefType>
  parentUuid: string
}

export type NodeDefUpdateOperation = {
  id: string
  type: 'nodeDef.update'
  nodeDefUuid: string
  prop: NodeDefUpdateProp
  from: string | boolean | null
  to: string | boolean
}

export type LabelSetOperation = {
  id: string
  type: 'label.set'
  nodeDefUuid: string
  kind: LabelKind
  lang: string
  from: string | null
  to: string
}

export type ExpressionSetOperation = {
  id: string
  type: 'expression.set'
  nodeDefUuid: string
  prop: NodeDefExpressionProp
  from: NodeDefExpression[]
  to: NodeDefExpression[]
}

export type ChangeOperation =
  | NodeDefCreateOperation
  | NodeDefUpdateOperation
  | LabelSetOperation
  | ExpressionSetOperation
  | RecordAttributeUpdateOperation
  | CategoryItemLabelSetOperation

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

// an operation before buildChangeSet gives it an id
export type ChangeOperationDraft = DistributiveOmit<ChangeOperation, 'id'>

// operations on node definitions (and record edits): category item labels take their own path
export type NodeDefOperation = Exclude<ChangeOperation, CategoryItemLabelSetOperation>

export type NodeDefOperationDraft = DistributiveOmit<NodeDefOperation, 'id'>

export type ChangeSet = {
  id: string
  surveyId: number
  summary: string
  operations: ChangeOperation[]
  createdAt: string
}

export type OperationStatus = 'applied' | 'conflict' | 'failed' | 'skipped'

// params: the server's message params (record edits)
export type OperationResult = {
  id: string
  status: OperationStatus
  message?: string
  params?: Record<string, unknown>
}

// operation: index in the change set; field: what the message is about (e.g. "name", "defaultValues")
export type ChangeSetIssue = { operation: number; field: string; message: string }

// prettier-ignore
export type PlainConflictReason =
  | 'nodeDefMissing'
  | 'valueChanged'
  | 'parentMissing'
  | 'nameTaken'
  | 'alreadyExists'
  | 'refMissing'
  | 'itemMissing'

// a full i18n key (e.g. "aiAssistant.issues.refEditDisabled", "validationErrors:nodeDefEdit.defaultValuesInvalid"):
// the designer's rules no longer allow the operation; its interpolation values are in `params`
export type I18nKeyConflictReason = `${string}.${string}` | `${string}:${string}`

export type ConflictReason = PlainConflictReason | I18nKeyConflictReason

/**
 * Tells whether a conflict reason or result message is an i18n key to translate with its params. The plain reasons
 * are single camelCase words; a key always has a "." or a ":".
 * @param {string} reason - Conflict reason or result message.
 * @returns {boolean} True for an i18n key.
 */
export const isI18nKeyReason = (reason: string): reason is I18nKeyConflictReason => /[.:]/.test(reason)

// params: the interpolation values of an i18n key reason
export type OperationConflict = { id: string; reason: ConflictReason; params?: Record<string, unknown> }

export type ChangeSetPreview = { survey: any; validation: { valid: boolean; issues: ChangeSetIssue[] } }

// what the conversation keeps per card
export type ChangeSetCardState = { changeSet: ChangeSet; results?: OperationResult[]; discarded?: boolean }
