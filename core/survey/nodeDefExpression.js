import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'

import * as ValidationResult from '@core/validation/validationResult'

import * as StringUtils from '@core/stringUtils'
import * as ObjectUtils from '@core/objectUtils'

import * as Expression from '@core/expressionParser/expression'

export const keys = {
  placeholder: 'placeholder',
  expression: 'expression',
  applyIf: 'applyIf',
  messages: 'messages',
  severity: 'severity',
}

// ====== CREATE

export const createExpression = (
  expression = '',
  applyIf = '',
  placeholder = false,
) => ({
  uuid: uuidv4(),
  expression,
  applyIf,
  placeholder,
})

export const createExpressionPlaceholder = () => createExpression('', '', true)

// ====== READ

export const getUuid = ObjectUtils.getUuid

export const getExpression = R.prop(keys.expression)

export const getApplyIf = R.prop(keys.applyIf)

export const getMessages = R.propOr({}, keys.messages)

export const getMessage = (lang, defaultValue = '') =>
  R.pipe(getMessages, R.propOr(defaultValue, lang))

export const getSeverity = R.propOr(
  ValidationResult.severity.error,
  keys.severity,
)

export const isPlaceholder = R.propEq(keys.placeholder, true)

export const isEmpty = (expression = {}) =>
  StringUtils.isBlank(getExpression(expression)) &&
  StringUtils.isBlank(getApplyIf(expression))

// ====== UPDATE

const assocProp = (propName, value) =>
  R.pipe(R.assoc(propName, value), R.dissoc(keys.placeholder))

// ====== UTILS

const extractNodeDefNames = (jsExpr = '') =>
  StringUtils.isBlank(jsExpr)
    ? []
    : Expression.getExpressionIdentifiers(Expression.fromString(jsExpr))

export const findReferencedNodeDefs = nodeDefExpressions =>
  R.pipe(
    R.reduce(
      (acc, nodeDefExpr) =>
        R.pipe(
          R.concat(extractNodeDefNames(getExpression(nodeDefExpr))),
          R.concat(extractNodeDefNames(getApplyIf(nodeDefExpr))),
        )(acc),
      [],
    ),
    R.uniq,
  )(nodeDefExpressions)

// UPDATE
export const assocExpression = expression =>
  assocProp(keys.expression, expression)
export const assocApplyIf = applyIf => assocProp(keys.applyIf, applyIf)
export const assocMessages = messages => assocProp(keys.messages, messages)
export const assocSeverity = severity => assocProp(keys.severity, severity)
