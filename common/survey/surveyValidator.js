const R = require('ramda')

const Validator = require('../validation/validator')

const NodeDefValidator = require('./_surveyValidator/nodeDefValidator')
const NodeDefExpressionsValidator = require('./_surveyValidator/nodeDefExpressionsValidator')

const validateSurvey = async survey => {

  //TODO merge surveyInfo validation with NodeDefValidator.validateNodeDefs

}

module.exports = {
  validateSurvey,

  validateNodeDefs: NodeDefValidator.validateNodeDefs,
  validateNodeDefExpressions: NodeDefExpressionsValidator.validate,


  validateNodeDefsOld: NodeDefValidator.validateNodeDefsOld,
}