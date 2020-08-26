import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  id: ObjectUtils.keys.id,
  props: ObjectUtils.keys.props,
  resolved: 'resolved',
  nodeDefUuid: ObjectUtils.keys.nodeDefUuid,
}

export const propKeys = {
  expressionType: 'expressionType',
  expression: 'expression',
  applyIf: 'applyIf',
  messages: 'messages',
}

export const exprTypes = {
  applicable: 'applicable',
  codeParent: 'codeParent',
  defaultValue: 'defaultValue',
  validationRuleError: 'validationRuleError',
  validationRuleWarning: 'validationRuleWarning',
}

export const newReportItem = (expressionType, expression, applyIf, messages) => ({
  [propKeys.expressionType]: expressionType,
  [propKeys.expression]: expression,
  [propKeys.applyIf]: applyIf,
  [propKeys.messages]: messages,
})

export const { getId } = ObjectUtils
export const isResolved = R.propOr(false, keys.resolved)
export const getNodeDefUuid = R.prop(keys.nodeDefUuid)
export const getProps = R.prop(keys.props)

export const getExpressionType = ObjectUtils.getProp(propKeys.expressionType)
export const getExpression = ObjectUtils.getProp(propKeys.expression, '')
export const getApplyIf = ObjectUtils.getProp(propKeys.applyIf, '')
export const getMessages = ObjectUtils.getProp(propKeys.messages, '')
