const SurveyInfoValidator = require('./_surveyValidator/surveyInfoValidator')
const NodeDefValidator = require('./_surveyValidator/nodeDefValidator')
const NodeDefExpressionsValidator = require('./_surveyValidator/nodeDefExpressionsValidator')

module.exports = {
  validateNewSurvey: SurveyInfoValidator.validateNewSurvey,

  validateSurveyInfo: SurveyInfoValidator.validateSurveyInfo,

  validateNodeDefs: NodeDefValidator.validateNodeDefs,

  validateNodeDefExpressions: NodeDefExpressionsValidator.validate,
}