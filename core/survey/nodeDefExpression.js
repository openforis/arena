import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'

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
  expression = '',
  applyIf = '',
  severity = ValidationResult.severity.error,
  messages = {},
  placeholder = false,
}) => ({
  applyIf,
  expression,
  placeholder,
  messages,
  severity,
  uuid: uuidv4(),
})

export const createExpressionPlaceholder = () => createExpression({ placeholder: true })

// ====== READ

export const { getUuid } = ObjectUtils

export const getExpression = R.propOr('', keys.expression)

export const getApplyIf = R.prop(keys.applyIf)

export const getMessages = (expression) => R.propOr({}, keys.messages)(expression)

export const getMessage = (lang, defaultValue = '') => R.pipe(getMessages, R.propOr(defaultValue, lang))

export const getSeverity = R.propOr(ValidationResult.severity.error, keys.severity)

export const isPlaceholder = R.propEq(keys.placeholder, true)

export const isEmpty = (expression = {}) =>
  StringUtils.isBlank(getExpression(expression)) && StringUtils.isBlank(getApplyIf(expression))

export const isEqualTo = (expressionA) => (expressionB) => {
  if (isEmpty(expressionA) && isEmpty(expressionB)) return true
  if (isEmpty(expressionA) || isEmpty(expressionB)) return false
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
