/**
 * Change sets: what the Design assistant proposes. Built and validated in the browser, applied only by the user.
 */
import type { NodeDef as ArenaNodeDef, NodeDefExpression, NodeDefType } from '@openforis/arena-core'

export type NodeDefBasicProp = 'name' | 'key' | 'multiple' | 'readOnly'

// tuples (as const), so zod's z.enum accepts them
export const nodeDefBasicProps = ['name', 'key', 'multiple', 'readOnly'] as const satisfies readonly NodeDefBasicProp[]

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
  prop: NodeDefBasicProp
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
  NodeDefCreateOperation | NodeDefUpdateOperation | LabelSetOperation | ExpressionSetOperation

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

// an operation before buildChangeSet gives it an id
export type ChangeOperationDraft = DistributiveOmit<ChangeOperation, 'id'>

export type ChangeSet = {
  id: string
  surveyId: number
  summary: string
  operations: ChangeOperation[]
  createdAt: string
}

export type OperationStatus = 'applied' | 'conflict' | 'failed' | 'skipped'

export type OperationResult = { id: string; status: OperationStatus; message?: string }

// operation: index in the change set; field: what the message is about (e.g. "props.name", "defaultValues")
export type ChangeSetIssue = { operation: number; field: string; message: string }

export type ConflictReason = 'nodeDefMissing' | 'valueChanged' | 'parentMissing' | 'nameTaken' | 'alreadyExists'

export type OperationConflict = { id: string; reason: ConflictReason }

export type ChangeSetPreview = { survey: any; validation: { valid: boolean; issues: ChangeSetIssue[] } }

// what the conversation keeps per card
export type ChangeSetCardState = { changeSet: ChangeSet; results?: OperationResult[]; discarded?: boolean }
