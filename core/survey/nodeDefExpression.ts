import { NodeDefExpressionFactory } from '@openforis/arena-core'
import type {
  Labels,
  NodeDefExpression as ArenaNodeDefExpression,
  NodeDefExpressionFactoryParams,
  ValidationSeverity,
} from '@openforis/arena-core'

import * as A from '@core/arena'

import * as ValidationResult from '@core/validation/validationResult'

import * as StringUtils from '@core/stringUtils'
import * as ObjectUtils from '@core/objectUtils'

// placeholder: expression row added in the UI and not filled yet
type NodeDefExpression = ArenaNodeDefExpression & { placeholder?: boolean }
type ExpressionUpdater = (expression: NodeDefExpression) => NodeDefExpression
// enum member or its string value (e.g. 'warning')
type Severity = ValidationSeverity | `${ValidationSeverity}`

export const keys = {
  applyIf: 'applyIf',
  expression: 'expression',
  messages: 'messages',
  placeholder: 'placeholder',
  severity: 'severity',
} as const

// ====== CREATE

type CreateExpressionParams = {
  expression?: string
  applyIf?: string
  severity?: Severity
  messages?: Labels
  placeholder?: boolean
}

export const createExpression = ({
  expression = undefined,
  applyIf = undefined,
  severity = undefined,
  messages = undefined,
  placeholder = false,
}: CreateExpressionParams): NodeDefExpression =>
  // the factory keeps every non-empty param (placeholder included, not declared in its params type)
  NodeDefExpressionFactory.createInstance({
    applyIf,
    expression,
    messages,
    placeholder,
    severity,
  } as NodeDefExpressionFactoryParams)

export const createExpressionPlaceholder = (): NodeDefExpression => createExpression({ placeholder: true })

// ====== READ

export const { getUuid } = ObjectUtils

export const getExpression = (expression: NodeDefExpression): string =>
  A.propOr('', keys.expression)(expression) as string

export const getApplyIf = (expression: NodeDefExpression): string | undefined =>
  A.prop(keys.applyIf)(expression) as string | undefined

export const getMessages = (expression: NodeDefExpression): Labels => A.propOr({}, keys.messages)(expression) as Labels

export const getMessage =
  (lang: string, defaultValue = '') =>
  (expression: NodeDefExpression): string =>
    A.propOr(defaultValue, lang)(getMessages(expression)) as string

export const getSeverity = (expression: NodeDefExpression): ValidationSeverity =>
  A.propOr(ValidationResult.severity.error, keys.severity)(expression) as ValidationSeverity

export const isPlaceholder = (expression: NodeDefExpression): boolean => A.propEq(keys.placeholder, true)(expression)

export const isExpressionEmpty = (expression: NodeDefExpression = {} as NodeDefExpression): boolean =>
  StringUtils.isBlank(getExpression(expression))
export const isApplyIfEmpty = (expression: NodeDefExpression = {} as NodeDefExpression): boolean =>
  StringUtils.isBlank(getApplyIf(expression))
export const isEmpty = (expression: NodeDefExpression = {} as NodeDefExpression): boolean =>
  isExpressionEmpty(expression) && isApplyIfEmpty(expression)

const prepareExprForComparison = (expr: string | undefined): string =>
  StringUtils.isBlank(expr) ? '' : StringUtils.removeSuffix('\n')(expr.replaceAll(' ', ''))

export const isSimilarTo =
  (expressionA: NodeDefExpression) =>
  (expressionB: NodeDefExpression): boolean => {
    if (isEmpty(expressionA) && isEmpty(expressionB)) return true
    if (isEmpty(expressionA) || isEmpty(expressionB)) return false
    return (
      prepareExprForComparison(getExpression(expressionA)) === prepareExprForComparison(getExpression(expressionB)) &&
      prepareExprForComparison(getApplyIf(expressionA)) === prepareExprForComparison(getApplyIf(expressionB))
    )
  }

// ====== UPDATE

const assocProp =
  (propName: string, value: unknown): ExpressionUpdater =>
  (expression) =>
    A.dissoc(keys.placeholder, A.assoc(propName, value, expression))

// ====== UTILS

export const { isEqual } = ObjectUtils

// UPDATE
export const assocExpression = (expression: string): ExpressionUpdater => assocProp(keys.expression, expression)
export const assocApplyIf = (applyIf: string): ExpressionUpdater => assocProp(keys.applyIf, applyIf)
export const assocMessages = (messages: Labels): ExpressionUpdater => assocProp(keys.messages, messages)
export const assocSeverity = (severity: Severity): ExpressionUpdater => assocProp(keys.severity, severity)
