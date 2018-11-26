const R = require('ramda')
const {uuidv4} = require('./../uuid')

const expressionProp = 'expression'
const applyIfProp = 'applyIf'

const createDefaultValuePlaceholder = () => ({
  uuid: uuidv4(),
  placeholder: true,
  expression: '',
  applyIf: '',
})

module.exports = {
  //CREATE
  createDefaultValuePlaceholder,

  //READ
  getExpression: R.prop(expressionProp),
  getApplyIf: R.prop(applyIfProp),

  //UPDATE
  setExpression: expression => R.assoc(expressionProp, expression),
  setApplyIf: applyIf => R.assoc(applyIfProp, applyIf),
}