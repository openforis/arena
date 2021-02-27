import * as RecordExpressionParser from '@core/record/recordExpressionParser'

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

const _testExpressions = ({ queries, expressionEvaluator }) => {
  queries.forEach(({ q, r, n, e }) => {
    const testTitle = `${q}${n ? ` (${n})` : ''}`

    it(testTitle, () => {
      try {
        const result = expressionEvaluator({ nodePath: n, query: q })
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
}

export const testRecordExpressions = ({ surveyFn, recordFn, queries }) => {
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
}
