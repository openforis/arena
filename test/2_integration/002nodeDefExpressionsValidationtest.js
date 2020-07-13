import * as R from 'ramda'

import * as SurveyValidator from '@core/survey/surveyValidator'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Validation from '@core/validation/validation'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'

import { fetchFullContextSurvey } from '../testContext'

const validateExpression = async (survey, nodeDefName, expression) => {
  const nodeDef = R.pipe(
    Survey.getNodeDefByName(nodeDefName),
    NodeDef.mergePropsAdvanced({
      [NodeDef.keysPropsAdvanced.validations]: {
        [NodeDefValidations.keys.expressions]: [{ [NodeDefExpression.keys.expression]: expression }],
      },
    })
  )(survey)

  return SurveyValidator.validateNodeDefExpressions(survey, nodeDef, Survey.dependencyTypes.validations)
}

/**
 * Expression: {
 * t = title
 * n = context node
 * e = expression
 * v = true/false expected to be valid or not
 * }.
 */
const expressions = [
  /*{
    t: 'Test a literal number',
    n: 'node_def_text',
    e: '123',
    v: true,
  },
  {
    t: 'Test a literal string',
    n: 'node_def_text',
    e: '"123"',
    v: true,
  },
  {
    t: 'Test using a node itself as an expression',
    n: 'node_def_text',
    e: 'node_def_text',
    v: true,
  },
  {
    t: 'Test using a sibling value',
    n: 'node_def_text',
    e: 'sibling1',
    v: true,
  },
  {
    t: 'Test using an ancestor attribute value',
    n: 'node_def_text',
    e: 'ancestor1',
    v: true,
  },
  {
    t: 'Test using a node that does not exist',
    n: 'node_def_text',
    e: 'undefined_node',
    v: false,
  },
  {
    t: 'Test using a node that exists but is not reachable in the ancestor hierarchy',
    n: 'node_def_text',
    e: 'unreachable_node',
    v: false,
  },
  {
    t: 'Test an expression with a syntax error',
    n: 'node_def_text',
    e: '+',
    v: false,
  },*/
  {
    t: 'Test an expression with a type error',
    n: 'node_def_text',
    e: '1 + node_def_text',
    v: false,
  },
  /*{
    t: 'Test appending number to a string',
    n: 'node_def_text',
    e: 'node_def_text + 1',
    v: true,
  },
  {
    t: 'Test appending string to a string',
    n: 'node_def_text',
    e: 'node_def_text + " - " + node_def_text',
    v: true,
  },*/
]

export const NodeDefExpressions = async () => {
  describe('NodeDefExpressions Validation Test', () => {
    expressions.forEach((expr) => {
      test(expr.t, async () => {

        const survey = await fetchFullContextSurvey()
        const validation = await validateExpression(survey, expr.n, expr.e)
        console.log(expr, expr.v, Validation.isValid(validation), survey, validation)
        expect(Validation.isValid(validation)).toBe(expr.v)
        expect(Validation.isValid(Validation.getFieldValidation('0')(validation))).toBe(expr.v)
      })
    })
  })
}
