const R = require('ramda')
const {uuidv4} = require('./../uuid')

const expressionProp = 'expression'
const applyIfProp = 'applyIf'

const createExpressionPlaceholder = () => ({
  uuid: uuidv4(),
  placeholder: true,
  expression: '',
  applyIf: '',
})

module.exports = {
  //CREATE
  createExpressionPlaceholder,

  //READ
  getExpression: R.prop(expressionProp),
  getApplyIf: R.prop(applyIfProp),

  //UPDATE
  assocExpression: expression => R.assoc(expressionProp, expression),
  assocApplyIf: applyIf => R.assoc(applyIfProp, applyIf),
}