import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'

const keys = {
  props: ObjectUtils.keys.props,
  resolved: 'resolved',
  nodeDefUuid: ObjectUtils.keys.nodeDefUuid,
}

const propKeys = {
  expressionType: 'expressionType',
  expression: 'expression',
  applyIf: 'applyIf',
  messages: 'messages',
}

export const exprTypes = {
  applicable: 'applicable',
  codeParent: 'codeParent',
  defaultValue: 'defaultValue',
  validationRules: 'validationRules',
}

export const newReportItem = (
  expressionType,
  expression,
  applyIf,
  messages,
) => ({
  [propKeys.expressionType]: expressionType,
  [propKeys.expression]: expression,
  [propKeys.applyIf]: applyIf,
  [propKeys.messages]: messages,
})

export const isResolved = R.propOr(false, keys.resolved)
export const getNodeDefUuid = R.prop(keys.nodeDefUuid)
export const getProps = R.prop(keys.props)

export const getExpressionType = ObjectUtils.getProp(propKeys.expressionType)
export const getExpression = ObjectUtils.getProp(propKeys.expression, '')
export const getApplyIf = ObjectUtils.getProp(propKeys.applyIf, '')
export const getMessages = ObjectUtils.getProp(propKeys.messages, '')
