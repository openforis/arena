/**
 * Validates a change set on a copy of the survey with the form designer's validators. A proposal that the designer
 * would refuse never reaches a card.
 */
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as SurveyValidator from '@core/survey/surveyValidator'
import { isKeyEditDisabled, isMaxKeysCountReached, isMultipleEditDisabled } from '@core/survey/nodeDefEditGuards'

import { checkNodeDefExpression, singleExpressionProps } from './expressionProps'
import { isAssistantNodeDefType } from './newNodeDef'
import { applyOperationToSurvey, getOperationNodeDefUuid, getOperationTargetKey } from './operations'
import { isRecordEditOperation } from './recordEdits/types'
import { collectValidationIssues } from './validationIssues'
import type {
  ChangeOperation,
  ChangeSet,
  ChangeSetIssue,
  ChangeSetPreview,
  ExpressionSetOperation,
  LabelSetOperation,
  NodeDefCreateOperation,
  NodeDefUpdateOperation,
} from './types'

type Translate = (key: string, params?: Record<string, unknown>) => string
type FieldIssue = { field: string; message: string }
type CheckParams<T> = { survey: any; op: T; t: Translate }

// the validator checks these expression props itself (validateNodeDef)
const PROPS_CHECKED_BY_VALIDATOR = new Set(['defaultValues', 'applicable', 'validations.expressions'])

const issue = (t: Translate, field: string, key: string, params: Record<string, unknown> = {}): FieldIssue[] => [
  { field, message: t(`aiAssistant.issues.${key}`, params) },
]

const nodeDefNotFound = (t: Translate, uuid: string) => issue(t, 'nodeDefUuid', 'nodeDefNotFound', { name: uuid })

const surveyLanguages = (survey: any): string[] =>
  Survey.getLanguages(Survey.getSurveyInfo(survey)) as unknown as string[]

// languages of a labels/descriptions map that the survey does not have
const checkTextLanguages = (survey: any, nodeDef: any, t: Translate): FieldIssue[] => {
  const languages = surveyLanguages(survey)
  const kinds = [
    ['labels', NodeDef.getLabels(nodeDef)],
    ['descriptions', NodeDef.getDescriptions(nodeDef)],
  ] as const
  return kinds.flatMap(([kind, texts]) =>
    Object.keys(texts ?? {})
      .filter((lang) => !languages.includes(lang))
      .flatMap((lang) => issue(t, `${kind}.${lang}`, 'languageNotInSurvey', { lang }))
  )
}

// the designer's multiple/key guards on a node definition that is about to be created
const checkCreateMultipleAndKey = ({ survey, nodeDef, t }: { survey: any; nodeDef: any; t: Translate }) => {
  const name = NodeDef.getName(nodeDef)
  const multiple = NodeDef.isMultiple(nodeDef)
  if (multiple && !NodeDef.canNodeDefBeMultiple(nodeDef)) return issue(t, 'multiple', 'multipleNotAllowed', { name })
  if (!NodeDef.isKey(nodeDef)) return []
  if (!NodeDef.canNodeDefBeKey(nodeDef)) return issue(t, 'key', 'keyNotAllowed', { name })
  const maxKeysCountReached = isMaxKeysCountReached({ survey, nodeDef })
  return isKeyEditDisabled({ nodeDef, maxKeysCountReached }) ? issue(t, 'key', 'keyEditDisabled', { name }) : []
}

const checkCreate = ({ survey, op, t }: CheckParams<NodeDefCreateOperation>): FieldIssue[] => {
  const { nodeDef, parentUuid } = op
  const type = NodeDef.getType(nodeDef)
  if (Survey.getNodeDefByUuid(NodeDef.getUuid(nodeDef))(survey)) {
    return issue(t, 'nodeDef', 'duplicateOperation', { name: NodeDef.getName(nodeDef) })
  }
  if (NodeDef.getParentUuid(nodeDef) !== parentUuid) {
    return issue(t, 'parentUuid', 'parentNotFound', { name: String(NodeDef.getParentUuid(nodeDef)) })
  }
  if (!isAssistantNodeDefType(type)) return issue(t, 'type', 'typeNotAllowed', { type })
  const parent = Survey.getNodeDefByUuid(parentUuid)(survey)
  if (!parent) return issue(t, 'parentUuid', 'parentNotFound', { name: parentUuid })
  const name = NodeDef.getName(parent)
  if (!NodeDef.isEntity(parent)) return issue(t, 'parentUuid', 'parentNotEntity', { name })
  const cycle = NodeDef.getCycles(nodeDef)[0]
  if (NodeDef.isEntity(nodeDef) && NodeDefLayout.isRenderTable(cycle)(parent)) {
    return issue(t, 'parentUuid', 'entityUnderTable', { name })
  }
  return [...checkTextLanguages(survey, nodeDef, t), ...checkCreateMultipleAndKey({ survey, nodeDef, t })]
}

// the designer's guards on changing "multiple" or "key" of an existing node definition
const checkMultipleOrKeyUpdate = ({
  survey,
  nodeDef,
  op,
  t,
}: CheckParams<NodeDefUpdateOperation> & { nodeDef: any }) => {
  const name = NodeDef.getName(nodeDef)
  if (op.prop === 'multiple') {
    if (!NodeDef.canNodeDefBeMultiple(nodeDef)) return issue(t, op.prop, 'multipleNotAllowed', { name })
    const cycle = NodeDef.getCycles(nodeDef)[0]
    return isMultipleEditDisabled({ survey, nodeDef, cycle }) ? issue(t, op.prop, 'multipleEditDisabled', { name }) : []
  }
  if (!NodeDef.canNodeDefBeKey(nodeDef)) return issue(t, op.prop, 'keyNotAllowed', { name })
  const maxKeysCountReached = isMaxKeysCountReached({ survey, nodeDef })
  return isKeyEditDisabled({ nodeDef, maxKeysCountReached }) ? issue(t, op.prop, 'keyEditDisabled', { name }) : []
}

const checkUpdate = ({ survey, op, t }: CheckParams<NodeDefUpdateOperation>): FieldIssue[] => {
  const nodeDef = Survey.getNodeDefByUuid(op.nodeDefUuid)(survey)
  if (!nodeDef) return nodeDefNotFound(t, op.nodeDefUuid)
  const field = op.prop
  if (NodeDef.isRoot(nodeDef)) return issue(t, field, 'rootEntity')
  if (op.prop === 'multiple' && NodeDef.isEntity(nodeDef)) return issue(t, field, 'entityMultipleChange')
  if (op.prop === 'multiple' && op.to === true && NodeDef.getDefaultValues(nodeDef).length > 0) {
    return issue(t, field, 'multipleWithDefaultValues')
  }
  if (op.prop === 'multiple' || op.prop === 'key') return checkMultipleOrKeyUpdate({ survey, nodeDef, op, t })
  return []
}

const checkLabel = ({ survey, op, t }: CheckParams<LabelSetOperation>): FieldIssue[] => {
  if (!Survey.getNodeDefByUuid(op.nodeDefUuid)(survey)) return nodeDefNotFound(t, op.nodeDefUuid)
  const languages = surveyLanguages(survey)
  return languages.includes(op.lang) ? [] : issue(t, `${op.kind}.${op.lang}`, 'languageNotInSurvey', { lang: op.lang })
}

const checkExpressionOperation = ({ survey, op, t }: CheckParams<ExpressionSetOperation>): FieldIssue[] => {
  if (!Survey.getNodeDefByUuid(op.nodeDefUuid)(survey)) return nodeDefNotFound(t, op.nodeDefUuid)
  if (singleExpressionProps.includes(op.prop) && op.to.length > 1) return issue(t, op.prop, 'singleExpressionOnly')
  if (op.to.some((expression) => NodeDefExpression.isExpressionEmpty(expression))) {
    return issue(t, op.prop, 'expressionEmpty')
  }
  return []
}

const checkStructure = (params: CheckParams<ChangeOperation>): FieldIssue[] => {
  const { op } = params
  if (isRecordEditOperation(op)) return []
  if (op.type === 'nodeDef.create') return checkCreate({ ...params, op })
  if (op.type === 'nodeDef.update') return checkUpdate({ ...params, op })
  if (op.type === 'label.set') return checkLabel({ ...params, op })
  return checkExpressionOperation({ ...params, op })
}

const checkDuplicate = (op: ChangeOperation, seenKeys: Set<string>, survey: any, t: Translate): FieldIssue[] => {
  const key = getOperationTargetKey(op)
  if (key === null) return []
  if (!seenKeys.has(key)) {
    seenKeys.add(key)
    return []
  }
  const nodeDef = Survey.getNodeDefByUuid(getOperationNodeDefUuid(op))(survey)
  const field = op.type === 'label.set' ? `${op.kind}.${op.lang}` : String((op as { prop: string }).prop)
  return issue(t, field, 'duplicateOperation', { name: nodeDef ? NodeDef.getName(nodeDef) : '' })
}

// applies the operations in order, skipping (and reporting) those with structural issues
const applyOperations = (changeSet: ChangeSet, survey: any, t: Translate) => {
  const issues: ChangeSetIssue[] = []
  const firstOperationByUuid = new Map<string, number>()
  const seenKeys = new Set<string>()
  let draft = survey
  for (const [index, op] of changeSet.operations.entries()) {
    // record edits are previewed on the records, not on the survey
    if (isRecordEditOperation(op)) continue
    const opIssues = [...checkStructure({ survey: draft, op, t }), ...checkDuplicate(op, seenKeys, draft, t)]
    if (opIssues.length > 0) {
      issues.push(...opIssues.map((opIssue) => ({ operation: index, ...opIssue })))
      continue
    }
    draft = applyOperationToSurvey(draft, op)
    const uuid = getOperationNodeDefUuid(op)
    if (!firstOperationByUuid.has(uuid)) firstOperationByUuid.set(uuid, index)
  }
  return { draft, issues, firstOperationByUuid }
}

const validateTouchedNodeDefs = async (
  draft: any,
  firstOperationByUuid: Map<string, number>,
  t: Translate
): Promise<ChangeSetIssue[]> => {
  const issues: ChangeSetIssue[] = []
  for (const [uuid, operation] of firstOperationByUuid) {
    const nodeDef = Survey.getNodeDefByUuid(uuid)(draft)
    const validation = await SurveyValidator.validateNodeDef(draft, nodeDef)
    if (SurveyValidator.isNodeDefValidationValidOrHasOnlyMissingChildrenErrors(nodeDef, validation)) continue
    issues.push(...collectValidationIssues(validation, t).map((fieldIssue) => ({ operation, ...fieldIssue })))
  }
  return issues
}

const checkOtherExpressions = async (changeSet: ChangeSet, draft: any, t: Translate): Promise<ChangeSetIssue[]> => {
  const issues: ChangeSetIssue[] = []
  for (const [index, op] of changeSet.operations.entries()) {
    if (isRecordEditOperation(op) || op.type !== 'expression.set' || PROPS_CHECKED_BY_VALIDATOR.has(op.prop)) continue
    const nodeDef = Survey.getNodeDefByUuid(op.nodeDefUuid)(draft)
    if (!nodeDef) continue
    for (const expression of op.to) {
      const messages = await checkNodeDefExpression({ survey: draft, nodeDef, prop: op.prop, expression, t })
      issues.push(...messages.map((message) => ({ operation: index, field: op.prop, message })))
    }
  }
  return issues
}

/**
 * Applies a change set to a copy of the survey and validates it as the form designer would.
 * @param {ChangeSet} changeSet - Change set.
 * @param {object} survey - Draft survey (not modified).
 * @param {object} options - Options.
 * @param {Translate} options.t - Translator for the issue messages.
 * @returns {Promise<ChangeSetPreview>} The survey with the changes and the validation.
 */
export const previewChangeSet = async (
  changeSet: ChangeSet,
  survey: any,
  { t }: { t: Translate }
): Promise<ChangeSetPreview> => {
  const { draft, issues, firstOperationByUuid } = applyOperations(changeSet, survey, t)
  if (issues.length === 0) {
    issues.push(...(await validateTouchedNodeDefs(draft, firstOperationByUuid, t)))
    issues.push(...(await checkOtherExpressions(changeSet, draft, t)))
  }
  return { survey: draft, validation: { valid: issues.length === 0, issues } }
}
