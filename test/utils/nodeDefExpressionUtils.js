import * as RecordExpressionParser from '@core/record/recordExpressionParser'
import * as Survey from '@core/survey/survey'
import * as NodeDefExpressionValidator from '@core/survey/nodeDefExpressionValidator'

import * as RecordUtils from './recordUtils'

const _expectResult = ({ result, resultExpected }) => {
  const resKeys = resultExpected && typeof resultExpected === 'object' ? Object.keys(resultExpected) : []
  if (resKeys.length === 0) {
    const resExpected = resultExpected instanceof Function ? resultExpected() : resultExpected
    expect(result).toEqual(resExpected)
  } else {
    resKeys.forEach((key) => expect(result[key]).toEqual(resultExpected[key]))
  }
}

const _testExpressions = ({ queries, expressionEvaluator }) =>
  queries.forEach(({ q, r, n = null, e = null, s = true }) => {
    const testTitle = `${q}${n ? ` (${n})` : ''}`

    it(testTitle, () => {
      try {
        const result = expressionEvaluator({ nodePath: n, query: q, selfReferenceAllowed: s })
        _expectResult({ result, resultExpected: r })
      } catch (error) {
        if (e) {
          expect(error).toEqual(e)
        } else {
          throw error
        }
      }
    })
  })

export const testRecordExpressions = ({ surveyFn, recordFn, queries }) =>
  _testExpressions({
    queries,
    expressionEvaluator: ({ nodePath, query }) => {
      const survey = surveyFn()
      const record = recordFn()
      const node = RecordUtils.findNodeByPath(nodePath || 'cluster/cluster_id')(survey, record)
      expect(node).toBeDefined()
      return RecordExpressionParser.evalNodeQuery(survey, record, node, query)
    },
  })

export const testNodeDefExpressions = ({ surveyFn, queries }) =>
  _testExpressions({
    queries,
    expressionEvaluator: ({ nodePath, query, selfReferenceAllowed }) => {
      const survey = surveyFn()
      const nodeDefCurrent = Survey.getNodeDefByName(nodePath || 'cluster_id')(survey)
      const validationResult = NodeDefExpressionValidator.validate({
        survey,
        nodeDefCurrent,
        exprString: query,
        selfReferenceAllowed,
      })
      return validationResult === null
    },
  })
