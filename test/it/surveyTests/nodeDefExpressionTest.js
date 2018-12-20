const {expect} = require('chai')

const NodeDefManager = require('../../../server/nodeDef/nodeDefManager')
const NodeDefExpressionsValidator = require('../../../server/nodeDef/nodeDefExpressionsValidator')
const Survey = require('../../../common/survey/survey')
const NodeDefExpression = require('../../../common/survey/nodeDefExpression')

const {getContextSurvey} = require('./../../testContext')

const fetchNodeDefs = async () => {
  const survey = getContextSurvey()
  return await NodeDefManager.fetchNodeDefsBySurveyId(Survey.getSurveyInfo(survey).id, true, true, true)
}

const validateExpression = async (nodeDefName, expression, valid = true) => {
  const nodeDefs = await fetchNodeDefs()
  const survey = Survey.assocNodeDefs(nodeDefs)(getContextSurvey())

  const nodeDef = Survey.getNodeDefByName(nodeDefName)(survey)

  const expressions = [{[NodeDefExpression.keys.expression]: expression}]

  const validation = await NodeDefExpressionsValidator.validate(survey, nodeDef, expressions)

  expect(validation.valid).to.equal(valid)
  expect(validation.fields['0'].valid).to.equal(valid)
}

module.exports = {
  validateThisExpressionTest: async () => validateExpression('node_def_text', 'this'),
  validateParentExpressionTest: async () => validateExpression('node_def_text', 'this.parent()'),
  validateBinaryExpressionTest: async () => validateExpression('node_def_text', 'this.value * 1'),
  validateNodeExpressionTest: async () => validateExpression('node_def_text', 'this.parent().node(\'node_def_text\')'),
  validateSiblingExpressionTest: async () => validateExpression('node_def_text', 'this.sibling(\'node_def_2\')'),
  validateInvalidNodeExpressionTest: async () => validateExpression('node_def_text', 'this.parent().node(\'undefined_node\')', false),
  validateInvalidNodeExpressionOnAttributeTest: async () => validateExpression('node_def_text', 'this.node(\'node_def_2\')', false),
  validateInvaldSiblingExpressionTest: async () => validateExpression('node_def_text', 'this.sibling(\'undefined_node\')', false),
  validateSyntaxErrorTest: async () => validateExpression('node_def_text', 'this.value ==== 1', false),
}