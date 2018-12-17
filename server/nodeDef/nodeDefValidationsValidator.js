const R = require('ramda')

const NodeDefValidations = require('../../common/survey/nodeDefValidations')
const NodeDefExpressionValidator = require('./nodeDefExpressionValidator')

const validate = async nodeDefValidations => {
  const fieldValidations = {
    expressions: await NodeDefExpressionValidator.validate(NodeDefValidations.getExpressions(nodeDefValidations)),
  }
  const invalidFieldValidations = R.reject(R.propEq('valid', true), fieldValidations)

  return {
    valid: R.isEmpty(invalidFieldValidations),
    fields: invalidFieldValidations
  }
}

module.exports = {
  validate
}