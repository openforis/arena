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

const assocProp = (propName, value) => R.pipe(
  R.assoc(propName, value),
  R.dissoc('placeholder'),
)

module.exports = {
  //CREATE
  createExpressionPlaceholder,

  //READ
  getExpression: R.prop(expressionProp),
  getApplyIf: R.prop(applyIfProp),

  //UPDATE
  assocExpression: expression => assocProp(expressionProp, expression),
  assocApplyIf: applyIf => assocProp(applyIfProp, applyIf),
}