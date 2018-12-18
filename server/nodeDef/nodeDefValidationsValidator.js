const Validator = require('../../common/validation/validator')
const NodeDefExpressionsValidator = require('./nodeDefExpressionsValidator')

const propsValidations = (survey, nodeDef) => ({
  'expressions': [NodeDefExpressionsValidator.validate(survey, nodeDef)]
})

const validate = async (survey, nodeDef, nodeDefValidations) =>
  await Validator.validate(nodeDefValidations, propsValidations(survey, nodeDef))

module.exports = {
  validate
}