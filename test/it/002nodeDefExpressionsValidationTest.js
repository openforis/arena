const {expect} = require('chai')

const SurveyValidator = require('../../core/survey/surveyValidator')
const Survey = require('../../core/survey/survey')
const Validation = require('../../core/validation/validation')
const NodeDefExpression = require('../../core/survey/nodeDefExpression')

const {fetchFullContextSurvey} = require('../testContext')

const validateExpression = async (survey, nodeDefName, expression) => {
  const nodeDef = Survey.getNodeDefByName(nodeDefName)(survey)

  const expressions = [{[NodeDefExpression.keys.expression]: expression}]

  return await SurveyValidator.validateNodeDefExpressions(survey, nodeDef, expressions)
}

/**
 * expression: {
 *   t = title
 *   n = context node
 *   e = expression
 *   v = true/false expected to be valid or not
 * }
 */
const expressions = [
  {
    t: 'Test "this" expression',
    n: 'node_def_text',
    e: 'this',
    v: true
  },
  {
    t: 'Test "parent()" expression',
    n: 'node_def_text',
    e: 'this.parent()',
    v: true
  },
  {
    t: 'Test "node()" expression',
    n: 'node_def_text',
    e: 'this.value * 1',
    v: true
  },
  {
    t: 'Test "sibling()" expression',
    n: 'node_def_text',
    e: 'this.parent().node("node_def_text")',
    v: true
  },
  {
    t: 'Test syntax error',
    n: 'node_def_text',
    e: 'this.parent().node("undefined_node")',
    v: false
  },
  {
    t: 'Test invalid node expression',
    n: 'node_def_text',
    e: 'this.node("node_def_2")',
    v: false
  },
  {
    t: 'Test invalid sibling expression',
    n: 'node_def_text',
    e: 'this.sibling("undefined_node")',
    v: false
  },
  {
    t: 'Test invalid node expression on attribute',
    n: 'node_def_text',
    e: 'this.value ==== 1',
    v: false
  },
]

describe('NodeDefExpressions Validation Test', async () => {
  const survey = await fetchFullContextSurvey()

  for (const expr of expressions) {
    it(expr.t, async () => {
      const validation = await validateExpression(survey, expr.n, expr.e)
      expect(expr.v).to.equal(Validation.isValid(validation))
      expect(expr.v).to.equal(Validation.isValid(Validation.getFieldValidation('0')(validation)))
    })
  }
})