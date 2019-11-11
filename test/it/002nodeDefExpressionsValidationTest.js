const { expect } = require('chai')

const SurveyValidator = require('@core/survey/surveyValidator')
const Survey = require('@core/survey/survey')
const NodeDef = require('@core/survey/nodeDef')
const NodeDefValidations = require('@core/survey/nodeDefValidations')
const Validation = require('@core/validation/validation')
const NodeDefExpression = require('@core/survey/nodeDefExpression')

const { fetchFullContextSurvey } = require('../testContext')

const validateExpression = async (survey, nodeDefName, expression) => {
  const nodeDef = Survey.getNodeDefByName(nodeDefName)(survey)

  nodeDef[NodeDef.keys.props] = {
    ...NodeDef.getProps(nodeDef),
    [NodeDef.propKeys.validations]: {
      [NodeDefValidations.keys.expressions]: [
        { [NodeDefExpression.keys.expression]: expression }
      ]
    }
  }

  return await SurveyValidator.validateNodeDefExpressions(survey, nodeDef, Survey.dependencyTypes.validations)
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
    t: 'Test a literal number',
    n: 'node_def_text',
    e: '123',
    v: true
  },
  {
    t: 'Test a literal string',
    n: 'node_def_text',
    e: '"123"',
    v: true
  },
  {
    t: 'Test using a node itself as an expression',
    n: 'node_def_text',
    e: 'node_def_text',
    v: true
  },
  {
    t: 'Test using a sibling value',
    n: 'node_def_text',
    e: 'sibling1',
    v: true
  },
  {
    t: 'Test using an ancestor attribute value',
    n: 'node_def_text',
    e: 'ancestor1',
    v: true
  },
  {
    t: 'Test using a node that does not exist',
    n: 'node_def_text',
    e: 'undefined_node',
    v: false
  },
  {
    t: 'Test using a node that exists but is not reachable in the ancestor hierarchy',
    n: 'node_def_text',
    e: 'unreachable_node',
    v: false
  },
  {
    t: 'Test an expression with a syntax error',
    n: 'node_def_text',
    e: '+',
    v: false
  },
  {
    t: 'Test an expression with a type error',
    n: 'node_def_text',
    e: '1 + node_def_text',
    v: false
  },
  {
    t: 'Test appending number to a string',
    n: 'node_def_text',
    e: 'node_def_text + 1',
    v: true
  },
  {
    t: 'Test appending string to a string',
    n: 'node_def_text',
    e: 'node_def_text + " - " + node_def_text',
    v: true
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