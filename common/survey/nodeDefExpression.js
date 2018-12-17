const R = require('ramda')
const {uuidv4} = require('./../uuid')
const {isBlank} = require('../stringUtils')

const expressionProp = 'expression'
const applyIfProp = 'applyIf'

// ====== CREATE
const createExpressionPlaceholder = () => ({
  uuid: uuidv4(),
  placeholder: true,
  expression: '',
  applyIf: '',
})

// ====== READ
const getExpression = R.prop(expressionProp)

const getApplyIf = R.prop(applyIfProp)

const isEmpty = (expression = {}) => isBlank(expression.expression) && isBlank(expression.applyIf)

// ====== UPDATE
const assocProp = (propName, value) => R.pipe(
  R.assoc(propName, value),
  R.dissoc('placeholder'),
)

// ====== UTILS
const extractNodeDefNames = (jsExpr = '') => {
  if (isBlank(jsExpr))
    return []

  const names = []
  const regex = /(node|sibling)\('(\w+)'\)/g

  let matches
  while (matches = regex.exec(jsExpr)) {
    names.push(matches[2])
  }
  return names
}

const findReferencedNodeDefs = nodeDefExpressions => {
  const names = []
  for (const nodeDefExpr of nodeDefExpressions) {
    names.push.apply(names, extractNodeDefNames(getExpression(nodeDefExpr)))
    names.push.apply(names, extractNodeDefNames(getApplyIf(nodeDefExpr)))
  }
  return names
}

module.exports = {
  //CREATE
  createExpressionPlaceholder,

  //READ
  getExpression,
  getApplyIf,
  isEmpty,

  //UPDATE
  assocExpression: expression => assocProp(expressionProp, expression),
  assocApplyIf: applyIf => assocProp(applyIfProp, applyIf),

  //UTILS
  findReferencedNodeDefs
}
