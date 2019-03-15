const R = require('ramda')

const SurveyUtils = require('./surveyUtils')

const keys = {
  props: 'props',
  resolved: 'resolved',
  nodeDefUuid: 'nodeDefUuid'
}

const propKeys = {
  expressionType: 'expressionType',
  expression: 'expression',
  applyIf: 'applyIf',
  messages: 'messages'
}

const exprTypes = {
  applicable: 'applicable'
}

const errorKeys = {
  couldNotParseExpression: 'couldNotParseExpression',
  couldNotImportAllDefaultValues: 'couldNotImportAllDefaultValues',
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
  errorKeys,

  createItem,

  isResolved: R.propOr(false, keys.resolved),
  getNodeDefUuid: R.prop(keys.nodeDefUuid),
  getProps: R.prop(keys.props),

  getExpressionType: SurveyUtils.getProp(propKeys.expressionType),
  getExpression: SurveyUtils.getProp(propKeys.expression, ''),
  getApplyIf: SurveyUtils.getProp(propKeys.applyIf, ''),
  getMessages: SurveyUtils.getProp(propKeys.messages, ''),
}