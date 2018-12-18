const R = require('ramda')
const {uuidv4} = require('./../uuid')
const {isBlank} = require('../stringUtils')

// ====== CREATE
const keys = {
  placeholder: 'placeholder',
  expression: 'expression',
  applyIf: 'applyIf',
}

const createExpressionPlaceholder = () => ({
  uuid: uuidv4(),
  placeholder: true,
  expression: '',
  applyIf: '',
})

// ====== READ
const getExpression = R.prop(keys.expression)

const getApplyIf = R.prop(keys.applyIf)

const isPlaceholder = R.propEq(keys.placeholder, true)

const isEmpty = (expression = {}) => isBlank(getExpression(expression)) && isBlank(getApplyIf(expression))

// ====== UPDATE
const assocProp = (propName, value) => R.pipe(
  R.assoc(propName, value),
  R.dissoc(keys.placeholder),
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
  isPlaceholder,

  //UPDATE
  assocExpression: expression => assocProp(keys.expression, expression),
  assocApplyIf: applyIf => assocProp(keys.applyIf, applyIf),

  //UTILS
  findReferencedNodeDefs
}
