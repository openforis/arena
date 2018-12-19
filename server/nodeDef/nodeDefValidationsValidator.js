const R = require('ramda')

const NodeDefValidations = require('../../common/survey/nodeDefValidations')
const NodeDef = require('../../common/survey/nodeDef')
const Validator = require('../../common/validation/validator')
const NodeDefExpressionsValidator = require('./nodeDefExpressionsValidator')

const validate = async (survey, nodeDef, nodeDefValidations) => {
  const validation = NodeDef.isNodeDefMultiple(nodeDef)
    ? await Validator.validate(nodeDefValidations, {
      'count.min': [Validator.validatePositiveNumber],
      'count.max': [Validator.validatePositiveNumber],
    })
    : {}

  return R.pipe(
    R.assocPath(['fields', 'expressions'], await NodeDefExpressionsValidator.validate(survey, nodeDef, NodeDefValidations.getExpressions(nodeDefValidations))),
    Validator.cleanup
  )(validation)
}

module.exports = {
  validate
}