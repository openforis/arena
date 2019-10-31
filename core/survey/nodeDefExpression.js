const R = require('ramda')

const { uuidv4 } = require('@core/uuid')

const ValidationResult = require('@core/validation/validationResult')

const StringUtils = require('@core/stringUtils')
const ObjectUtils = require('@core/objectUtils')

const Expression = require('@core/expressionParser/expression')
const Evaluator = require('@core/expressionParser/helpers/evaluator')

const keys = {
  placeholder: 'placeholder',
  expression: 'expression',
  applyIf: 'applyIf',
  messages: 'messages',
  severity: 'severity'
}

// ====== CREATE

const createExpression = (expression = '', applyIf = '', placeholder = false) => ({
  uuid: uuidv4(),
  expression,
  applyIf,
  placeholder
})

// ====== READ

const getExpression = R.prop(keys.expression)

const getApplyIf = R.prop(keys.applyIf)

const getMessages = R.propOr({}, keys.messages)

const getSeverity = R.propOr(ValidationResult.severities.error, keys.severity)

const isPlaceholder = R.propEq(keys.placeholder, true)

const isEmpty = (expression = {}) => StringUtils.isBlank(getExpression(expression)) && StringUtils.isBlank(getApplyIf(expression))

// ====== UPDATE

const assocProp = (propName, value) => R.pipe(
  R.assoc(propName, value),
  R.dissoc(keys.placeholder),
)

// ====== UTILS

const extractNodeDefNames = (jsExpr = '') =>
  StringUtils.isBlank(jsExpr)
  ? []
  : Evaluator.getExpressionIdentifiers(Expression.fromString(jsExpr))

const findReferencedNodeDefs = nodeDefExpressions =>
  R.pipe(
    R.reduce((acc, nodeDefExpr) =>
        R.pipe(
          R.concat(extractNodeDefNames(getExpression(nodeDefExpr))),
          R.concat(extractNodeDefNames(getApplyIf(nodeDefExpr))),
        )(acc),
      []
    ),
    R.uniq
  )(nodeDefExpressions)

module.exports = {
  keys,

  //CREATE
  createExpression,
  createExpressionPlaceholder: () => createExpression('', '', true),

  //READ
  getUuid: ObjectUtils.getUuid,
  getExpression,
  getApplyIf,
  getMessages,
  getMessage: (lang, defaultValue = '') => R.pipe(
    getMessages,
    R.propOr(defaultValue, lang)
  ),
  getSeverity,
  isEmpty,
  isPlaceholder,

  //UPDATE
  assocExpression: expression => assocProp(keys.expression, expression),
  assocApplyIf: applyIf => assocProp(keys.applyIf, applyIf),
  assocMessages: messages => assocProp(keys.messages, messages),
  assocSeverity: severity => assocProp(keys.severity, severity),

  //UTILS
  findReferencedNodeDefs
}
