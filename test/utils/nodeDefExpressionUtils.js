import * as RecordExpressionParser from '@core/record/recordExpressionParser'
import * as Survey from '@core/survey/survey'
import * as NodeDefExpressionValidator from '@core/survey/nodeDefExpressionValidator'

import * as RecordUtils from './recordUtils'

const getTestTitle = ({ q, n = null }) => (n ? `${q} (${n})` : q)

/**
 * Generates the cases for test.each: the title of the test and the query object.
 * @param {!Array} queries - The queries to test.
 * @returns {Array} - The test cases.
 */
export const toTestCases = (queries) => queries.map((query) => [getTestTitle(query), query])

const toComparableResult = ({ result, resultExpected }) => {
  if (typeof resultExpected === 'function') {
    return { actual: result, expected: resultExpected() }
  }
  const resKeys = resultExpected && typeof resultExpected === 'object' ? Object.keys(resultExpected) : []
  if (resKeys.length === 0) {
    return { actual: result, expected: resultExpected }
  }
  // compare only the expected keys (or array items)
  const actual = Array.isArray(resultExpected)
    ? resultExpected.map((_item, index) => result[index])
    : Object.fromEntries(resKeys.map((key) => [key, result[key]]))
  return { actual, expected: resultExpected }
}

/**
 * Evaluates a query and returns its result (or the error thrown) together with the expected one.
 * @param {!object} params - The parameters.
 * @param {!object} params.query - The query to test (q: expression, r: expected result, n: node path, e: expected error, s: self reference allowed).
 * @param {!object} params.expressionEvaluator - Function evaluating the expression.
 * @returns {Promise<{actual: unknown, expected: unknown}>} - The actual and the expected result.
 */
export const evaluateQuery = async ({ query, expressionEvaluator }) => {
  const { q, r, n = null, e = null, s = true } = query
  try {
    const result = await expressionEvaluator({ nodePath: n, query: q, selfReferenceAllowed: s })
    return toComparableResult({ result, resultExpected: r })
  } catch (error) {
    if (e) {
      return { actual: error, expected: e }
    }
    throw error
  }
}

export const recordExpressionEvaluator =
  ({ surveyFn, recordFn }) =>
  async ({ nodePath, query }) => {
    const survey = surveyFn()
    const record = recordFn()
    const node = RecordUtils.findNodeByPath(nodePath || 'cluster/cluster_id')(survey, record)
    expect(node).toBeDefined()
    return RecordExpressionParser.evalNodeQuery(survey, record, node, query)
  }

export const nodeDefExpressionEvaluator =
  ({ surveyFn }) =>
  async ({ nodePath, query, selfReferenceAllowed }) => {
    const survey = surveyFn()
    const nodeDefCurrent = Survey.getNodeDefByName(nodePath || 'cluster_id')(survey)
    const validationResult = await NodeDefExpressionValidator.validate({
      survey,
      nodeDefCurrent,
      exprString: query,
      selfReferenceAllowed,
    })
    return validationResult === null
  }
