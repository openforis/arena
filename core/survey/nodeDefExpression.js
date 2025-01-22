import * as R from 'ramda'

import { NodeDefExpressionFactory } from '@openforis/arena-core/dist/nodeDef/nodeDef'

import * as ValidationResult from '@core/validation/validationResult'

import * as StringUtils from '@core/stringUtils'
import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  applyIf: 'applyIf',
  expression: 'expression',
  messages: 'messages',
  placeholder: 'placeholder',
  severity: 'severity',
}

// ====== CREATE

export const createExpression = ({
  expression = undefined,
  applyIf = undefined,
  severity = undefined,
  messages = undefined,
  placeholder = false,
}) => NodeDefExpressionFactory.createInstance({ applyIf, expression, messages, placeholder, severity })

export const createExpressionPlaceholder = () => createExpression({ placeholder: true })

// ====== READ

export const { getUuid } = ObjectUtils

export const getExpression = R.propOr('', keys.expression)

export const getApplyIf = R.prop(keys.applyIf)

export const getMessages = (expression) => R.propOr({}, keys.messages)(expression)

export const getMessage = (lang, defaultValue = '') => R.pipe(getMessages, R.propOr(defaultValue, lang))

export const getSeverity = R.propOr(ValidationResult.severity.error, keys.severity)

export const isPlaceholder = R.propEq(keys.placeholder, true)

export const isExpressionEmpty = (expression = {}) => StringUtils.isBlank(getExpression(expression))
export const isApplyIfEmpty = (expression = {}) => StringUtils.isBlank(getApplyIf(expression))
export const isEmpty = (expression = {}) => isExpressionEmpty(expression) && isApplyIfEmpty(expression)

export const isSimilarTo = (expressionA) => (expressionB) => {
  if (isEmpty(expressionA) && isEmpty(expressionB)) return true
  if (isEmpty(expressionA) || isEmpty(expressionB)) return false
  const prepareExpr = (expr) => StringUtils.removeSuffix('\n')(expr.replaceAll(' ', ''))
  return (
    prepareExpr(getExpression(expressionA)) === prepareExpr(getExpression(expressionB)) &&
    prepareExpr(getApplyIf(expressionA)) === prepareExpr(getApplyIf(expressionB))
  )
}

// ====== UPDATE

const assocProp = (propName, value) => R.pipe(R.assoc(propName, value), R.dissoc(keys.placeholder))

// ====== UTILS

export const { isEqual } = ObjectUtils

// UPDATE
export const assocExpression = (expression) => assocProp(keys.expression, expression)
export const assocApplyIf = (applyIf) => assocProp(keys.applyIf, applyIf)
export const assocMessages = (messages) => assocProp(keys.messages, messages)
export const assocSeverity = (severity) => assocProp(keys.severity, severity)
