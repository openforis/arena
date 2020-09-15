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
  { q: '3 ** 9', r: 19683 },
  { q: 'ln(2)', r: 0.6931471805599453 },
  { q: 'log10(10)', r: 1 },
  { q: 'log10(100) == 2', r: true },
]

describe('ExpressionParser test', () => {
  queries.forEach((query) => {
    test(query.q, () => {
      const res = Expression.evalString(query.q)
      expect(query.r).toEqual(res)
    })
  })
})
