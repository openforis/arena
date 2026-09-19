import * as A from '@core/arena'

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

export const newReportItem = ({
  nodeDefUuid,
  expressionType,
  expression = null,
  applyIf = null,
  messages = {},
  resolved = false,
}) => ({
  [keys.nodeDefUuid]: nodeDefUuid,
  [keys.props]: {
    [propKeys.expressionType]: expressionType,
    [propKeys.expression]: expression,
    [propKeys.applyIf]: applyIf,
    [propKeys.messages]: messages,
  },
  [keys.resolved]: resolved,
})

export const { getId } = ObjectUtils
export const isResolved = A.propOr(false, keys.resolved)
export const getNodeDefUuid = A.prop(keys.nodeDefUuid)
export const getProps = A.prop(keys.props)

export const getExpressionType = ObjectUtils.getProp(propKeys.expressionType)
export const getExpression = ObjectUtils.getProp(propKeys.expression, '')
export const getApplyIf = ObjectUtils.getProp(propKeys.applyIf, '')
export const getMessages = ObjectUtils.getProp(propKeys.messages, '')
