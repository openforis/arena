const R = require('ramda')

const ObjectUtils = require('../objectUtils')

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
  check: 'check',
}

const createItem = (expressionType, expression, applyIf = null, messages = null) => ({
  [propKeys.expressionType]: expressionType,
  [propKeys.expression]: expression,
  [propKeys.applyIf]: applyIf,
  [propKeys.messages]: messages,
})

module.exports = {
  keys,
  propKeys,
  exprTypes,

  createItem,

  isResolved: R.propOr(false, keys.resolved),
  getNodeDefUuid: R.prop(keys.nodeDefUuid),
  getProps: R.prop(keys.props),

  getExpressionType: ObjectUtils.getProp(propKeys.expressionType),
  getExpression: ObjectUtils.getProp(propKeys.expression, ''),
  getApplyIf: ObjectUtils.getProp(propKeys.applyIf, ''),
  getMessages: ObjectUtils.getProp(propKeys.messages, ''),
}