import * as Expression from '@core/expressionParser/expression'

const queries = [
  { q: '1 + 1', r: 2 },
  { q: '3 * 8 - 4', r: 20 },
  { q: 'pow(2,3) + 1', r: 9 },
  { q: 'pow(2,3) + 1 > 10', r: false },
  { q: 'pow(2,3) + 1 > 10 - 8', r: true },
  { q: '16 / pow(2, 3) - 2', r: 0 },
  { q: '16 / (pow(2, 3) - 2)', r: 2.6666666666666665 },
  { q: '16 / (pow(2, 3) - 2) == 2.6666666666666665', r: true },
]

describe('ExpressionParser test', () => {
  queries.forEach((query) => {
    it(query.q, () => {
      const res = Expression.evalString(query.q)
      expect(res).toEqual(query.r)
    })
  })
})
