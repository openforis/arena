const R = require('ramda')

const ObjectUtils = require('@core/objectUtils')

const keys = {
  props: ObjectUtils.keys.props,
  resolved: 'resolved',
  nodeDefUuid: ObjectUtils.keys.nodeDefUuid,
}

const propKeys = {
  expressionType: 'expressionType',
  expression: 'expression',
  applyIf: 'applyIf',
  messages: 'messages'
}

const exprTypes = {
  applicable: 'applicable',
  codeParent: 'codeParent',
  defaultValue: 'defaultValue',
  validationRules: 'validationRules',
}

const newReportItem = (expressionType, expression, applyIf, messages) => ({
  [propKeys.expressionType]: expressionType,
  [propKeys.expression]: expression,
  [propKeys.applyIf]: applyIf,
  [propKeys.messages]: messages,
})

module.exports = {
  keys,
  propKeys,
  exprTypes,

  newReportItem,

  isResolved: R.propOr(false, keys.resolved),
  getNodeDefUuid: R.prop(keys.nodeDefUuid),
  getProps: R.prop(keys.props),

  getExpressionType: ObjectUtils.getProp(propKeys.expressionType),
  getExpression: ObjectUtils.getProp(propKeys.expression, ''),
  getApplyIf: ObjectUtils.getProp(propKeys.applyIf, ''),
  getMessages: ObjectUtils.getProp(propKeys.messages, ''),
}