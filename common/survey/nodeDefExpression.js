const R = require('ramda')
const {uuidv4} = require('./../uuid')
const {isBlank} = require('../stringUtils')

const expressionProp = 'expression'
const applyIfProp = 'applyIf'

const keys = {
  placeholder: 'placeholder'
}

const createExpressionPlaceholder = () => ({
  uuid: uuidv4(),
  placeholder: true,
  expression: '',
  applyIf: '',
})

const assocProp = (propName, value) => R.pipe(
  R.assoc(propName, value),
  R.dissoc(keys.placeholder),
)

const isEmpty = (expression = {}) => isBlank(expression.expression) && isBlank(expression.applyIf)

module.exports = {
  //CREATE
  createExpressionPlaceholder,

  //READ
  getExpression: R.prop(expressionProp),
  getApplyIf: R.prop(applyIfProp),
  isEmpty,
  isPlaceholder: R.propEq(keys.placeholder, true),

  //UPDATE
  assocExpression: expression => assocProp(expressionProp, expression),
  assocApplyIf: applyIf => assocProp(applyIfProp, applyIf),
}