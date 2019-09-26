const R = require('ramda')

const { uuidv4 } = require('./../uuid')

const ValidationResult = require('../validation/validationResult')

const StringUtils = require('../stringUtils')
const ObjectUtils = require('../objectUtils')

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

const assocMessages = messages => assocProp(keys.messages, messages)

const assocMessage = message =>
  nodeDefExpression => {
    const messagesOld = getMessages(nodeDefExpression)
    const messagesNew = R.assoc(message.lang, message.label, messagesOld)
    return assocMessages(messagesNew)(nodeDefExpression)
  }

const assocSeverity = severity => assocProp(keys.severity, severity)

// ====== UTILS

const extractNodeDefNames = (jsExpr = '') => {
  if (StringUtils.isBlank(jsExpr))
    return []

  const names = []
  const regex = /(node|sibling)\(['"](\w+)['"]\)/g

  let matches
  while (matches = regex.exec(jsExpr)) {
    names.push(matches[2])
  }
  return names
}

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
  assocMessage,
  assocSeverity,

  //UTILS
  findReferencedNodeDefs
}
